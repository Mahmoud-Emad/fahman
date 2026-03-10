/**
 * Store Service
 * Dynamically loads store items (avatars, sounds) from the filesystem
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { prisma } from '../../config/database';
import { getRedis } from '../../config/redis';
import { ValidationError } from '../../shared/utils/errors';
import { config } from '../../config/env';
import logger from '../../shared/utils/logger';
import { packStoreService, type StorePackPreview } from './packStoreService';

// Store directory paths
const STORE_DIR = join(__dirname, '../../store');
const AVATARS_DIR = join(STORE_DIR, 'avatars');
const SOUNDS_DIR = join(STORE_DIR, 'sounds');

// Supported extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac'];

// Pricing
const AVATAR_ALBUM_PRICE = 10; // coins
const SOUND_PRICE = 5; // coins per sound

// ============================================================================
// TYPES
// ============================================================================

export interface StoreItem {
  id: string;
  name: string;
  displayName: string;
  url: string;
  type: 'avatar' | 'sound';
}

export interface AvatarAlbum {
  id: string;
  name: string;
  displayName: string;
  previewUrl: string;
  avatars: StoreItem[];
  price: number;
  itemCount: number;
}

export interface SoundItem extends StoreItem {
  type: 'sound';
  price: number;
}

export interface SoundSubSection {
  id: string;
  name: string;
  displayName: string;
  sounds: SoundItem[];
}

export interface SoundSection {
  id: string;
  name: string;
  displayName: string;
  subSections: SoundSubSection[];
  totalSounds: number;
}

export interface StoreResponse {
  avatars: {
    free: StoreItem[];
    albums: AvatarAlbum[];
  };
  sounds: SoundSection[];
  packs: StorePackPreview[];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if a file is an image
 */
function isImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Check if a file is an audio file
 */
function isAudioFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return AUDIO_EXTENSIONS.includes(ext);
}

/**
 * Convert filename/folder name to display name (snake_case/kebab-case to Title Case)
 */
function toDisplayName(name: string): string {
  const nameWithoutExt = basename(name, extname(name));
  return nameWithoutExt
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get directories in a path
 */
function getDirectories(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];

  return readdirSync(dirPath).filter(item => {
    const itemPath = join(dirPath, item);
    return statSync(itemPath).isDirectory();
  });
}

/**
 * Get files in a path
 */
function getFiles(dirPath: string, filterFn: (filename: string) => boolean): string[] {
  if (!existsSync(dirPath)) return [];

  return readdirSync(dirPath).filter(item => {
    const itemPath = join(dirPath, item);
    return statSync(itemPath).isFile() && filterFn(item);
  });
}

// ============================================================================
// STORE SERVICE
// ============================================================================

class StoreService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.baseUrl;
  }

  // --------------------------------------------------------------------------
  // AVATARS
  // --------------------------------------------------------------------------

  /**
   * Get free avatars
   */
  getFreeAvatars(): StoreItem[] {
    const freeDir = join(AVATARS_DIR, 'free');
    const files = getFiles(freeDir, isImageFile);

    return files.map(filename => ({
      id: `avatar/free/${basename(filename, extname(filename))}`,
      name: basename(filename, extname(filename)),
      displayName: toDisplayName(filename),
      url: `${this.baseUrl}/store/avatars/free/${filename}`,
      type: 'avatar' as const,
    }));
  }

  /**
   * Get avatar albums
   */
  getAvatarAlbums(): AvatarAlbum[] {
    const albumsDir = join(AVATARS_DIR, 'albums');
    const albumFolders = getDirectories(albumsDir);

    return albumFolders.map(albumName => {
      const albumPath = join(albumsDir, albumName);
      const files = getFiles(albumPath, isImageFile);

      // Find preview image (simple.png takes priority)
      const previewFile = files.find(f => f.toLowerCase().startsWith('simple')) || files[0];

      const avatars: StoreItem[] = files.map(filename => ({
        id: `avatar/albums/${albumName}/${basename(filename, extname(filename))}`,
        name: basename(filename, extname(filename)),
        displayName: toDisplayName(filename),
        url: `${this.baseUrl}/store/avatars/albums/${albumName}/${filename}`,
        type: 'avatar' as const,
      }));

      return {
        id: albumName,
        name: albumName,
        displayName: toDisplayName(albumName),
        previewUrl: previewFile
          ? `${this.baseUrl}/store/avatars/albums/${albumName}/${previewFile}`
          : '',
        avatars,
        price: AVATAR_ALBUM_PRICE,
        itemCount: avatars.length,
      };
    });
  }

  // --------------------------------------------------------------------------
  // SOUNDS
  // --------------------------------------------------------------------------

  /**
   * Get all sound sections with subsections
   * Structure: /sounds/[section]/[subsection]/[sound files]
   */
  getSoundSections(): SoundSection[] {
    const sectionFolders = getDirectories(SOUNDS_DIR);

    return sectionFolders.map(sectionName => {
      const sectionPath = join(SOUNDS_DIR, sectionName);
      const subSectionFolders = getDirectories(sectionPath);

      // Check if section has direct sound files (no subsections)
      const directSoundFiles = getFiles(sectionPath, isAudioFile);

      const subSections: SoundSubSection[] = [];

      // Add direct sounds as a subsection if they exist
      if (directSoundFiles.length > 0) {
        subSections.push({
          id: `${sectionName}/general`,
          name: 'general',
          displayName: 'General',
          sounds: directSoundFiles.map(filename => ({
            id: `sound/${sectionName}/${basename(filename, extname(filename))}`,
            name: basename(filename, extname(filename)),
            displayName: toDisplayName(filename),
            url: `${this.baseUrl}/store/sounds/${sectionName}/${filename}`,
            type: 'sound' as const,
            price: SOUND_PRICE,
          })),
        });
      }

      // Add subsection folders
      subSectionFolders.forEach(subSectionName => {
        const subSectionPath = join(sectionPath, subSectionName);
        const soundFiles = getFiles(subSectionPath, isAudioFile);

        if (soundFiles.length > 0) {
          subSections.push({
            id: `${sectionName}/${subSectionName}`,
            name: subSectionName,
            displayName: toDisplayName(subSectionName),
            sounds: soundFiles.map(filename => ({
              id: `sound/${sectionName}/${subSectionName}/${basename(filename, extname(filename))}`,
              name: basename(filename, extname(filename)),
              displayName: toDisplayName(filename),
              url: `${this.baseUrl}/store/sounds/${sectionName}/${subSectionName}/${filename}`,
              type: 'sound' as const,
              price: SOUND_PRICE,
            })),
          });
        }
      });

      const totalSounds = subSections.reduce((sum, sub) => sum + sub.sounds.length, 0);

      return {
        id: sectionName,
        name: sectionName,
        displayName: toDisplayName(sectionName),
        subSections,
        totalSounds,
      };
    });
  }

  // --------------------------------------------------------------------------
  // COMBINED
  // --------------------------------------------------------------------------

  /**
   * Get all store data (cached in Redis for 1 hour)
   */
  async getAllStoreData(): Promise<StoreResponse> {
    return this.cachedGet('store:all', 3600, async () => ({
      avatars: {
        free: this.getFreeAvatars(),
        albums: this.getAvatarAlbums(),
      },
      sounds: this.getSoundSections(),
      packs: await packStoreService.getPackPreviews(),
    }));
  }

  /**
   * Get only avatars (cached in Redis for 1 hour)
   */
  async getAvatarsData() {
    return this.cachedGet('store:avatars', 3600, () => ({
      free: this.getFreeAvatars(),
      albums: this.getAvatarAlbums(),
    }));
  }

  /**
   * Get only sounds (cached in Redis for 1 hour)
   */
  async getSoundsData() {
    return this.cachedGet('store:sounds', 3600, () => this.getSoundSections());
  }

  /**
   * Generic Redis cache helper
   */
  private async cachedGet<T>(key: string, ttl: number, compute: () => T | Promise<T>): Promise<T> {
    try {
      const redis = getRedis();
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      const result = await compute();
      await redis.set(key, JSON.stringify(result), 'EX', ttl);
      return result;
    } catch {
      logger.debug(`Cache miss/error for ${key}, computing fresh`);
      return await compute();
    }
  }

  /**
   * Purchase a coin package and add coins to user balance
   */
  async purchaseCoins(userId: string, packageId: string): Promise<{ coinsAdded: number; newBalance: number }> {
    const packages: Record<string, number> = {
      pack_50: 50,
      pack_150: 150,
      pack_500: 500,
    };

    const coinsToAdd = packages[packageId];
    if (!coinsToAdd) {
      throw new ValidationError('Invalid package. Must be one of: pack_50, pack_150, pack_500');
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: coinsToAdd } },
      select: { coins: true },
    });

    return { coinsAdded: coinsToAdd, newBalance: user.coins };
  }
}

export const storeService = new StoreService();
export default storeService;
