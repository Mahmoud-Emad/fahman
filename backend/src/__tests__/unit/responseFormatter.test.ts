/**
 * Response Formatter Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '../../shared/utils/responseFormatter';

describe('Response Formatter', () => {
  describe('successResponse', () => {
    it('should format a basic success response', () => {
      const result = successResponse({ id: 1 });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Success');
      expect(result.data).toEqual({ id: 1 });
    });

    it('should include custom message', () => {
      const result = successResponse({ id: 1 }, 'Created successfully');

      expect(result.message).toBe('Created successfully');
    });

    it('should include meta when provided', () => {
      const result = successResponse({ id: 1 }, 'Success', { version: '1.0' });

      expect((result as any).meta).toEqual({ version: '1.0' });
    });

    it('should not include meta when empty', () => {
      const result = successResponse({ id: 1 }, 'Success', {});

      expect((result as any).meta).toBeUndefined();
    });

    it('should handle null data', () => {
      const result = successResponse(null, 'Deleted');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle array data', () => {
      const result = successResponse([1, 2, 3]);

      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('errorResponse', () => {
    it('should format a basic error response', () => {
      const result = errorResponse('Something went wrong');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Something went wrong');
      expect((result as any).errors).toBeUndefined();
    });

    it('should include errors when provided', () => {
      const errors = { email: 'Invalid email', password: 'Too short' };
      const result = errorResponse('Validation failed', errors);

      expect(result.success).toBe(false);
      expect((result as any).errors).toEqual(errors);
    });

    it('should handle array errors', () => {
      const errors = ['Error 1', 'Error 2'];
      const result = errorResponse('Multiple errors', errors);

      expect((result as any).errors).toEqual(errors);
    });
  });

  describe('paginatedResponse', () => {
    const sampleData = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ];

    it('should format a paginated response', () => {
      const result = paginatedResponse(sampleData, 1, 10, 25);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sampleData);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should calculate hasNext correctly for last page', () => {
      const result = paginatedResponse(sampleData, 3, 10, 25);

      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('should calculate hasNext correctly for middle page', () => {
      const result = paginatedResponse(sampleData, 2, 10, 25);

      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });

    it('should handle single page', () => {
      const result = paginatedResponse(sampleData, 1, 10, 3);

      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrev).toBe(false);
    });

    it('should handle empty data', () => {
      const result = paginatedResponse([], 1, 10, 0);

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should handle edge case with exact page boundary', () => {
      const result = paginatedResponse(sampleData, 2, 10, 20);

      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNext).toBe(false);
    });

    it('should handle string page/limit inputs', () => {
      // These get parsed to integers
      const result = paginatedResponse(sampleData, '2' as any, '10' as any, 25);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
    });
  });
});
