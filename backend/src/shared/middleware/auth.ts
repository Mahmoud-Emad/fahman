/**
 * Authentication Middleware
 * Handles JWT verification and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { getRedis } from '@config/redis';
import { verifyToken, extractTokenFromHeader } from '../utils/tokenUtils';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthRequest, AuthUser } from '../types/index';

const USER_CACHE_PREFIX = 'user:cache:';
const USER_CACHE_TTL = 60; // 1 minute — short TTL to limit stale data after deactivation/role changes

/**
 * Load user by ID — checks Redis cache first, falls back to DB.
 */
async function loadUser(userId: string): Promise<AuthUser | null> {
  const cacheKey = `${USER_CACHE_PREFIX}${userId}`;

  // Try Redis cache first
  try {
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as AuthUser;
  } catch {
    // Redis unavailable — fall through to DB
  }

  // Cache miss — query database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
    },
  });

  if (!user) return null;

  // Populate cache (best-effort)
  try {
    const redis = getRedis();
    await redis.set(cacheKey, JSON.stringify(user), 'EX', USER_CACHE_TTL);
  } catch {
    // Redis unavailable — proceed without caching
  }

  return user;
}

/**
 * Authenticate user via JWT token
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = verifyToken(token);

    // Check if this access token has been blacklisted (logout)
    if (decoded.jti) {
      try {
        const redis = getRedis();
        const blacklisted = await redis.exists(`blacklist:token:${decoded.jti}`);
        if (blacklisted) {
          throw new UnauthorizedError('Token has been revoked');
        }
      } catch (error) {
        // Re-throw auth errors, swallow Redis connection errors
        if (error instanceof UnauthorizedError) throw error;
      }
    }

    const user = await loadUser(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    (req as AuthRequest).user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      const user = await loadUser(decoded.userId);

      if (user && user.isActive) {
        (req as AuthRequest).user = user;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (authReq.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
}

/**
 * Invalidate cached user data in Redis.
 * Call on logout or when user profile changes.
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`${USER_CACHE_PREFIX}${userId}`);
  } catch {
    // Redis unavailable — cache will expire naturally
  }
}

/**
 * Check if user owns the resource
 */
export function requireOwnership(paramName = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const resourceUserId = req.params[paramName] || req.params.userId;

    if (authReq.user.id !== resourceUserId && authReq.user.role !== 'ADMIN') {
      return next(new ForbiddenError('You can only access your own resources'));
    }

    next();
  };
}
