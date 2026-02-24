/**
 * Avatar Service
 * Dynamically loads avatar images from the filesystem
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';

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
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
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
   * Get all avatars (free + albums)
   */
  getAllAvatars(): AvatarsResponse {
    return {
      free: this.getFreeAvatars(),
      albums: this.getAlbums(),
    };
  }

  /**
   * Get a specific album by ID
   */
  getAlbum(albumId: string): AvatarAlbum | null {
    const albums = this.getAlbums();
    return albums.find(album => album.id === albumId) || null;
  }

  /**
   * Check if user owns an album (will integrate with DB later)
   */
  async checkAlbumOwnership(userId: string, albumId: string): Promise<boolean> {
    // TODO: Check user's purchased albums from database
    // For now, return false (user doesn't own any albums)
    return false;
  }
}

export const avatarService = new AvatarService();
export default avatarService;
