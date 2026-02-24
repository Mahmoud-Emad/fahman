/**
 * Question Controller
 */

import { Response, NextFunction } from 'express';
import questionService from '../services/questionService';
import { successResponse } from '../utils/responseFormatter';
import { AuthRequest } from '../types';

export async function createQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const question = await questionService.createQuestion(
      req.params.packId,
      req.user.id,
      req.body
    );
    res.status(201).json(successResponse(question, 'Question created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getPackQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const questions = await questionService.getPackQuestions(req.params.packId);
    res.json(successResponse(questions));
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const question = await questionService.updateQuestion(req.params.id, req.user.id, req.body);
    res.json(successResponse(question, 'Question updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await questionService.deleteQuestion(
      req.params.id,
      req.user.id,
      req.user.role === 'ADMIN'
    );
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateQuestions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const questions = await questionService.bulkCreateQuestions(
      req.params.packId,
      req.user.id,
      req.body.questions
    );
    res.status(201).json(successResponse(questions, 'Questions created successfully'));
  } catch (error) {
    next(error);
  }
}
