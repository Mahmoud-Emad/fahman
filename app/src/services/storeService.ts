/**
 * Store Service
 * API methods for marketplace/store
 */

import { api, ApiResponse } from './api';
import * as SecureStore from 'expo-secure-store';
import { transformUrl as sharedTransformUrl } from '@/utils/transformUrl';

// Storage keys for owned items
const OWNED_ALBUMS_KEY = 'owned_albums';
const OWNED_SOUNDS_KEY = 'owned_sounds';

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
  isOwned?: boolean;
}

export interface SoundItem extends StoreItem {
  type: 'sound';
  price: number;
  isOwned?: boolean;
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

export interface StoreData {
  avatars: {
    free: StoreItem[];
    albums: AvatarAlbum[];
    ownedAlbums: AvatarAlbum[];
  };
  sounds: SoundSection[];
  ownedSounds: SoundItem[];
}

// ============================================================================
// URL TRANSFORMATION
// ============================================================================

/**
 * Transform server URL to use correct base URL for current platform
 */
function transformUrl(url: string): string {
  if (!url) return '';
  return sharedTransformUrl(url) || '';
}

/**
 * Transform all URLs in store item
 */
function transformStoreItem<T extends StoreItem>(item: T): T {
  return { ...item, url: transformUrl(item.url) };
}

/**
 * Transform album with all its avatar URLs
 */
function transformAlbum(album: AvatarAlbum): AvatarAlbum {
  return {
    ...album,
    previewUrl: transformUrl(album.previewUrl),
    avatars: album.avatars.map(transformStoreItem),
  };
}

/**
 * Transform sound section with all URLs
 */
function transformSoundSection(section: SoundSection): SoundSection {
  return {
    ...section,
    subSections: section.subSections.map(sub => ({
      ...sub,
      sounds: sub.sounds.map(transformStoreItem),
    })),
  };
}

/**
 * Transform all URLs in store data
 */
function transformStoreData(data: StoreData): StoreData {
  return {
    avatars: {
      free: data.avatars.free.map(transformStoreItem),
      albums: data.avatars.albums.map(transformAlbum),
      ownedAlbums: data.avatars.ownedAlbums.map(transformAlbum),
    },
    sounds: data.sounds.map(transformSoundSection),
    ownedSounds: data.ownedSounds.map(transformStoreItem) as SoundItem[],
  };
}

// ============================================================================
// SERVICE
// ============================================================================

class StoreService {
  /**
   * Get owned album IDs from local storage
   */
  async getOwnedAlbumIds(): Promise<string[]> {
    try {
      const data = await SecureStore.getItemAsync(OWNED_ALBUMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get owned sound IDs from local storage
   */
  async getOwnedSoundIds(): Promise<string[]> {
    try {
      const data = await SecureStore.getItemAsync(OWNED_SOUNDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add an album to owned list
   */
  async addOwnedAlbum(albumId: string): Promise<void> {
    const owned = await this.getOwnedAlbumIds();
    if (!owned.includes(albumId)) {
      owned.push(albumId);
      await SecureStore.setItemAsync(OWNED_ALBUMS_KEY, JSON.stringify(owned));
    }
  }

  /**
   * Add a sound to owned list
   */
  async addOwnedSound(soundId: string): Promise<void> {
    const owned = await this.getOwnedSoundIds();
    if (!owned.includes(soundId)) {
      owned.push(soundId);
      await SecureStore.setItemAsync(OWNED_SOUNDS_KEY, JSON.stringify(owned));
    }
  }

  /**
   * Get all store data (avatars and sounds) with ownership info
   */
  async getStoreData(): Promise<ApiResponse<StoreData>> {
    // Fetch store data and owned items in parallel
    const [response, ownedAlbumIds, ownedSoundIds] = await Promise.all([
      api.get<{ avatars: { free: StoreItem[]; albums: AvatarAlbum[] }; sounds: SoundSection[] }>('/store'),
      this.getOwnedAlbumIds(),
      this.getOwnedSoundIds(),
    ]);

    if (response.success && response.data) {
      const transformed = transformStoreData({
        ...response.data,
        avatars: {
          ...response.data.avatars,
          ownedAlbums: [],
        },
        sounds: response.data.sounds,
        ownedSounds: [],
      });

      // Mark albums as owned and separate them
      const ownedAlbums: AvatarAlbum[] = [];
      const availableAlbums: AvatarAlbum[] = [];

      transformed.avatars.albums.forEach(album => {
        if (ownedAlbumIds.includes(album.id)) {
          ownedAlbums.push({ ...album, isOwned: true });
        } else {
          availableAlbums.push(album);
        }
      });

      // Collect owned sounds from all sections
      const ownedSounds: SoundItem[] = [];

      transformed.sounds.forEach(section => {
        section.subSections.forEach(subSection => {
          subSection.sounds.forEach(sound => {
            if (ownedSoundIds.includes(sound.id)) {
              ownedSounds.push({ ...sound, isOwned: true });
            }
          });
          // Mark sounds as owned in place
          subSection.sounds = subSection.sounds.map(sound => ({
            ...sound,
            isOwned: ownedSoundIds.includes(sound.id),
          }));
        });
      });

      (response as ApiResponse<StoreData>).data = {
        avatars: {
          free: transformed.avatars.free,
          albums: availableAlbums,
          ownedAlbums,
        },
        sounds: transformed.sounds,
        ownedSounds,
      };
    }

    return response as ApiResponse<StoreData>;
  }

  /**
   * Get only avatars
   */
  async getAvatars(): Promise<ApiResponse<StoreData['avatars']>> {
    const response = await api.get<StoreData['avatars']>('/store/avatars');
    if (response.success && response.data) {
      response.data = {
        free: response.data.free.map(transformStoreItem),
        albums: response.data.albums.map(transformAlbum),
        ownedAlbums: [],
      };
    }
    return response;
  }

  /**
   * Get only sounds
   */
  async getSounds(): Promise<ApiResponse<SoundSection[]>> {
    const response = await api.get<SoundSection[]>('/store/sounds');
    if (response.success && response.data) {
      response.data = response.data.map(transformSoundSection);
    }
    return response;
  }

  /**
   * Purchase an avatar album
   */
  async purchaseAvatarAlbum(albumId: string): Promise<ApiResponse<{ albumId: string; purchased: boolean }>> {
    const response = await api.post<{ albumId: string; purchased: boolean }>(`/store/purchase/avatar-album/${albumId}`);
    if (response.success) {
      // Add to local owned list
      await this.addOwnedAlbum(albumId);
    }
    return response;
  }

  /**
   * Purchase a sound
   */
  async purchaseSound(soundId: string): Promise<ApiResponse<{ soundId: string; purchased: boolean }>> {
    const response = await api.post<{ soundId: string; purchased: boolean }>(`/store/purchase/sound/${encodeURIComponent(soundId)}`);
    if (response.success) {
      // Add to local owned list
      await this.addOwnedSound(soundId);
    }
    return response;
  }

  /**
   * Purchase coins package
   */
  async purchaseCoins(packageId: string): Promise<ApiResponse<{
    coinsAdded: number;
    newBalance: number;
  }>> {
    return api.post<{ coinsAdded: number; newBalance: number }>(
      '/store/purchase/coins',
      { packageId }
    );
  }
}

export const storeService = new StoreService();
