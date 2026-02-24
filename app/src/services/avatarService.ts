/**
 * Avatar Service
 * API methods for avatar management
 */

import { api, ApiResponse } from './api';
import { transformUrl as sharedTransformUrl } from '@/utils/transformUrl';

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
  isOwned?: boolean;
}

export interface AvatarsResponse {
  free: AvatarImage[];
  albums: AvatarAlbum[];
}

/**
 * Transform backend URL to use the correct host
 */
function transformUrl(url: string): string {
  if (!url) return '';
  return sharedTransformUrl(url) || '';
}

/**
 * Transform avatar image URLs
 */
function transformAvatarImage(avatar: AvatarImage): AvatarImage {
  return {
    ...avatar,
    url: transformUrl(avatar.url),
  };
}

/**
 * Transform album URLs
 */
function transformAlbum(album: AvatarAlbum): AvatarAlbum {
  return {
    ...album,
    previewUrl: transformUrl(album.previewUrl),
    avatars: album.avatars.map(transformAvatarImage),
  };
}

/**
 * Transform full avatars response
 */
function transformAvatarsResponse(data: AvatarsResponse): AvatarsResponse {
  return {
    free: data.free.map(transformAvatarImage),
    albums: data.albums.map(transformAlbum),
  };
}

class AvatarService {
  /**
   * Get all available avatars (free + albums)
   */
  async getAllAvatars(): Promise<ApiResponse<AvatarsResponse>> {
    const response = await api.get<AvatarsResponse>('/avatars');
    if (response.success && response.data) {
      response.data = transformAvatarsResponse(response.data);
    }
    return response;
  }

  /**
   * Get only free avatars
   */
  async getFreeAvatars(): Promise<ApiResponse<AvatarImage[]>> {
    const response = await api.get<AvatarImage[]>('/avatars/free');
    if (response.success && response.data) {
      response.data = response.data.map(transformAvatarImage);
    }
    return response;
  }

  /**
   * Get all avatar albums
   */
  async getAlbums(): Promise<ApiResponse<AvatarAlbum[]>> {
    const response = await api.get<AvatarAlbum[]>('/avatars/albums');
    if (response.success && response.data) {
      response.data = response.data.map(transformAlbum);
    }
    return response;
  }

  /**
   * Get a specific album by ID
   */
  async getAlbum(albumId: string): Promise<ApiResponse<AvatarAlbum>> {
    const response = await api.get<AvatarAlbum>(`/avatars/albums/${albumId}`);
    if (response.success && response.data) {
      response.data = transformAlbum(response.data);
    }
    return response;
  }

  /**
   * Purchase an album
   */
  async purchaseAlbum(albumId: string): Promise<ApiResponse<{ albumId: string; purchased: boolean }>> {
    return api.post<{ albumId: string; purchased: boolean }>(`/avatars/albums/${albumId}/purchase`);
  }
}

export const avatarService = new AvatarService();
