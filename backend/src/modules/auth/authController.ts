/**
 * Authentication Controller
 * Handles registration, login, token refresh, and session management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword } from '../../shared/utils/passwordUtils';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/tokenUtils';
import { successResponse } from '../../shared/utils/responseFormatter';
import { UnauthorizedError, ConflictError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import { AuthRequest } from '../../shared/types/index';
import { StreakService } from '../user/streakService';
import { generateUniqueUsername, getUserResponse, createAuthResponse } from './authService';

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
    const tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const user = await prisma.user.create({
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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    logger.info(`New user registered: ${updatedUser.username} (${updatedUser.email}) - Game ID: ${updatedUser.gameId}`);

    res.status(201).json(createAuthResponse(updatedUser, 'User registered successfully', true));
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

    await StreakService.updateStreak(user.id);

    logger.info(`User logged in: ${user.username}`);

    res.json(createAuthResponse(user, 'Login successful'));
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

    await StreakService.updateStreak(user.id);

    logger.info(`User logged in with phone: ${user.username}`);

    res.json(createAuthResponse(user, 'Login successful'));
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

    await StreakService.updateStreak(user.id);

    logger.info(`User logged in with Game ID: ${user.gameId} (${user.username})`);

    res.json(createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// TOKEN & SESSION MANAGEMENT
// =============================================================================

/**
 * Refresh access token
 */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

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
 * Logout
 */
export function logout(req: AuthRequest, res: Response) {
  logger.info(`User logged out: ${req.user.username}`);
  res.json(successResponse(null, 'Logout successful'));
}
