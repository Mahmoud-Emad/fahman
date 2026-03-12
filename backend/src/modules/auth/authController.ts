/**
 * Authentication Controller
 * Handles registration, login, token refresh, and session management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { getRedis } from '@config/redis';
import { hashPassword, comparePassword } from '@shared/utils/passwordUtils';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, extractTokenFromHeader, verifyToken } from '@shared/utils/tokenUtils';
import { successResponse } from '@shared/utils/responseFormatter';
import { UnauthorizedError, ConflictError } from '@shared/utils/errors';
import logger from '@shared/utils/logger';
import { AuthRequest } from '@shared/types/index';
import { StreakService } from '../user/streakService';
import { generateUniqueUsername, getUserResponse, createAuthResponse } from './authService';
import { invalidateUserCache } from '@shared/middleware/auth';

const REFRESH_TOKEN_TTL = 2592000; // 30 days in seconds

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register a new user with email and password
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { displayName, email, password, avatar } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(password);

    // Use interactive transaction so the row is rolled back if username generation fails
    const updatedUser = await prisma.$transaction(async (tx) => {
      const tempUsername = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const user = await tx.user.create({
        data: {
          username: tempUsername,
          email,
          passwordHash,
          displayName,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
          authProvider: 'LOCAL',
          lastLogin: new Date(),
        },
      });

      const username = await generateUniqueUsername(displayName, user.gameId);

      return tx.user.update({
        where: { id: user.id },
        data: { username },
      });
    });

    logger.info(`New user registered: ${updatedUser.username} (${updatedUser.email}) - Game ID: ${updatedUser.gameId}`);

    res.status(201).json(await createAuthResponse(updatedUser, 'User registered successfully', true));
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new user with phone number and password
 */
export async function registerWithPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, phoneNumber, password, displayName, avatar } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.phoneNumber === phoneNumber) {
        throw new ConflictError('Phone number already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username already taken');
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        phoneNumber,
        passwordHash,
        displayName: displayName || username,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        authProvider: 'LOCAL',
        phoneVerified: false,
        lastLogin: new Date(),
      },
    });

    logger.info(`New user registered with phone: ${user.username} - Game ID: ${user.gameId}`);

    res.status(201).json(
      successResponse(
        {
          user: getUserResponse(user),
          message: 'Please verify your phone number to complete registration',
        },
        'User registered successfully. Phone verification required.'
      )
    );
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// LOGIN METHODS
// =============================================================================

/**
 * Login with email and password
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please use Google or Facebook.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await Promise.all([
      StreakService.updateStreak(user.id),
      prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }),
    ]);

    logger.info(`User logged in: ${user.username}`);

    res.json(await createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

/**
 * Login with phone number and password
 */
export async function loginWithPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const { phoneNumber, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phoneNumber } });

    if (!user) {
      throw new UnauthorizedError('Invalid phone number or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.phoneVerified) {
      throw new UnauthorizedError('Phone number not verified. Please verify your phone first.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please use Google or Facebook.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid phone number or password');
    }

    await Promise.all([
      StreakService.updateStreak(user.id),
      prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }),
    ]);

    logger.info(`User logged in with phone: ${user.username}`);

    res.json(await createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

/**
 * Login with game ID and password
 */
export async function loginWithGameId(req: Request, res: Response, next: NextFunction) {
  try {
    const { gameId, password } = req.body;

    const user = await prisma.user.findUnique({ where: { gameId } });

    if (!user) {
      throw new UnauthorizedError('Invalid Game ID or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please use Google or Facebook.');
    }

    if (user.phoneNumber && !user.phoneVerified) {
      throw new UnauthorizedError('Phone number not verified. Please verify your phone first.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid Game ID or password');
    }

    await Promise.all([
      StreakService.updateStreak(user.id),
      prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }),
    ]);

    logger.info(`User logged in with Game ID: ${user.gameId} (${user.username})`);

    res.json(await createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// TOKEN & SESSION MANAGEMENT
// =============================================================================

/**
 * Refresh access token (with token rotation)
 * Verifies the old refresh token's jti exists in Redis, then issues new tokens
 * and revokes the old one (single-use refresh tokens).
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded.jti) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check that this refresh token hasn't been revoked
    const redis = getRedis();
    const oldKey = `refresh:token:${user.id}:${decoded.jti}`;
    const isValid = await redis.get(oldKey);

    if (!isValid) {
      throw new UnauthorizedError('Token revoked');
    }

    // Rotate: delete old refresh token, issue new pair
    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const { token: newRefreshToken, jti: newJti } = generateRefreshToken({ userId: user.id, role: user.role });

    const pipeline = redis.pipeline();
    pipeline.del(oldKey);
    pipeline.set(`refresh:token:${user.id}:${newJti}`, 'valid', 'EX', REFRESH_TOKEN_TTL);
    await pipeline.exec();

    res.json(
      successResponse(
        {
          tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json(successResponse(getUserResponse(user), 'User retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Logout — blacklist current access token, revoke refresh token
 */
export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const redis = getRedis();

    // Blacklist the current access token for its remaining lifetime
    const token = extractTokenFromHeader(req.headers.authorization);
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded.jti && decoded.exp) {
          const remainingSeconds = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingSeconds > 0) {
            await redis.set(`blacklist:token:${decoded.jti}`, '1', 'EX', remainingSeconds);
          }
        }
      } catch {
        // Token already expired or invalid — no need to blacklist
      }
    }

    // Revoke the refresh token if provided in the request body
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.jti) {
          await redis.del(`refresh:token:${req.user.id}:${decoded.jti}`);
        }
      } catch {
        // Refresh token invalid/expired — already effectively revoked
      }
    }

    await invalidateUserCache(req.user.id);
    logger.info(`User logged out: ${req.user.username}`);
    res.json(successResponse(null, 'Logout successful'));
  } catch (error) {
    next(error);
  }
}
