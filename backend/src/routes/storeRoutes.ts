/**
 * Store Routes
 * API endpoints for marketplace/store
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth';
import { validate, validateUUID } from '../middlewares/validation';
import { storeService } from '../services/storeService';
import { successResponse } from '../utils/responseFormatter';
import { purchaseCoinsSchema } from '../validators/storeValidator';

const router = Router();

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * @openapi
 * /api/store:
 *   get:
 *     tags:
 *       - Store
 *     summary: Get all store data
 *     description: Returns all avatars and sounds available in the store
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store data retrieved successfully
 */
router.get(
  '/',
  optionalAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const storeData = storeService.getAllStoreData();
    res.json(successResponse(storeData, 'Store data retrieved successfully'));
  })
);

/**
 * @openapi
 * /api/store/avatars:
 *   get:
 *     tags:
 *       - Store
 *     summary: Get avatars
 *     description: Returns free avatars and avatar albums
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatars retrieved successfully
 */
router.get(
  '/avatars',
  optionalAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const avatars = storeService.getAvatarsData();
    res.json(successResponse(avatars, 'Avatars retrieved successfully'));
  })
);

/**
 * @openapi
 * /api/store/sounds:
 *   get:
 *     tags:
 *       - Store
 *     summary: Get sounds
 *     description: Returns all sound sections with subsections
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sounds retrieved successfully
 */
router.get(
  '/sounds',
  optionalAuth,
  asyncHandler(async (_req: Request, res: Response) => {
    const sounds = storeService.getSoundsData();
    res.json(successResponse(sounds, 'Sounds retrieved successfully'));
  })
);

/**
 * @openapi
 * /api/store/purchase/avatar-album/{albumId}:
 *   post:
 *     tags:
 *       - Store
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
 */
router.post(
  '/purchase/avatar-album/:albumId',
  authenticate,
  validateUUID('albumId'),
  asyncHandler(async (req: Request, res: Response) => {
    const { albumId } = req.params;
    const userId = req.user!.id;

    // TODO: Implement purchase logic
    // 1. Check if user already owns this album
    // 2. Check user's coin balance (needs 10 coins)
    // 3. Deduct coins
    // 4. Add album to user's purchased items
    // 5. Return success with updated coin balance

    res.json(successResponse(
      { albumId, purchased: true },
      'Avatar album purchased successfully'
    ));
  })
);

/**
 * @openapi
 * /api/store/purchase/sound/{soundId}:
 *   post:
 *     tags:
 *       - Store
 *     summary: Purchase a sound
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: soundId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sound purchased successfully
 *       400:
 *         description: Already owned or insufficient coins
 */
router.post(
  '/purchase/sound/:soundId',
  authenticate,
  validateUUID('soundId'),
  asyncHandler(async (req: Request, res: Response) => {
    const { soundId } = req.params;
    const userId = req.user!.id;

    // TODO: Implement purchase logic
    // 1. Check if user already owns this sound
    // 2. Check user's coin balance (needs 5 coins)
    // 3. Deduct coins
    // 4. Add sound to user's purchased items
    // 5. Return success with updated coin balance

    res.json(successResponse(
      { soundId, purchased: true },
      'Sound purchased successfully'
    ));
  })
);

/**
 * @openapi
 * /api/store/purchase/coins:
 *   post:
 *     tags:
 *       - Store
 *     summary: Purchase coin package
 *     description: Purchase a coin package and add coins to user balance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *             properties:
 *               packageId:
 *                 type: string
 *                 enum: [pack_50, pack_150, pack_500]
 *     responses:
 *       200:
 *         description: Coins purchased successfully
 *       400:
 *         description: Invalid package
 */
router.post(
  '/purchase/coins',
  authenticate,
  validate(purchaseCoinsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { packageId } = req.body;
    const userId = req.user!.id;

    const result = await storeService.purchaseCoins(userId, packageId);

    res.json(successResponse(result, `${result.coinsAdded} coins added successfully`));
  })
);

export default router;
