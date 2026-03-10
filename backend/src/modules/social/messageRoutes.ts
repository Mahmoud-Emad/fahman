/**
 * Message Routes
 * API endpoints for messaging functionality
 */

import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth';
import { validate, validateUUID, validateQuery } from '../../shared/middleware/validation';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import {
  sendMessageSchema,
  sendRoomInviteSchema,
  markAsReadSchema,
} from './messageValidator';
import { cursorPaginationSchema } from '../../shared/middleware/paginationValidator';
import * as messageController from './messageController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Direct messaging and conversations
 */

/**
 * @swagger
 * /messages/conversations:
 *   get:
 *     summary: Get all conversations
 *     description: Returns a list of all DM conversations with the last message preview
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       otherId:
 *                         type: string
 *                         format: uuid
 *                       otherName:
 *                         type: string
 *                       otherAvatar:
 *                         type: string
 *                         nullable: true
 *                       lastMessage:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           text:
 *                             type: string
 *                           senderId:
 *                             type: string
 *                             format: uuid
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           isRead:
 *                             type: boolean
 *                       unreadCount:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', asyncHandler(messageController.getConversations));

/**
 * @swagger
 * /messages/conversations/{userId}:
 *   get:
 *     summary: Get messages in a conversation
 *     description: Returns messages in a conversation with another user (paginated)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The other user's ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Message ID for cursor-based pagination (get messages before this)
 *     responses:
 *       200:
 *         description: Messages in the conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get(
  '/conversations/:userId',
  validateUUID('userId'),
  validateQuery(cursorPaginationSchema),
  asyncHandler(messageController.getConversationMessages)
);

/**
 * @swagger
 * /messages/conversations/{userId}/read:
 *   patch:
 *     summary: Mark conversation as read
 *     description: Marks all messages from a specific user as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The other user's ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     markedRead:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/conversations/:userId/read',
  validateUUID('userId'),
  asyncHandler(messageController.markConversationAsRead)
);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a direct message
 *     description: Sends a direct message to another user (must be friends)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientId
 *               - text
 *             properties:
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *                 description: The recipient's user ID
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: The message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot message this user (blocked or not friends)
 *       404:
 *         description: Recipient not found
 */
router.post('/', validate(sendMessageSchema), asyncHandler(messageController.sendMessage));

/**
 * @swagger
 * /messages/room-invite:
 *   post:
 *     summary: Send room invites
 *     description: Sends room invite messages to multiple users
 *     tags: [Messages]
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
 *                 maxItems: 20
 *                 description: Array of user IDs to invite
 *               roomCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: The room's join code
 *               roomTitle:
 *                 type: string
 *                 maxLength: 200
 *                 description: The room's title
 *     responses:
 *       201:
 *         description: Invites sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sent:
 *                       type: integer
 *                       description: Number of invites sent
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/room-invite',
  validate(sendRoomInviteSchema),
  asyncHandler(messageController.sendRoomInvite)
);

/**
 * @swagger
 * /messages/read:
 *   patch:
 *     summary: Mark messages as read
 *     description: Marks specific messages as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageIds
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 100
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     markedRead:
 *                       type: integer
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.patch('/read', validate(markAsReadSchema), asyncHandler(messageController.markAsRead));

/**
 * @swagger
 * /messages/unread-count:
 *   get:
 *     summary: Get unread message count
 *     description: Returns the total number of unread direct messages
 *     tags: [Messages]
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/unread-count', asyncHandler(messageController.getUnreadCount));

/**
 * @swagger
 * /messages/room/{roomId}:
 *   get:
 *     summary: Get room chat messages
 *     description: Returns chat messages from a room (paginated)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The room ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Message ID for cursor-based pagination
 *     responses:
 *       200:
 *         description: Room messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     hasMore:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a member of this room
 *       404:
 *         description: Room not found
 */
router.get('/room/:roomId', validateUUID('roomId'), validateQuery(cursorPaginationSchema), asyncHandler(messageController.getRoomMessages));

/**
 * @swagger
 * /messages/{id}:
 *   delete:
 *     summary: Delete a message
 *     description: Deletes a message (only the sender can delete)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The message ID
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Message deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only delete your own messages
 *       404:
 *         description: Message not found
 */
router.delete('/:id', validateUUID('id'), asyncHandler(messageController.deleteMessage));

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         senderId:
 *           type: string
 *           format: uuid
 *         recipientId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         roomId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         text:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [ROOM, PRIVATE, SYSTEM, ROOM_INVITE]
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         sender:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             username:
 *               type: string
 *             displayName:
 *               type: string
 *               nullable: true
 *             avatar:
 *               type: string
 *               nullable: true
 */

export default router;
