/**
 * Upload Service
 * Handles file uploads to the backend
 */

import { readAsStringAsync } from 'expo-file-system/legacy';
import { api, ApiResponse } from './api';
import { getErrorMessage } from '@/utils/errorUtils';
import { transformUrl as sharedTransformUrl } from '@/utils/transformUrl';

export interface UploadResponse {
  url: string;
  filename: string;
}

/**
 * Get MIME type from file extension
 */
function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[extension || ''] || 'image/jpeg';
}

/**
 * Transform server URL to use the correct base URL for the current platform
 */
function transformUrl(url: string): string {
  return sharedTransformUrl(url) || '';
}

class UploadService {
  /**
   * Upload a pack image from local file URI
   * Returns the server URL of the uploaded image
   */
  async uploadPackImage(localUri: string): Promise<ApiResponse<UploadResponse>> {
    try {
      // Read file as base64
      const base64 = await readAsStringAsync(localUri, {
        encoding: 'base64',
      });

      const mimeType = getMimeType(localUri);

      // Send to backend
      return await api.post<UploadResponse>('/upload/pack-image', {
        image: base64,
        mimeType,
      });
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
      };
    }
  }

  /**
   * Check if a URI is a local file path (needs uploading)
   * Returns true for local URIs, false for remote URLs
   */
  isLocalUri(uri: string | null | undefined): boolean {
    if (!uri) return false;
    return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('/');
  }

  /**
   * Process an image URI - uploads if local, returns as-is if already remote
   * Returns the final URL to use
   */
  async processImageUri(uri: string | null | undefined): Promise<string | null> {
    if (!uri) return null;

    // If it's already a remote URL, return it
    if (!this.isLocalUri(uri)) {
      return uri;
    }

    // Upload local file and return server URL
    const result = await this.uploadPackImage(uri);
    if (result.success && result.data) {
      // Transform URL to use correct base URL for this platform
      return transformUrl(result.data.url);
    }

    return null;
  }
}

export const uploadService = new UploadService();
