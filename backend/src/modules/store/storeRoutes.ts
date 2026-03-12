/**
 * Store Routes
 * API endpoints for marketplace/store
 */

import { Router } from 'express';
import { authenticate, optionalAuth } from '@shared/middleware/auth';
import { validate, validateUUID } from '@shared/middleware/validation';
import { asyncHandler } from '@shared/middleware/asyncHandler';
import { cacheResponse } from '@shared/middleware/cache';
import * as storeController from './storeController';
import { purchaseCoinsSchema } from './storeValidator';

const router = Router();

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
router.get('/', cacheResponse(300), optionalAuth, asyncHandler(storeController.getAllStoreData));

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
router.get('/avatars', cacheResponse(300), optionalAuth, asyncHandler(storeController.getAvatars));

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
router.get('/sounds', cacheResponse(300), optionalAuth, asyncHandler(storeController.getSounds));

/**
 * @openapi
 * /api/store/packs:
 *   get:
 *     tags:
 *       - Store
 *     summary: Get store packs
 *     description: Returns question packs available for purchase with preview questions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store packs retrieved successfully
 */
router.get('/packs', optionalAuth, asyncHandler(storeController.getPacks));

/**
 * @openapi
 * /api/store/packs/{packId}:
 *   get:
 *     tags:
 *       - Store
 *     summary: Get full pack details
 *     description: Returns full pack with all questions (after purchase)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: packId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pack retrieved successfully
 *       404:
 *         description: Pack not found
 */
router.get('/packs/:packId', authenticate, asyncHandler(storeController.getFullPack));

/**
 * @openapi
 * /api/store/purchase/pack/{packId}:
 *   post:
 *     tags:
 *       - Store
 *     summary: Purchase a question pack
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: packId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pack purchased successfully
 *       400:
 *         description: Already owned or insufficient coins
 */
router.post('/purchase/pack/:packId', authenticate, asyncHandler(storeController.purchasePack));

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
router.post('/purchase/avatar-album/:albumId', authenticate, validateUUID('albumId'), asyncHandler(storeController.purchaseAvatarAlbum));

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
router.post('/purchase/sound/:soundId', authenticate, validateUUID('soundId'), asyncHandler(storeController.purchaseSound));

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
 *               - receiptToken
 *               - platform
 *             properties:
 *               packageId:
 *                 type: string
 *                 enum: [pack_50, pack_150, pack_500]
 *               receiptToken:
 *                 type: string
 *                 description: Platform-specific payment receipt token
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *     responses:
 *       200:
 *         description: Coins purchased successfully
 *       400:
 *         description: Invalid package
 *       403:
 *         description: Payment verification failed
 *       409:
 *         description: Receipt already processed (replay attack)
 */
router.post('/purchase/coins', authenticate, validate(purchaseCoinsSchema), asyncHandler(storeController.purchaseCoins));

export default router;
