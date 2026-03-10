/**
 * Custom Error Classes Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../../shared/utils/errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const error = new AppError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 500);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 error with default message', () => {
      const error = new ValidationError();

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.isOperational).toBe(true);
    });

    it('should create a 400 error with custom message', () => {
      const error = new ValidationError('Invalid email format');

      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
    });

    it('should be an instance of AppError', () => {
      const error = new ValidationError();

      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error with default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    it('should create a 401 error with custom message', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error.message).toBe('Token expired');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error with default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Access forbidden');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    it('should create a 403 error with custom message', () => {
      const error = new ForbiddenError('You are not allowed to access this resource');

      expect(error.message).toBe('You are not allowed to access this resource');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error with default message', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create a 404 error with custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error with default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    it('should create a 409 error with custom message', () => {
      const error = new ConflictError('Email already exists');

      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('InternalServerError', () => {
    it('should create a 500 error with default message', () => {
      const error = new InternalServerError();

      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
    });

    it('should create a 500 error with custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Error type checking', () => {
    it('should allow checking error types with instanceof', () => {
      const validationError = new ValidationError();
      const notFoundError = new NotFoundError();

      expect(validationError instanceof ValidationError).toBe(true);
      expect(validationError instanceof NotFoundError).toBe(false);

      expect(notFoundError instanceof NotFoundError).toBe(true);
      expect(notFoundError instanceof ValidationError).toBe(false);
    });

    it('all custom errors should be instances of AppError', () => {
      const errors = [
        new ValidationError(),
        new UnauthorizedError(),
        new ForbiddenError(),
        new NotFoundError(),
        new ConflictError(),
        new InternalServerError(),
      ];

      for (const error of errors) {
        expect(error instanceof AppError).toBe(true);
      }
    });
  });
});
