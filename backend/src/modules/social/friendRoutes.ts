/**
 * Friend Routes
 */

import express from 'express';
import * as friendController from './friendController';
import { authenticate } from '@shared/middleware/auth';
import { validate, validateUUID } from '@shared/middleware/validation';
import { asyncHandler } from '@shared/middleware/asyncHandler';
import {
  sendFriendRequestSchema,
  sendFriendRequestByIdentifierSchema,
} from './friendValidator';

const router = express.Router();

/**
 * @openapi
 * /api/friends:
 *   get:
 *     tags:
 *       - Friends
 *     summary: Get friends list
 *     description: Retrieve all accepted friendships for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends
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
 *                     type: object
 *                     properties:
 *                       friendshipId:
 *                         type: string
 *                         format: uuid
 *                       user:
 *                         $ref: '#/components/schemas/UserBasic'
 *                       since:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, asyncHandler(friendController.getFriends));

/**
 * @openapi
 * /api/friends/requests:
 *   get:
 *     tags:
 *       - Friends
 *     summary: Get pending friend requests
 *     description: Retrieve pending friend requests received by the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests
 *       401:
 *         description: Unauthorized
 */
router.get('/requests', authenticate, asyncHandler(friendController.getPendingRequests));

/**
 * @openapi
 * /api/friends/requests/sent:
 *   get:
 *     tags:
 *       - Friends
 *     summary: Get sent friend requests
 *     description: Retrieve friend requests sent by the user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sent requests
 *       401:
 *         description: Unauthorized
 */
router.get('/requests/sent', authenticate, asyncHandler(friendController.getSentRequests));

/**
 * @openapi
 * /api/friends/blocked:
 *   get:
 *     tags:
 *       - Friends
 *     summary: Get blocked users
 *     description: Retrieve all users blocked by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blocked users
 *       401:
 *         description: Unauthorized
 */
router.get('/blocked', authenticate, asyncHandler(friendController.getBlockedUsers));

/**
 * @openapi
 * /api/friends/status/{id}:
 *   get:
 *     tags:
 *       - Friends
 *     summary: Get friendship status
 *     description: Check friendship status with another user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Target user UUID
 *     responses:
 *       200:
 *         description: Friendship status
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
 *                     status:
 *                       type: string
 *                       enum: [NONE, PENDING, ACCEPTED, REJECTED, BLOCKED]
 *                     isRequester:
 *                       type: boolean
 *                     friendshipId:
 *                       type: string
 *                       format: uuid
 *       401:
 *         description: Unauthorized
 */
router.get('/status/:id', authenticate, validateUUID('id'), asyncHandler(friendController.getFriendshipStatus));

/**
 * @openapi
 * /api/friends/request:
 *   post:
 *     tags:
 *       - Friends
 *     summary: Send friend request by ID
 *     description: Send a friend request to a user by their UUID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Target user UUID
 *     responses:
 *       201:
 *         description: Friend request sent
 *       400:
 *         description: Cannot send request to yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       409:
 *         description: Already friends or request pending
 */
router.post('/request', authenticate, validate(sendFriendRequestSchema), asyncHandler(friendController.sendFriendRequest));

/**
 * @openapi
 * /api/friends/request/find:
 *   post:
 *     tags:
 *       - Friends
 *     summary: Send friend request by username or game ID
 *     description: Send a friend request using username or game ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or game ID
 *     responses:
 *       201:
 *         description: Friend request sent
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/request/find',
  authenticate,
  validate(sendFriendRequestByIdentifierSchema),
  asyncHandler(friendController.sendFriendRequestByIdentifier)
);

/**
 * @openapi
 * /api/friends/request/{id}/accept:
 *   post:
 *     tags:
 *       - Friends
 *     summary: Accept friend request
 *     description: Accept a pending friend request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Friend request UUID
 *     responses:
 *       200:
 *         description: Friend request accepted
 *       400:
 *         description: Request already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot accept this request
 *       404:
 *         description: Request not found
 */
router.post('/request/:id/accept', authenticate, validateUUID('id'), asyncHandler(friendController.acceptFriendRequest));

/**
 * @openapi
 * /api/friends/request/{id}/decline:
 *   post:
 *     tags:
 *       - Friends
 *     summary: Decline friend request
 *     description: Decline a pending friend request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Friend request UUID
 *     responses:
 *       200:
 *         description: Friend request declined
 *       400:
 *         description: Request already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot decline this request
 *       404:
 *         description: Request not found
 */
router.post('/request/:id/decline', authenticate, validateUUID('id'), asyncHandler(friendController.declineFriendRequest));

/**
 * @openapi
 * /api/friends/request/{id}/cancel:
 *   delete:
 *     tags:
 *       - Friends
 *     summary: Cancel sent friend request
 *     description: Cancel a pending friend request you sent
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Friend request UUID
 *     responses:
 *       200:
 *         description: Friend request cancelled
 *       400:
 *         description: Request cannot be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot cancel this request
 *       404:
 *         description: Request not found
 */
router.delete('/request/:id/cancel', authenticate, validateUUID('id'), asyncHandler(friendController.cancelFriendRequest));

/**
 * @openapi
 * /api/friends/{id}:
 *   delete:
 *     tags:
 *       - Friends
 *     summary: Remove friend
 *     description: Remove a friend (unfriend)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Friend's user UUID
 *     responses:
 *       200:
 *         description: Friend removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Friendship not found
 */
router.delete('/:id', authenticate, validateUUID('id'), asyncHandler(friendController.removeFriend));

/**
 * @openapi
 * /api/friends/{id}/block:
 *   post:
 *     tags:
 *       - Friends
 *     summary: Block user
 *     description: Block a user (removes friendship if exists)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID to block
 *     responses:
 *       200:
 *         description: User blocked
 *       400:
 *         description: Cannot block yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/:id/block', authenticate, validateUUID('id'), asyncHandler(friendController.blockUser));

/**
 * @openapi
 * /api/friends/{id}/unblock:
 *   post:
 *     tags:
 *       - Friends
 *     summary: Unblock user
 *     description: Unblock a previously blocked user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID to unblock
 *     responses:
 *       200:
 *         description: User unblocked
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Block not found
 */
router.post('/:id/unblock', authenticate, validateUUID('id'), asyncHandler(friendController.unblockUser));

export default router;
