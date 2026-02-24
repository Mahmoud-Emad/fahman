/**
 * Authentication Middleware
 * Handles JWT verification and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { verifyToken, extractTokenFromHeader } from '../utils/tokenUtils';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { AuthRequest } from '../types';

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

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    // Attach user to request
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
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          avatar: true,
          isActive: true,
        },
      });

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
