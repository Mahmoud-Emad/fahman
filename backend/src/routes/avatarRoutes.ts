/**
 * Avatar Routes
 * API endpoints for avatar management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validateUUID } from '../middlewares/validation';
import { avatarService } from '../services/avatarService';
import { successResponse, errorResponse } from '../utils/responseFormatter';

const router = Router();

// Simple async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

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
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const avatars = avatarService.getAllAvatars();

    // If user is authenticated, check their album ownership
    if (req.user) {
      // Mark owned albums (TODO: integrate with purchases)
      for (const album of avatars.albums) {
        (album as any).isOwned = await avatarService.checkAlbumOwnership(
          req.user.id,
          album.id
        );
      }
    }

    res.json(successResponse(avatars, 'Avatars retrieved successfully'));
  })
);

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
router.get(
  '/free',
  asyncHandler(async (_req: Request, res: Response) => {
    const freeAvatars = avatarService.getFreeAvatars();
    res.json(successResponse(freeAvatars, 'Free avatars retrieved successfully'));
  })
);

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
router.get(
  '/albums',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const albums = avatarService.getAlbums();

    // Mark owned albums if user is authenticated
    if (req.user) {
      for (const album of albums) {
        (album as any).isOwned = await avatarService.checkAlbumOwnership(
          req.user.id,
          album.id
        );
      }
    }

    res.json(successResponse(albums, 'Albums retrieved successfully'));
  })
);

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
router.get(
  '/albums/:albumId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { albumId } = req.params;
    const album = avatarService.getAlbum(albumId);

    if (!album) {
      return res.status(404).json(errorResponse('Album not found'));
    }

    // Check ownership if user is authenticated
    if (req.user) {
      (album as any).isOwned = await avatarService.checkAlbumOwnership(
        req.user.id,
        albumId
      );
    }

    res.json(successResponse(album, 'Album retrieved successfully'));
  })
);

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
router.post(
  '/albums/:albumId/purchase',
  authenticate,
  validateUUID('albumId'),
  asyncHandler(async (req: Request, res: Response) => {
    const { albumId } = req.params;
    const userId = req.user!.id;

    const album = avatarService.getAlbum(albumId);
    if (!album) {
      return res.status(404).json(errorResponse('Album not found'));
    }

    // Check if already owned
    const alreadyOwned = await avatarService.checkAlbumOwnership(userId, albumId);
    if (alreadyOwned) {
      return res.status(400).json(errorResponse('You already own this album'));
    }

    // TODO: Implement purchase logic
    // 1. Check user's coin balance
    // 2. Deduct coins
    // 3. Add album to user's purchases
    // 4. Return success

    res.json(successResponse(
      { albumId, purchased: true },
      'Album purchased successfully'
    ));
  })
);

export default router;
