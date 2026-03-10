/**
 * Shared Pagination Helper
 * Replaces manual skip/take/meta calculation across services
 */

import { PaginationMeta, PaginatedResult } from '../types/pagination';

interface PaginateOptions<T> {
  findMany: (args: { skip: number; take: number }) => Promise<T[]>;
  count: () => Promise<number>;
  page?: number;
  limit?: number;
}

/**
 * Generic paginate helper that handles skip/take and meta calculation
 */
export async function paginate<T>(options: PaginateOptions<T>): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(100, options.limit || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    options.findMany({ skip, take: limit }),
    options.count(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  return { data, meta };
}

/**
 * Build pagination meta from raw values
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
