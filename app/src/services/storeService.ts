/**
 * Store Service
 * API methods for marketplace/store — ownership tracked server-side
 */

import { api, ApiResponse } from './api';
import { transformUrl as sharedTransformUrl } from '@/utils/transformUrl';

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

export interface StorePackQuestion {
  number: number;
  question: string;
  answers: string[];
  coverUrl: string | null;
}

export interface StorePackPreview {
  id: string;
  name: string;
  description: string;
  author: string;
  coverUrl: string | null;
  textHint: string;
  price: number;
  free: boolean;
  category: string;
  numberOfQuestions: number;
  previewQuestions: StorePackQuestion[];
  isOwned?: boolean;
}

export interface StoreData {
  avatars: {
    free: StoreItem[];
    albums: AvatarAlbum[];
    ownedAlbums: AvatarAlbum[];
  };
  sounds: SoundSection[];
  ownedSounds: SoundItem[];
  packs: StorePackPreview[];
  ownedPackIds: string[];
}

// ============================================================================
// URL TRANSFORMATION
// ============================================================================

function transformUrl(url: string): string {
  if (!url) return '';
  return sharedTransformUrl(url) || '';
}

function transformStoreItem<T extends StoreItem>(item: T): T {
  return { ...item, url: transformUrl(item.url) };
}

function transformAlbum(album: AvatarAlbum): AvatarAlbum {
  return {
    ...album,
    previewUrl: transformUrl(album.previewUrl),
    avatars: (album.avatars || []).map(transformStoreItem),
  };
}

function transformSoundSection(section: SoundSection): SoundSection {
  return {
    ...section,
    subSections: (section.subSections || []).map(sub => ({
      ...sub,
      sounds: (sub.sounds || []).map(transformStoreItem),
    })),
  };
}

function transformPackPreview(pack: StorePackPreview): StorePackPreview {
  return {
    ...pack,
    coverUrl: pack.coverUrl ? transformUrl(pack.coverUrl) : null,
    previewQuestions: (pack.previewQuestions || []).map(q => ({
      ...q,
      coverUrl: q.coverUrl ? transformUrl(q.coverUrl) : null,
    })),
  };
}

// ============================================================================
// SERVER RESPONSE TYPE (what /store actually returns)
// ============================================================================

interface StoreApiResponse {
  avatars: { free: StoreItem[]; albums: AvatarAlbum[] };
  sounds: SoundSection[];
  packs: StorePackPreview[];
  ownedPackIds?: string[];
  ownedAlbumIds?: string[];
}

// ============================================================================
// SERVICE
// ============================================================================

class StoreService {
  /**
   * Get all store data with server-tracked ownership
   */
  async getStoreData(): Promise<ApiResponse<StoreData>> {
    const response = await api.get<StoreApiResponse>('/store');

    if (response.success && response.data) {
      const { avatars, sounds, packs, ownedPackIds = [], ownedAlbumIds = [] } = response.data;

      const ownedAlbumSet = new Set(ownedAlbumIds);

      // Transform and split albums into owned vs available
      const allAlbums = (avatars.albums || []).map(transformAlbum);
      const ownedAlbums: AvatarAlbum[] = [];
      const availableAlbums: AvatarAlbum[] = [];

      allAlbums.forEach(album => {
        if (ownedAlbumSet.has(album.id)) {
          ownedAlbums.push({ ...album, isOwned: true });
        } else {
          availableAlbums.push(album);
        }
      });

      // Mark packs as owned
      const packsWithOwnership = (packs || []).map(transformPackPreview).map(pack => ({
        ...pack,
        isOwned: ownedPackIds.includes(pack.id),
      }));

      (response as ApiResponse<StoreData>).data = {
        avatars: {
          free: (avatars.free || []).map(transformStoreItem),
          albums: availableAlbums,
          ownedAlbums,
        },
        sounds: (sounds || []).map(transformSoundSection),
        ownedSounds: [],
        packs: packsWithOwnership,
        ownedPackIds,
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
   * Purchase an avatar album (server handles coins + persistence)
   */
  async purchaseAvatarAlbum(albumId: string): Promise<ApiResponse<{ albumId: string; purchased: boolean; newBalance: number }>> {
    return api.post<{ albumId: string; purchased: boolean; newBalance: number }>(`/store/purchase/avatar-album/${albumId}`);
  }

  /**
   * Purchase a sound
   */
  async purchaseSound(soundId: string): Promise<ApiResponse<{ soundId: string; purchased: boolean }>> {
    return api.post<{ soundId: string; purchased: boolean }>(`/store/purchase/sound/${encodeURIComponent(soundId)}`);
  }

  /**
   * Purchase a pack (server handles coins + persistence)
   */
  async purchasePack(packId: string): Promise<ApiResponse<{ packId: string; purchased: boolean; newBalance: number }>> {
    return api.post<{ packId: string; purchased: boolean; newBalance: number }>(`/store/purchase/pack/${encodeURIComponent(packId)}`);
  }

  /**
   * Purchase coins package
   */
  async purchaseCoins(data: {
    packageId: string;
    receiptToken: string;
    platform: 'ios' | 'android' | 'web';
  }): Promise<ApiResponse<{ coinsAdded: number; newBalance: number }>> {
    return api.post<{ coinsAdded: number; newBalance: number }>('/store/purchase/coins', data);
  }
}

export const storeService = new StoreService();
