/**
 * Upload Controller
 * Handles file upload endpoints
 */

import { Request, Response } from 'express';
import { uploadService } from './uploadService';
import { successResponse, errorResponse } from '../../shared/utils/responseFormatter';

export async function uploadPackImage(req: Request, res: Response): Promise<void> {
  const { image, mimeType } = req.body;

  if (!image || !mimeType) {
    res.status(400).json(errorResponse('Image and mimeType are required'));
    return;
  }

  const result = await uploadService.uploadPackImageFromBase64(image, mimeType);

  if (!result.success) {
    res.status(400).json(errorResponse(result.error || 'Upload failed'));
    return;
  }

  res.json(successResponse(
    { url: result.url, filename: result.filename },
    'Image uploaded successfully'
  ));
}

export async function uploadPackImageMultipart(req: Request, res: Response): Promise<void> {
  const contentType = req.headers['content-type'] || '';

  if (!contentType.includes('multipart/form-data')) {
    res.status(400).json(errorResponse('Content-Type must be multipart/form-data'));
    return;
  }

  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));

  req.on('end', async () => {
    try {
      const body = Buffer.concat(chunks);
      const result = await uploadService.parseAndUploadMultipart(body, contentType);

      if (!result.success) {
        res.status(400).json(errorResponse(result.error || 'Upload failed'));
        return;
      }

      res.json(successResponse(
        { url: result.url, filename: result.filename },
        'Image uploaded successfully'
      ));
    } catch {
      res.status(500).json(errorResponse('Failed to process upload'));
    }
  });
}
