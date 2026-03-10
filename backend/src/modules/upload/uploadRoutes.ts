/**
 * Upload Routes
 * API endpoints for file uploads
 */

import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import * as uploadController from './uploadController';

const router = Router();

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
 *       400:
 *         description: Invalid file type or size
 *       401:
 *         description: Unauthorized
 */
router.post('/pack-image', authenticate, asyncHandler(uploadController.uploadPackImage));

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
router.post('/pack-image/multipart', authenticate, asyncHandler(uploadController.uploadPackImageMultipart));

export default router;
