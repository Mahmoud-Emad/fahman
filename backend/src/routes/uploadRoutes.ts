/**
 * Upload Routes
 * API endpoints for file uploads
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth';
import { uploadService } from '../services/uploadService';
import { successResponse, errorResponse } from '../utils/responseFormatter';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * @openapi
 * /api/upload/pack-image:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload a pack image
 *     description: Upload an image for a pack logo. Accepts base64 encoded image data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - mimeType
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64 encoded image data (without data URL prefix)
 *               mimeType:
 *                 type: string
 *                 enum: [image/png, image/jpeg, image/jpg, image/webp, image/gif]
 *                 description: MIME type of the image
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Public URL of the uploaded image
 *                     filename:
 *                       type: string
 *                       description: Filename of the uploaded image
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/pack-image',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { image, mimeType } = req.body;

    if (!image || !mimeType) {
      return res.status(400).json(errorResponse('Image and mimeType are required'));
    }

    const result = await uploadService.uploadPackImageFromBase64(image, mimeType);

    if (!result.success) {
      return res.status(400).json(errorResponse(result.error || 'Upload failed'));
    }

    res.json(successResponse(
      { url: result.url, filename: result.filename },
      'Image uploaded successfully'
    ));
  })
);

/**
 * @openapi
 * /api/upload/pack-image/multipart:
 *   post:
 *     tags:
 *       - Upload
 *     summary: Upload a pack image (multipart)
 *     description: Upload an image for a pack logo using multipart form data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/pack-image/multipart',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json(errorResponse('Content-Type must be multipart/form-data'));
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));

    req.on('end', async () => {
      try {
        const body = Buffer.concat(chunks);
        const result = await uploadService.parseAndUploadMultipart(body, contentType);

        if (!result.success) {
          return res.status(400).json(errorResponse(result.error || 'Upload failed'));
        }

        res.json(successResponse(
          { url: result.url, filename: result.filename },
          'Image uploaded successfully'
        ));
      } catch (error: any) {
        res.status(500).json(errorResponse('Failed to process upload'));
      }
    });
  })
);

export default router;
