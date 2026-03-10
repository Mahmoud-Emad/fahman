/**
 * User Routes
 */

import express from 'express';
import * as friendController from '../social/friendController';
import * as userController from './userController';
import { authenticate } from '../../shared/middleware/auth';
import { validateQuery, validateUUID } from '../../shared/middleware/validation';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { searchUsersSchema, recentGamesSchema } from './userValidator';

const router = express.Router();

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     tags:
 *       - Users
 *     summary: Search users
 *     description: Search for users by username, display name, or game ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (username, display name, or game ID)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 50
 *         description: Maximum results to return
 *     responses:
 *       200:
 *         description: Search results
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
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       username:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       gameId:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/search', authenticate, validateQuery(searchUsersSchema), asyncHandler(friendController.searchUsers));

/**
 * @openapi
 * /api/users/me/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user statistics
 *     description: Get aggregated statistics for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/me/stats', authenticate, asyncHandler(userController.getUserStats));

/**
 * @openapi
 * /api/users/me/games/recent:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get recent games
 *     description: Get recent games played by the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Maximum number of games to return
 *     responses:
 *       200:
 *         description: Recent games list
 *       401:
 *         description: Unauthorized
 */
router.get('/me/games/recent', authenticate, validateQuery(recentGamesSchema), asyncHandler(userController.getRecentGames));

/**
 * @openapi
 * /api/users/me/achievements:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user achievements
 *     description: Get achievements for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User achievements
 *       401:
 *         description: Unauthorized
 */
router.get('/me/achievements', authenticate, asyncHandler(userController.getUserAchievements));

/**
 * @openapi
 * /api/users/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user public profile
 *     description: Get another user's public profile information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId', authenticate, validateUUID('userId'), asyncHandler(userController.getPublicProfile));

/**
 * @openapi
 * /api/users/{userId}/stats:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user statistics
 *     description: Get another user's game statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User statistics
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/stats', authenticate, validateUUID('userId'), asyncHandler(userController.getOtherUserStats));

/**
 * @openapi
 * /api/users/{userId}/games/recent:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user recent games
 *     description: Get another user's recent games
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Maximum number of games to return
 *     responses:
 *       200:
 *         description: Recent games list
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/games/recent', authenticate, validateUUID('userId'), validateQuery(recentGamesSchema), asyncHandler(userController.getOtherUserRecentGames));

/**
 * @openapi
 * /api/users/{userId}/achievements:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user achievements
 *     description: Get another user's achievements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User achievements
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:userId/achievements', authenticate, validateUUID('userId'), asyncHandler(userController.getOtherUserAchievements));

export default router;
