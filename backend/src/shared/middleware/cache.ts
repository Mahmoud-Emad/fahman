/**
 * Redis Response Cache Middleware
 * Caches GET request responses in Redis with configurable TTL
 */

import { Request, Response, NextFunction } from 'express';
import { getRedis } from '@config/redis';
import logger from '../utils/logger';

const CACHE_PREFIX = 'cache:';

/**
 * Create a cache middleware with the specified TTL
 */
export function cacheResponse(ttlSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${CACHE_PREFIX}${req.originalUrl}`;

    try {
      const redis = getRedis();
      const cached = await redis.get(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        res.json(data);
        return;
      }
    } catch {
      // Redis error — proceed without cache
    }

    // Override res.json to intercept the response and cache it
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const redis = getRedis();
          redis.set(cacheKey, JSON.stringify(body), 'EX', ttlSeconds).catch(() => {});
        } catch {
          // Ignore cache write errors
        }
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cache for a specific URL pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch {
    // Best effort invalidation
  }
}
