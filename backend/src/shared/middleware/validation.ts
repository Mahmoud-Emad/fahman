/**
 * Validation Middleware
 * Validates request data using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Middleware to validate request data against a Joi schema
 */
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed', {
        errors: details,
        path: req.path,
        requestId: req.requestId,
      });

      const validationError = new ValidationError('Validation failed');
      (validationError as any).details = details;
      return next(validationError);
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
}

/**
 * Middleware to validate query parameters against a Joi schema
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(new ValidationError('Invalid query parameters'));
    }

    req.query = value;
    next();
  };
}

/**
 * Validate UUID parameter
 */
export function validateUUID(paramName: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const paramValue = req.params[paramName];

    if (!paramValue || !uuidRegex.test(paramValue)) {
      return next(new ValidationError(`Invalid ${paramName} format`));
    }

    next();
  };
}
