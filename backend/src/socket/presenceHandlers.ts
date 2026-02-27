/**
 * Presence Handlers
 * Manages online/offline user tracking and friend notifications
 */

import { Server } from 'socket.io';
import { prisma } from '../config/database';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
} from './types';
import logger from '../utils/logger';

// Online users tracking (in production, use Redis)
export const onlineUsers: Set<string> = new Set();

/**
 * Track user as online and notify friends
 */
export function trackUserOnline(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: string
): void {
  const wasOffline = !onlineUsers.has(userId);
  onlineUsers.add(userId);

  if (wasOffline) {
    notifyFriendsOnline(io, userId);
  }
}

/**
 * Track user as offline
 */
export function trackUserOffline(userId: string): void {
  onlineUsers.delete(userId);
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

  return friendIds.filter((id) => onlineUsers.has(id));
}

/**
 * Notify friends that user came online
 */
export async function notifyFriendsOnline(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  userId: string
): Promise<void> {
  try {
    // Get all friends (not just online)
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

    // Notify each online friend
    io.sockets.sockets.forEach((socket) => {
      const authSocket = socket as AuthenticatedSocket;
      if (friendIds.includes(authSocket.userId)) {
        authSocket.emit('friend:online', { userId });
      }
    });
  } catch (error: any) {
    logger.error(`Error notifying friends online: ${error.message}`);
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

    // Notify each online friend
    io.sockets.sockets.forEach((socket) => {
      const authSocket = socket as AuthenticatedSocket;
      if (friendIds.includes(authSocket.userId)) {
        authSocket.emit('friend:offline', { userId });
      }
    });
  } catch (error: any) {
    logger.error(`Error notifying friends offline: ${error.message}`);
  }
}
