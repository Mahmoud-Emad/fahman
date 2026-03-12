/**
 * Avatar Routes
 * API endpoints for avatar management
 */

import { Router } from 'express';
import { authenticate, optionalAuth } from '@shared/middleware/auth';
import { validateUUID } from '@shared/middleware/validation';
import { asyncHandler } from '@shared/middleware/asyncHandler';
import * as avatarController from './avatarController';

const router = Router();

/**
 * @openapi
 * /api/avatars:
 *   get:
 *     tags:
 *       - Avatars
 *     summary: Get all available avatars
 *     description: Returns free avatars and album previews
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of avatars
 */
router.get('/', optionalAuth, asyncHandler(avatarController.getAllAvatars));

/**
 * @openapi
 * /api/avatars/free:
 *   get:
 *     tags:
 *       - Avatars
 *     summary: Get free avatars only
 *     responses:
 *       200:
 *         description: List of free avatars
 */
router.get('/free', asyncHandler(avatarController.getFreeAvatars));

/**
 * @openapi
 * /api/avatars/albums:
 *   get:
 *     tags:
 *       - Avatars
 *     summary: Get all avatar albums
 *     responses:
 *       200:
 *         description: List of avatar albums
 */
router.get('/albums', optionalAuth, asyncHandler(avatarController.getAlbums));

/**
 * @openapi
 * /api/avatars/albums/{albumId}:
 *   get:
 *     tags:
 *       - Avatars
 *     summary: Get a specific album
 *     parameters:
 *       - name: albumId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Album details with avatars
 *       404:
 *         description: Album not found
 */
router.get('/albums/:albumId', optionalAuth, asyncHandler(avatarController.getAlbum));

/**
 * @openapi
 * /api/avatars/albums/{albumId}/purchase:
 *   post:
 *     tags:
 *       - Avatars
 *     summary: Purchase an avatar album
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: albumId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Album purchased successfully
 *       400:
 *         description: Already owned or insufficient coins
 *       404:
 *         description: Album not found
 */
router.post('/albums/:albumId/purchase', authenticate, validateUUID('albumId'), asyncHandler(avatarController.purchaseAlbum));

export default router;
