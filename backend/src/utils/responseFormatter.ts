/**
 * Response Formatter Utilities
 * Provides standardized API response formats
 */

import { SuccessResponse, ErrorResponse, PaginatedResponse, PaginationMeta } from '../types';

/**
 * Format a successful response
 */
export function successResponse<T>(
  data: T,
  message = 'Success',
  meta?: Record<string, any>
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    ...(meta && Object.keys(meta).length > 0 && { meta }),
  };
}

/**
 * Format an error response
 */
export function errorResponse(message: string, errors: any = null): ErrorResponse {
  return {
    success: false,
    message,
    ...(errors && { errors }),
  };
}

/**
 * Format a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  const meta: PaginationMeta = {
    page: parseInt(String(page)),
    limit: parseInt(String(limit)),
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return {
    success: true,
    data,
    meta,
  };
}
