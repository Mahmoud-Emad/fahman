/**
 * Pagination Type Definitions
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface CursorParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
