/**
 * Pack Routes
 */

import express from 'express';
import * as packController from './packController';
import * as questionController from './questionController';
import { authenticate, optionalAuth } from '@shared/middleware/auth';
import { validate, validateUUID } from '@shared/middleware/validation';
import { asyncHandler } from '@shared/middleware/asyncHandler';
import { cacheResponse } from '@shared/middleware/cache';
import {
  createPackSchema,
  updatePackSchema,
  createQuestionSchema,
  updateQuestionSchema,
} from './packValidator';

const router = express.Router();

/**
 * @openapi
 * /api/packs:
 *   get:
 *     tags:
 *       - Packs
 *     summary: Get public packs
 *     description: Retrieve all published public packs with pagination and filters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [EASY, MEDIUM, HARD]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of packs
 */
router.get('/', cacheResponse(60), asyncHandler(packController.getPublicPacks));

/**
 * @openapi
 * /api/packs/my:
 *   get:
 *     tags:
 *       - Packs
 *     summary: Get my packs
 *     description: Retrieve all packs created by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's packs
 *       401:
 *         description: Unauthorized
 */
router.get('/my', authenticate, asyncHandler(packController.getMyPacks));

/**
 * @openapi
 * /api/packs/system:
 *   get:
 *     tags:
 *       - Packs
 *     summary: Get system packs
 *     description: Retrieve all standard/system packs created by admins
 *     responses:
 *       200:
 *         description: List of system packs
 */
router.get('/system', asyncHandler(packController.getSystemPacks));

/**
 * @openapi
 * /api/packs/popular:
 *   get:
 *     tags:
 *       - Packs
 *     summary: Get popular packs
 *     description: Retrieve top packs by number of rooms using them
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of popular packs
 */
router.get('/popular', cacheResponse(120), asyncHandler(packController.getPopularPacks));

/**
 * @openapi
 * /api/packs/selection:
 *   get:
 *     tags:
 *       - Packs
 *     summary: Get packs for selection modal
 *     description: Retrieve system packs, user's packs, and popular packs in one request
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Packs organized by category
 *       401:
 *         description: Unauthorized
 */
router.get('/selection', authenticate, asyncHandler(packController.getPacksForSelection));

/**
 * @openapi
 * /api/packs/{id}:
 *   get:
 *     tags:
 *       - Packs
 *     summary: Get pack by ID
 *     description: Retrieve a specific pack with all its questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pack details
 *       404:
 *         description: Pack not found
 */
router.get('/:id', optionalAuth, validateUUID('id'), asyncHandler(packController.getPackById));

/**
 * @openapi
 * /api/packs:
 *   post:
 *     tags:
 *       - Packs
 *     summary: Create a new pack
 *     description: Create a new quiz pack
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, PRIVATE, FRIENDS]
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Pack created
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createPackSchema), asyncHandler(packController.createPack));

/**
 * @openapi
 * /api/packs/{id}:
 *   put:
 *     tags:
 *       - Packs
 *     summary: Update pack
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Pack updated
 */
router.put(
  '/:id',
  authenticate,
  validateUUID('id'),
  validate(updatePackSchema),
  asyncHandler(packController.updatePack)
);

/**
 * @openapi
 * /api/packs/{id}:
 *   delete:
 *     tags:
 *       - Packs
 *     summary: Delete pack
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pack deleted
 */
router.delete('/:id', authenticate, validateUUID('id'), asyncHandler(packController.deletePack));

/**
 * @openapi
 * /api/packs/{id}/publish:
 *   post:
 *     tags:
 *       - Packs
 *     summary: Publish pack
 *     description: Publish a pack (must have 5-15 questions)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pack published
 *       400:
 *         description: Pack does not have 5-15 questions
 */
router.post('/:id/publish', authenticate, validateUUID('id'), asyncHandler(packController.publishPack));

/**
 * @openapi
 * /api/packs/{packId}/questions:
 *   get:
 *     tags:
 *       - Questions
 *     summary: Get pack questions
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of questions
 */
router.get('/:packId/questions', validateUUID('packId'), asyncHandler(questionController.getPackQuestions));

/**
 * @openapi
 * /api/packs/{packId}/questions:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Create question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Question created
 */
router.post(
  '/:packId/questions',
  authenticate,
  validateUUID('packId'),
  validate(createQuestionSchema),
  asyncHandler(questionController.createQuestion)
);

/**
 * @openapi
 * /api/packs/questions/{id}:
 *   put:
 *     tags:
 *       - Questions
 *     summary: Update question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Question updated
 */
router.put(
  '/questions/:id',
  authenticate,
  validateUUID('id'),
  validate(updateQuestionSchema),
  asyncHandler(questionController.updateQuestion)
);

/**
 * @openapi
 * /api/packs/questions/{id}:
 *   delete:
 *     tags:
 *       - Questions
 *     summary: Delete question
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Question deleted
 */
router.delete('/questions/:id', authenticate, validateUUID('id'), asyncHandler(questionController.deleteQuestion));

/**
 * @openapi
 * /api/packs/{packId}/questions/bulk:
 *   post:
 *     tags:
 *       - Questions
 *     summary: Bulk create questions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Questions created
 */
router.post(
  '/:packId/questions/bulk',
  authenticate,
  validateUUID('packId'),
  asyncHandler(questionController.bulkCreateQuestions)
);

export default router;
