/**
 * Settings Routes
 * User settings endpoints
 */

import express from 'express';
import * as settingsController from '../controllers/settingsController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validation';
import { updateSettingsSchema } from '../validators/settingsValidator';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               gameSound:
 *                 type: boolean
 *               userSound:
 *                 type: boolean
 *               notificationSound:
 *                 type: boolean
 *               appSound:
 *                 type: boolean
 *               onlineStatus:
 *                 type: boolean
 *               roomVisibility:
 *                 type: boolean
 *               readReceipts:
 *                 type: boolean
 *               language:
 *                 type: string
 *                 enum: [en, ar]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 */
router.put('/', validate(updateSettingsSchema), settingsController.updateSettings);

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Reset settings to defaults
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/reset', settingsController.resetSettings);

/**
 * @swagger
 * /api/settings/delete-account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/delete-account', settingsController.deleteAccount);

export default router;
