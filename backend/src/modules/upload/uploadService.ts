/**
 * Upload Service
 * Handles file uploads for pack images and other media
 */

import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { config } from '@config/env';
import { getErrorMessage } from '@shared/utils/errorUtils';

// Upload directory paths
const UPLOADS_DIR = join(__dirname, '../uploads');
const PACKS_DIR = join(UPLOADS_DIR, 'packs');

// Supported image extensions and MIME types
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

class UploadService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.baseUrl;
    this.ensureDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    if (!existsSync(PACKS_DIR)) {
      mkdirSync(PACKS_DIR, { recursive: true });
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    return mimeToExt[mimeType] || '.jpg';
  }

  /**
   * Validate file upload
   */
  validateFile(mimeType: string, size: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      };
    }

    if (size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload a pack image from base64 data
   */
  async uploadPackImage(base64Data: string, mimeType: string): Promise<UploadResult> {
    try {
      // Validate
      const base64Size = (base64Data.length * 3) / 4; // Approximate size
      const validation = this.validateFile(mimeType, base64Size);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const ext = this.getExtensionFromMimeType(mimeType);
      const filename = `${randomUUID()}${ext}`;
      const filepath = join(PACKS_DIR, filename);

      // Decode and save
      const buffer = Buffer.from(base64Data, 'base64');
      writeFileSync(filepath, buffer);

      // Return URL
      const url = `${this.baseUrl}/uploads/packs/${filename}`;
      return { success: true, url, filename };
    } catch (error) {
      console.error('Error uploading pack image:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Upload a pack image from Buffer (for multipart form data)
   */
  async uploadPackImageBuffer(buffer: Buffer, mimeType: string): Promise<UploadResult> {
    try {
      // Validate
      const validation = this.validateFile(mimeType, buffer.length);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const ext = this.getExtensionFromMimeType(mimeType);
      const filename = `${randomUUID()}${ext}`;
      const filepath = join(PACKS_DIR, filename);

      // Save file
      writeFileSync(filepath, buffer);

      // Return URL
      const url = `${this.baseUrl}/uploads/packs/${filename}`;
      return { success: true, url, filename };
    } catch (error) {
      console.error('Error uploading pack image:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  }

  /**
   * Upload a pack image from raw base64 string (handles data URL prefix)
   */
  async uploadPackImageFromBase64(rawImage: string, mimeType: string): Promise<UploadResult> {
    let base64Data = rawImage;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }
    return this.uploadPackImage(base64Data, mimeType);
  }

  /**
   * Parse a multipart/form-data body buffer and upload the contained image
   */
  async parseAndUploadMultipart(body: Buffer, contentType: string): Promise<UploadResult> {
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (!boundaryMatch) {
      return { success: false, error: 'Invalid multipart boundary' };
    }

    const boundary = boundaryMatch[1];
    const parts = body.toString('binary').split(`--${boundary}`);

    for (const part of parts) {
      if (part.includes('filename=')) {
        const mimeMatch = part.match(/Content-Type:\s*([^\r\n]+)/i);
        const mimeType = mimeMatch ? mimeMatch[1].trim() : 'image/jpeg';
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        const fileData = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
        return this.uploadPackImageBuffer(fileData, mimeType);
      }
    }

    return { success: false, error: 'No file found in request' };
  }

  /**
   * Delete a pack image
   */
  deletePackImage(filename: string): boolean {
    try {
      const filepath = join(PACKS_DIR, filename);
      if (existsSync(filepath)) {
        unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting pack image:', error);
      return false;
    }
  }

  /**
   * Extract filename from URL
   */
  getFilenameFromUrl(url: string): string | null {
    if (!url) return null;
    const match = url.match(/\/uploads\/packs\/([^/]+)$/);
    return match ? match[1] : null;
  }
}

export const uploadService = new UploadService();
export default uploadService;
