/**
 * Game Controller
 * HTTP request handlers for game operations
 */

import { Response, NextFunction } from 'express';
import gameService from '../services/gameService';
import { successResponse } from '../utils/responseFormatter';
import { AuthRequest } from '../types';

/**
 * Get current game state
 */
export async function getGameState(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const gameState = await gameService.getGameState(req.params.id, req.user.id);
    res.json(successResponse(gameState));
  } catch (error) {
    next(error);
  }
}

/**
 * Submit answer for current question
 */
export async function submitAnswer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { answer, betAmount, timeRemaining } = req.body;
    const result = await gameService.submitAnswer(req.params.id, req.user.id, {
      answer,
      betAmount,
      timeRemaining,
    });
    res.json(successResponse(result, result.isCorrect ? 'Correct!' : 'Wrong answer'));
  } catch (error) {
    next(error);
  }
}

/**
 * Move to next question (creator only)
 */
export async function nextQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await gameService.nextQuestion(req.params.id, req.user.id);
    const message = result.finished ? 'Game finished' : `Question ${result.questionNumber}`;
    res.json(successResponse(result, message));
  } catch (error) {
    next(error);
  }
}

/**
 * Get game results
 */
export async function getResults(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await gameService.getResults(req.params.id, req.user.id);
    res.json(successResponse(results));
  } catch (error) {
    next(error);
  }
}

/**
 * Get current leaderboard
 */
export async function getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const leaderboard = await gameService.getLeaderboard(req.params.id, req.user.id);
    res.json(successResponse(leaderboard));
  } catch (error) {
    next(error);
  }
}

/**
 * Get results for a specific question
 */
export async function getQuestionResults(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const results = await gameService.getQuestionResults(
      req.params.id,
      req.params.questionId,
      req.user.id
    );
    res.json(successResponse(results));
  } catch (error) {
    next(error);
  }
}
