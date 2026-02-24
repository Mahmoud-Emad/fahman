/**
 * Notification Routes
 */

import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middlewares/auth';
import { validate, validateUUID, validateQuery } from '../middlewares/validation';
import { sendRoomInvitesSchema } from '../validators/notificationValidator';
import { paginationSchema } from '../validators/paginationValidator';

const router = express.Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notifications
 *     description: Retrieve user's notifications with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter to only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications with pagination and unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, validateQuery(paginationSchema), notificationController.getNotifications);

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread count
 *     description: Get the count of unread notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
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
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification UUID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot access this notification
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', authenticate, validateUUID('id'), notificationController.markAsRead);

/**
 * @openapi
 * /api/notifications/read-all:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark all as read
 *     description: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *                     updated:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.post('/read-all', authenticate, notificationController.markAllAsRead);

/**
 * @openapi
 * /api/notifications/room-invite:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Send room invites
 *     description: Send room invitation notifications to multiple users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientIds
 *               - roomCode
 *               - roomTitle
 *             properties:
 *               recipientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 20
 *                 description: Array of user UUIDs to invite
 *               roomCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: Room join code
 *               roomTitle:
 *                 type: string
 *                 description: Room title
 *               packTitle:
 *                 type: string
 *                 description: Pack title (optional)
 *     responses:
 *       201:
 *         description: Invitations sent
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
 *                     sent:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/room-invite', authenticate, validate(sendRoomInvitesSchema), notificationController.sendRoomInvites);

/**
 * @openapi
 * /api/notifications/clear-read:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete read notifications
 *     description: Delete all read notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Read notifications deleted
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
 *                     deleted:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.delete('/clear-read', authenticate, notificationController.deleteReadNotifications);

/**
 * @openapi
 * /api/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification UUID
 *     responses:
 *       200:
 *         description: Notification deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot delete this notification
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', authenticate, validateUUID('id'), notificationController.deleteNotification);

export default router;
