/**
 * Presence Handlers
 * Manages online/offline user tracking and friend notifications
 * Uses Redis for distributed presence tracking
 */

import { Server } from 'socket.io';
import { prisma } from '@config/database';
import { getRedis } from '@config/redis';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from './types';
import logger from '@shared/utils/logger';
import { getErrorMessage } from '@shared/utils/errorUtils';

const PRESENCE_TTL = 300; // 5 minutes
const PRESENCE_PREFIX = 'presence:';

/**
 * Track user as online and notify friends
 */
export async function trackUserOnline(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: string
): Promise<void> {
  const redis = getRedis();
  const key = `${PRESENCE_PREFIX}${userId}`;
  const wasOffline = !(await redis.exists(key));
  await redis.set(key, '1', 'EX', PRESENCE_TTL);

  if (wasOffline) {
    notifyFriendsOnline(io, userId);
  }
}

/**
 * Refresh presence heartbeat (extend TTL)
 */
export async function refreshPresence(userId: string): Promise<void> {
  const redis = getRedis();
  await redis.expire(`${PRESENCE_PREFIX}${userId}`, PRESENCE_TTL);
}

/**
 * Track user as offline
 */
export async function trackUserOffline(userId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${PRESENCE_PREFIX}${userId}`);
}

/**
 * Check if a user is online
 */
export async function isUserOnline(userId: string): Promise<boolean> {
  const redis = getRedis();
  return (await redis.exists(`${PRESENCE_PREFIX}${userId}`)) === 1;
}

/**
 * Get online friends for a user
 */
export async function getOnlineFriends(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId, status: 'ACCEPTED' },
        { friendId: userId, status: 'ACCEPTED' },
      ],
    },
    select: { userId: true, friendId: true },
  });

  const friendIds = friendships.map((f) =>
    f.userId === userId ? f.friendId : f.userId
  );

  if (friendIds.length === 0) return [];

  // Batch check with pipeline
  const redis = getRedis();
  const pipeline = redis.pipeline();
  for (const id of friendIds) {
    pipeline.exists(`${PRESENCE_PREFIX}${id}`);
  }
  const results = await pipeline.exec();

  return friendIds.filter((_, i) => results && results[i]?.[1] === 1);
}

/**
 * Notify friends that user came online
 */
export async function notifyFriendsOnline(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: string
): Promise<void> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      select: { userId: true, friendId: true },
    });

    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );

    for (const friendId of friendIds) {
      io.to(`user:${friendId}`).emit('friend:online', { userId });
    }
  } catch (error) {
    logger.error(`Error notifying friends online: ${getErrorMessage(error)}`);
  }
}

/**
 * Notify friends that user went offline
 */
export async function notifyFriendsOffline(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: string
): Promise<void> {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      select: { userId: true, friendId: true },
    });

    const friendIds = friendships.map((f) =>
      f.userId === userId ? f.friendId : f.userId
    );

    for (const friendId of friendIds) {
      io.to(`user:${friendId}`).emit('friend:offline', { userId });
    }
  } catch (error) {
    logger.error(`Error notifying friends offline: ${getErrorMessage(error)}`);
  }
}
