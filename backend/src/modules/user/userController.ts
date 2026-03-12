/**
 * User Controller
 * Handles user profile and stats endpoints
 */

import { Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { UserStatsService } from './userStatsService';
import { successResponse } from '@shared/utils/responseFormatter';
import { NotFoundError } from '@shared/utils/errors';
import { AuthRequest } from '@shared/types/index';
import { getAuthUser } from '@shared/middleware/getAuthUser';
import { getSocketRegistry } from '@/socket';
import logger from '@shared/utils/logger';
import { getUserResponse } from '../auth/authService';
import { StreakService } from './streakService';

/**
 * Get current user statistics
 * GET /api/users/me/stats
 */
export async function getUserStats(req: AuthRequest, res: Response) {
  const userId = getAuthUser(req).id;

  const stats = await UserStatsService.getUserStats(userId);

  return res.json(successResponse(stats, 'User stats retrieved successfully'));
}

/**
 * Get recent games for current user
 * GET /api/users/me/games/recent
 */
export async function getRecentGames(req: AuthRequest, res: Response) {
  const userId = getAuthUser(req).id;
  const limit = parseInt(req.query.limit as string) || 10;

  const games = await UserStatsService.getRecentGames(userId, limit);

  return res.json(successResponse(games, 'Recent games retrieved successfully'));
}

/**
 * Get user achievements
 * GET /api/users/me/achievements
 */
export async function getUserAchievements(req: AuthRequest, res: Response) {
  const userId = getAuthUser(req).id;

  const achievements = await UserStatsService.getUserAchievements(userId);

  return res.json(successResponse(achievements, 'Achievements retrieved successfully'));
}

/**
 * Update streak on app open
 * POST /api/users/me/streak
 */
export async function updateStreak(req: AuthRequest, res: Response) {
  const streak = await StreakService.updateStreak(getAuthUser(req).id);
  return res.json(successResponse(streak));
}

/**
 * Get another user's public profile
 * GET /api/users/:userId
 */
export async function getPublicProfile(req: AuthRequest, res: Response) {
  const { userId } = req.params;
  const currentUserId = getAuthUser(req).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      bio: true,
      gameId: true,
      createdAt: true,
      role: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Count accepted friendships (where status is ACCEPTED)
  const friendsCount = await prisma.friendship.count({
    where: {
      OR: [
        { userId: userId, status: 'ACCEPTED' },
        { friendId: userId, status: 'ACCEPTED' },
      ],
    },
  });

  // Check friendship status with current user (accepted only)
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { userId: currentUserId, friendId: userId },
        { userId: userId, friendId: currentUserId },
      ],
    },
  });

  // Check if there's a pending friend request
  const pendingRequest = await prisma.friendship.findFirst({
    where: {
      status: 'PENDING',
      OR: [
        { userId: currentUserId, friendId: userId },
        { userId: userId, friendId: currentUserId },
      ],
    },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  return res.json(successResponse({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    bio: user.bio,
    gameId: user.gameId,
    createdAt: user.createdAt,
    isPremium: user.role === 'ADMIN',
    friendsCount,
    isFriend: !!friendship,
    isOnline: await getSocketRegistry()?.isUserOnline(userId) ?? false,
    pendingRequest: pendingRequest ? {
      id: pendingRequest.id,
      isSentByMe: pendingRequest.userId === currentUserId,
    } : null,
    isCurrentUser: userId === currentUserId,
  }, 'User profile retrieved successfully'));
}

/**
 * Get another user's statistics
 * GET /api/users/:userId/stats
 */
export async function getOtherUserStats(req: AuthRequest, res: Response) {
  const { userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const stats = await UserStatsService.getUserStats(userId);

  return res.json(successResponse(stats, 'User stats retrieved successfully'));
}

/**
 * Get another user's recent games
 * GET /api/users/:userId/games/recent
 */
export async function getOtherUserRecentGames(req: AuthRequest, res: Response) {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const games = await UserStatsService.getRecentGames(userId, limit);

  return res.json(successResponse(games, 'Recent games retrieved successfully'));
}

/**
 * Get another user's achievements
 * GET /api/users/:userId/achievements
 */
export async function getOtherUserAchievements(req: AuthRequest, res: Response) {
  const { userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const achievements = await UserStatsService.getUserAchievements(userId);

  return res.json(successResponse(achievements, 'Achievements retrieved successfully'));
}

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { displayName, bio, avatar } = req.body;

    const updateData: Record<string, string> = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const user = await prisma.user.update({
      where: { id: getAuthUser(req).id },
      data: updateData,
    });

    logger.info(`Profile updated for user: ${user.username}`);

    res.json(successResponse(getUserResponse(user), 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
}
