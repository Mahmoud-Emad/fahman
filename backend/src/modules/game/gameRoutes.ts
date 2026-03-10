/**
 * Game Routes
 * Routes for game state, answers, and results
 */

import express from 'express';
import * as gameController from './gameController';
import { authenticate } from '../../shared/middleware/auth';
import { validate, validateUUID } from '../../shared/middleware/validation';
import { asyncHandler } from '../../shared/middleware/asyncHandler';
import { submitAnswerSchema } from './gameValidator';

const router = express.Router({ mergeParams: true }); // Merge params from parent router

/**
 * @openapi
 * /api/rooms/{id}/game:
 *   get:
 *     tags:
 *       - Game
 *     summary: Get game state
 *     description: Get current game state including current question and player scores
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
 *     responses:
 *       200:
 *         description: Current game state
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
 *                     roomId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     currentQuestionIndex:
 *                       type: integer
 *                     totalQuestions:
 *                       type: integer
 *                     currentQuestion:
 *                       type: object
 *                     players:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not in this room
 *       404:
 *         description: Room not found
 */
router.get('/', authenticate, asyncHandler(gameController.getGameState));

/**
 * @openapi
 * /api/rooms/{id}/game/answer:
 *   post:
 *     tags:
 *       - Game
 *     summary: Submit answer
 *     description: Submit an answer for the current question with a bet amount
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *               - betAmount
 *               - timeRemaining
 *             properties:
 *               answer:
 *                 oneOf:
 *                   - type: integer
 *                     description: Single answer index
 *                   - type: array
 *                     items:
 *                       type: integer
 *                     description: Multiple answer indices
 *               betAmount:
 *                 type: integer
 *                 minimum: 0
 *                 description: Points to bet on this answer
 *               timeRemaining:
 *                 type: number
 *                 description: Seconds remaining when answer was submitted
 *     responses:
 *       200:
 *         description: Answer submitted
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
 *                     isCorrect:
 *                       type: boolean
 *                     pointsEarned:
 *                       type: integer
 *                     correctAnswer:
 *                       type: array
 *                     newScore:
 *                       type: integer
 *       400:
 *         description: Already answered or invalid answer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not in this room
 *       404:
 *         description: Room not found
 */
router.post('/answer', authenticate, validate(submitAnswerSchema), asyncHandler(gameController.submitAnswer));

/**
 * @openapi
 * /api/rooms/{id}/game/next:
 *   post:
 *     tags:
 *       - Game
 *     summary: Next question
 *     description: Move to the next question (creator only)
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
 *     responses:
 *       200:
 *         description: Moved to next question or game finished
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
 *                     finished:
 *                       type: boolean
 *                     questionNumber:
 *                       type: integer
 *                     totalQuestions:
 *                       type: integer
 *                     question:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can advance questions
 *       404:
 *         description: Room not found
 */
router.post('/next', authenticate, asyncHandler(gameController.nextQuestion));

/**
 * @openapi
 * /api/rooms/{id}/game/results:
 *   get:
 *     tags:
 *       - Game
 *     summary: Get game results
 *     description: Get final game results with detailed answer history
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
 *     responses:
 *       200:
 *         description: Game results
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
 *                     roomId:
 *                       type: string
 *                     status:
 *                       type: string
 *                     winner:
 *                       $ref: '#/components/schemas/UserBasic'
 *                     results:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not in this room
 *       404:
 *         description: Room not found
 */
router.get('/results', authenticate, asyncHandler(gameController.getResults));

/**
 * @openapi
 * /api/rooms/{id}/leaderboard:
 *   get:
 *     tags:
 *       - Game
 *     summary: Get leaderboard
 *     description: Get current player scores/rankings
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
 *     responses:
 *       200:
 *         description: Current leaderboard
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not in this room
 *       404:
 *         description: Room not found
 */
router.get('/leaderboard', authenticate, asyncHandler(gameController.getLeaderboard));

/**
 * @openapi
 * /api/rooms/{id}/game/question/{questionId}/results:
 *   get:
 *     tags:
 *       - Game
 *     summary: Get question results
 *     description: Get results for a specific question after all players answered
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
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Question UUID
 *     responses:
 *       200:
 *         description: Question results with correct answer and player responses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not in this room
 *       404:
 *         description: Room or question not found
 */
router.get(
  '/question/:questionId/results',
  authenticate,
  validateUUID('questionId'),
  asyncHandler(gameController.getQuestionResults)
);

export default router;
