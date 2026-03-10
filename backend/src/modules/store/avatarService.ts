/**
 * Avatar Service
 * Dynamically loads avatar images from the filesystem
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { config } from '../../config/env';
import { getRedis } from '../../config/redis';
import logger from '../../shared/utils/logger';

// Avatar directory paths
const AVATARS_DIR = join(__dirname, '../store/avatars');
const FREE_DIR = join(AVATARS_DIR, 'free');
const ALBUMS_DIR = join(AVATARS_DIR, 'albums');

// Supported image extensions
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

export interface AvatarImage {
  id: string;
  name: string;
  url: string;
}

export interface AvatarAlbum {
  id: string;
  name: string;
  displayName: string;
  previewUrl: string;
  avatars: AvatarImage[];
  price: number;
  avatarCount: number;
}

export interface AvatarsResponse {
  free: AvatarImage[];
  albums: AvatarAlbum[];
}

/**
 * Check if a file is an image based on extension
 */
function isImageFile(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Convert filename to display name (snake_case to Title Case)
 */
function toDisplayName(filename: string): string {
  const nameWithoutExt = basename(filename, extname(filename));
  return nameWithoutExt
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate avatar ID from path
 */
function generateAvatarId(category: string, albumOrFile: string, filename?: string): string {
  if (filename) {
    return `${category}/${albumOrFile}/${basename(filename, extname(filename))}`;
  }
  return `${category}/${basename(albumOrFile, extname(albumOrFile))}`;
}

class AvatarService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Get all free avatars
   */
  getFreeAvatars(): AvatarImage[] {
    if (!existsSync(FREE_DIR)) {
      return [];
    }

    const files = readdirSync(FREE_DIR);
    return files
      .filter(isImageFile)
      .map(filename => ({
        id: generateAvatarId('free', filename),
        name: toDisplayName(filename),
        url: `${this.baseUrl}/store/avatars/free/${filename}`,
      }));
  }

  /**
   * Get all avatar albums with their contents
   */
  getAlbums(): AvatarAlbum[] {
    if (!existsSync(ALBUMS_DIR)) {
      return [];
    }

    const albumFolders = readdirSync(ALBUMS_DIR);

    return albumFolders
      .filter(folder => {
        const folderPath = join(ALBUMS_DIR, folder);
        return statSync(folderPath).isDirectory();
      })
      .map(albumName => {
        const albumPath = join(ALBUMS_DIR, albumName);
        const files = readdirSync(albumPath).filter(isImageFile);

        // Find preview image (simple.png takes priority)
        const previewFile = files.find(f => f.toLowerCase().startsWith('simple')) || files[0];

        const avatars: AvatarImage[] = files.map(filename => ({
          id: generateAvatarId('albums', albumName, filename),
          name: toDisplayName(filename),
          url: `${this.baseUrl}/store/avatars/albums/${albumName}/${filename}`,
        }));

        return {
          id: albumName,
          name: albumName,
          displayName: toDisplayName(albumName),
          previewUrl: previewFile
            ? `${this.baseUrl}/store/avatars/albums/${albumName}/${previewFile}`
            : '',
          avatars,
          price: 100, // Default price in coins - can be stored in DB later
          avatarCount: avatars.length,
        };
      });
  }

  /**
   * Get all avatars (free + albums) — cached in Redis for 1 hour
   */
  async getAllAvatars(): Promise<AvatarsResponse> {
    return this.cachedGet('avatars:all', 3600, () => ({
      free: this.getFreeAvatars(),
      albums: this.getAlbums(),
    }));
  }

  /**
   * Get a specific album by ID — cached in Redis for 1 hour
   */
  async getAlbum(albumId: string): Promise<AvatarAlbum | null> {
    const data = await this.getAllAvatars();
    return data.albums.find(album => album.id === albumId) || null;
  }

  /**
   * Generic Redis cache helper
   */
  private async cachedGet<T>(key: string, ttl: number, compute: () => T): Promise<T> {
    try {
      const redis = getRedis();
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      const result = compute();
      await redis.set(key, JSON.stringify(result), 'EX', ttl);
      return result;
    } catch {
      logger.debug(`Cache miss/error for ${key}, computing fresh`);
      return compute();
    }
  }

  /**
   * Check if user owns an album.
   * Returns false until the Purchase model is added to the schema.
   */
  async checkAlbumOwnership(_userId: string, _albumId: string): Promise<boolean> {
    return false;
  }
}

export const avatarService = new AvatarService();
export default avatarService;
