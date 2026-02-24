/**
 * Room Routes
 */

import express from 'express';
import * as roomController from '../controllers/roomController';
import { authenticate } from '../middlewares/auth';
import { validate, validateUUID } from '../middlewares/validation';
import {
  createRoomSchema,
  updateRoomSchema,
  joinRoomSchema,
  joinRoomByCodeSchema,
  setReadySchema,
} from '../validators/roomValidator';
import gameRoutes from './gameRoutes';

const router = express.Router();

/**
 * @openapi
 * /api/rooms:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Get public rooms
 *     description: Retrieve all public rooms with pagination and status filter
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [WAITING, PLAYING, FINISHED, CLOSED]
 *           default: WAITING
 *         description: Room status filter
 *     responses:
 *       200:
 *         description: List of rooms with pagination
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
 *                     $ref: '#/components/schemas/Room'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', roomController.getPublicRooms);

/**
 * @openapi
 * /api/rooms/popular:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Get popular rooms
 *     description: Retrieve popular/active rooms sorted by player count
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of rooms to return
 *     responses:
 *       200:
 *         description: List of popular rooms
 */
router.get('/popular', roomController.getPopularRooms);

/**
 * @openapi
 * /api/rooms/my:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Get my rooms
 *     description: Retrieve all rooms the authenticated user is currently in
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's active rooms
 *       401:
 *         description: Unauthorized
 */
router.get('/my', authenticate, roomController.getMyRooms);

/**
 * @openapi
 * /api/rooms/code/{code}:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Get room by code
 *     description: Retrieve a room by its 6-character join code
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 6
 *           maxLength: 6
 *         description: Room join code (e.g., ABC123)
 *     responses:
 *       200:
 *         description: Room details
 *       404:
 *         description: Room not found
 */
router.get('/code/:code', roomController.getRoomByCode);

/**
 * @openapi
 * /api/rooms/{id}:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Get room by ID
 *     description: Retrieve a specific room with all details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room UUID
 *     responses:
 *       200:
 *         description: Room details with members and pack info
 *       404:
 *         description: Room not found
 */
router.get('/:id', validateUUID('id'), roomController.getRoomById);

/**
 * @openapi
 * /api/rooms:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Create a new room
 *     description: Create a new game room with a selected pack
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packId
 *               - title
 *             properties:
 *               packId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the question pack to use
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 description: Room title
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Room description
 *               maxPlayers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 20
 *                 default: 8
 *                 description: Maximum number of players
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 description: Whether room is publicly visible
 *               password:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 50
 *                 description: Password for private rooms
 *               settings:
 *                 type: object
 *                 properties:
 *                   timePerQuestion:
 *                     type: integer
 *                     minimum: 5
 *                     maximum: 300
 *                   scoreVisibility:
 *                     type: string
 *                     enum: [all, end, hidden]
 *                   allowLateJoin:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Pack not found
 */
router.post('/', authenticate, validate(createRoomSchema), roomController.createRoom);

/**
 * @openapi
 * /api/rooms/join:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Join room by code
 *     description: Join a room using its 6-character code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomCode
 *             properties:
 *               roomCode:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 description: 6-character room join code
 *               password:
 *                 type: string
 *                 description: Password for private rooms
 *     responses:
 *       200:
 *         description: Joined room successfully
 *       400:
 *         description: Room is full or not accepting players
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       409:
 *         description: Already in this room
 */
router.post('/join', authenticate, validate(joinRoomByCodeSchema), roomController.joinRoomByCode);

/**
 * @openapi
 * /api/rooms/{id}/join:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Join room by ID
 *     description: Join a room using its UUID
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Password for private rooms
 *     responses:
 *       200:
 *         description: Joined room successfully
 *       400:
 *         description: Room is full or not accepting players
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 */
router.post('/:id/join', authenticate, validateUUID('id'), validate(joinRoomSchema), roomController.joinRoom);

/**
 * @openapi
 * /api/rooms/{id}/leave:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Leave room
 *     description: Leave a room. If creator leaves during waiting, room closes.
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
 *         description: Left room successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not in this room
 */
router.post('/:id/leave', authenticate, validateUUID('id'), roomController.leaveRoom);

/**
 * @openapi
 * /api/rooms/{id}/start:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Start game
 *     description: Start the game (creator only, requires at least 2 players)
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
 *         description: Game started successfully
 *       400:
 *         description: Not enough players or invalid state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can start game
 *       404:
 *         description: Room not found
 */
router.post('/:id/start', authenticate, validateUUID('id'), roomController.startGame);

/**
 * @openapi
 * /api/rooms/{id}/ready:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Set ready status
 *     description: Set player ready/not ready status
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
 *             required:
 *               - isReady
 *             properties:
 *               isReady:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Ready status updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not in this room
 */
router.post('/:id/ready', authenticate, validateUUID('id'), validate(setReadySchema), roomController.setReady);

/**
 * @openapi
 * /api/rooms/{id}/kick/{userId}:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Kick player
 *     description: Kick a player from the room (creator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Room UUID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID to kick
 *     responses:
 *       200:
 *         description: Player kicked successfully
 *       400:
 *         description: Cannot kick yourself
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can kick players
 *       404:
 *         description: Room or player not found
 */
router.post('/:id/kick/:userId', authenticate, validateUUID('id'), validateUUID('userId'), roomController.kickPlayer);

/**
 * @openapi
 * /api/rooms/{id}:
 *   patch:
 *     tags:
 *       - Rooms
 *     summary: Update room
 *     description: Update room settings (creator only, waiting status only)
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               maxPlayers:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 20
 *               isPublic:
 *                 type: boolean
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Room updated successfully
 *       400:
 *         description: Cannot update while game in progress
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can update room
 *       404:
 *         description: Room not found
 */
router.patch('/:id', authenticate, validateUUID('id'), validate(updateRoomSchema), roomController.updateRoom);

/**
 * @openapi
 * /api/rooms/{id}:
 *   delete:
 *     tags:
 *       - Rooms
 *     summary: Delete/close room
 *     description: Close a room and remove all members
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
 *         description: Room closed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can delete room
 *       404:
 *         description: Room not found
 */
router.delete('/:id', authenticate, validateUUID('id'), roomController.deleteRoom);

// Mount game routes under /rooms/:id/game
router.use('/:id/game', validateUUID('id'), gameRoutes);

// Leaderboard is also accessible directly under /rooms/:id/leaderboard
router.get('/:id/leaderboard', authenticate, validateUUID('id'), (req, res, next) => {
  // Forward to game routes leaderboard handler
  const gameController = require('../controllers/gameController');
  return gameController.getLeaderboard(req, res, next);
});

export default router;
