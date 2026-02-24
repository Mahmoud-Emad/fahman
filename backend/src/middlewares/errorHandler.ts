/**
 * Global Error Handler Middleware
 * Handles all errors and sends appropriate responses
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { errorResponse } from '../utils/responseFormatter';
import { AppError } from '../utils/errors';

/**
 * Global error handling middleware
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
  });

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    if (err.code === 'P2002') {
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.[0] || 'field';
      message = `${field} already exists`;
    } else if (err.code === 'P2025') {
      // Record not found
      statusCode = 404;
      message = 'Record not found';
    } else {
      message = 'Database operation failed';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (err.name === 'ValidationError' && err.details) {
    // Joi validation error
    statusCode = 400;
    errors = err.details.map((detail: any) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    message = 'Validation failed';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && !(err instanceof AppError)) {
    message = 'Internal Server Error';
    errors = null;
  }

  // Send error response
  res.status(statusCode).json(errorResponse(message, errors));
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json(errorResponse('Route not found'));
}
