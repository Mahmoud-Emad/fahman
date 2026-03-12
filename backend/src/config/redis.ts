/**
 * Redis Client Configuration
 * Provides a singleton Redis client for caching and pub/sub
 */

import Redis from 'ioredis';
import { config } from './env';
import logger from '@shared/utils/logger';

let redisClient: Redis | null = null;

/**
 * Connect to Redis
 */
export async function connectRedis(): Promise<Redis> {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        logger.error('Redis: max retries reached, giving up');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Get the Redis client (must call connectRedis first)
 */
export function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
}

/**
 * Disconnect Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}
