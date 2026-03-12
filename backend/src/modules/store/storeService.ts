/**
 * Store Service
 * Dynamically loads store items (avatars, sounds) from the filesystem
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { config } from '@config/env';
import { packStoreService, type StorePackPreview } from './packStoreService';
import { storePurchaseService } from './storePurchaseService';

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
      url: `${this.baseUrl}/static/store/avatars/free/${filename}`,
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
        url: `${this.baseUrl}/static/store/avatars/albums/${albumName}/${filename}`,
        type: 'avatar' as const,
      }));

      return {
        id: albumName,
        name: albumName,
        displayName: toDisplayName(albumName),
        previewUrl: previewFile
          ? `${this.baseUrl}/static/store/avatars/albums/${albumName}/${previewFile}`
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
            url: `${this.baseUrl}/static/store/sounds/${sectionName}/${filename}`,
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
              url: `${this.baseUrl}/static/store/sounds/${sectionName}/${subSectionName}/${filename}`,
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
   * Get all store data (always fresh from filesystem)
   */
  getAllStoreData(): StoreResponse {
    return {
      avatars: {
        free: this.getFreeAvatars(),
        albums: this.getAvatarAlbums(),
      },
      sounds: this.getSoundSections(),
      packs: packStoreService.getPackPreviews(),
    };
  }

  /**
   * Get only avatars
   */
  getAvatarsData() {
    return {
      free: this.getFreeAvatars(),
      albums: this.getAvatarAlbums(),
    };
  }

  /**
   * Get only sounds
   */
  getSoundsData() {
    return this.getSoundSections();
  }

  // Delegate purchase operations to storePurchaseService
  getUserOwnedStorePackIds = storePurchaseService.getUserOwnedStorePackIds.bind(storePurchaseService);
  purchaseStorePack = storePurchaseService.purchaseStorePack.bind(storePurchaseService);
  purchaseCoins = storePurchaseService.purchaseCoins.bind(storePurchaseService);
}

export const storeService = new StoreService();
export default storeService;
