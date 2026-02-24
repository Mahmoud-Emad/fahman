/**
 * Socket.io Server Setup
 * Main entry point for WebSocket functionality
 */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { prisma } from '../config/database';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './types';
import { authenticateSocket } from './middleware';
import { registerRoomHandlers, broadcastRoomClosed, notifyPlayerKicked } from './handlers/roomHandlers';
import { registerGameHandlers, broadcastGameStarted, cleanupGameRoom } from './handlers/gameHandlers';
import { registerChatHandlers, cleanupUserTyping } from './handlers/chatHandlers';
import { registerDmHandlers, cleanupUserDmTyping, emitDirectMessage } from './handlers/dmHandlers';
import logger from '../utils/logger';

// Store the io instance for use in other modules
let ioInstance: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

/**
 * Initialize Socket.io server
 */
export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    }
  );

  // Store instance
  ioInstance = io;

  // Authentication middleware
  io.use(authenticateSocket);

  // Connection handler
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    logger.info(`Socket connected: ${authSocket.username} (${socket.id})`);

    // Send connection success
    authSocket.emit('connection:success', {
      userId: authSocket.userId,
      username: authSocket.username,
    });

    // Track online status
    trackUserOnline(authSocket.userId);

    // Register event handlers
    registerRoomHandlers(io, authSocket);
    registerGameHandlers(io, authSocket);
    registerChatHandlers(io, authSocket);
    registerDmHandlers(io, authSocket);

    // Friend status request
    authSocket.on('friend:status', async () => {
      try {
        const onlineFriends = await getOnlineFriends(authSocket.userId);
        authSocket.emit('friend:statusList', { online: onlineFriends });
      } catch (error: any) {
        logger.error(`Error getting friend status: ${error.message}`);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${authSocket.username} (${reason})`);

      // Update presence in all rooms user was in
      const roomIds = Array.from(authSocket.roomIds || new Set());
      if (roomIds.length > 0) {
        try {
          // Update last seen in database for all rooms
          await prisma.roomMember.updateMany({
            where: {
              userId: authSocket.userId,
              roomId: { in: roomIds },
              isActive: true,
            },
            data: {
              lastSeenAt: new Date(),
            },
          });

          // Notify each room that player left
          roomIds.forEach((roomId) => {
            io.to(roomId).emit('room:playerLeft', {
              roomId,
              playerId: authSocket.userId,
            });
          });
        } catch (error: any) {
          logger.error(`Error updating room presence on disconnect: ${error.message}`);
        }
      }

      // Clean up
      cleanupUserTyping(authSocket.userId);
      cleanupUserDmTyping(authSocket.userId);
      trackUserOffline(authSocket.userId);

      // Notify friends
      notifyFriendsOffline(io, authSocket.userId);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for ${authSocket.username}: ${error.message}`);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

/**
 * Get the Socket.io instance
 */
export function getIO(): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null {
  return ioInstance;
}

// Online users tracking (in production, use Redis)
const onlineUsers: Set<string> = new Set();

/**
 * Track user as online
 */
function trackUserOnline(userId: string): void {
  const wasOffline = !onlineUsers.has(userId);
  onlineUsers.add(userId);

  if (wasOffline && ioInstance) {
    // Notify friends that user came online
    notifyFriendsOnline(ioInstance, userId);
  }
}

/**
 * Track user as offline
 */
function trackUserOffline(userId: string): void {
  onlineUsers.delete(userId);
}

/**
 * Check if user is online
 */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

/**
 * Get online friends for a user
 */
async function getOnlineFriends(userId: string): Promise<string[]> {
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
async function notifyFriendsOnline(
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
async function notifyFriendsOffline(
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

/**
 * Send notification to a specific user via WebSocket
 */
export function sendNotificationToUser(userId: string, notification: any): void {
  if (!ioInstance) {
    logger.warn('Socket.io not initialized, cannot send notification');
    return;
  }

  let sent = false;
  ioInstance.sockets.sockets.forEach((socket) => {
    const authSocket = socket as AuthenticatedSocket;
    if (authSocket.userId === userId) {
      authSocket.emit('notification:new', notification);
      sent = true;
      logger.info(`Notification sent to user ${userId}: ${notification.type}`);
    }
  });

  if (!sent) {
    logger.info(`User ${userId} not connected, notification not sent in real-time`);
  }
}

/**
 * Broadcast room closed event
 */
export function emitRoomClosed(roomId: string, reason: string): void {
  if (!ioInstance) return;
  broadcastRoomClosed(ioInstance, roomId, reason);
  cleanupGameRoom(roomId);
}

/**
 * Emit player kicked event
 */
export function emitPlayerKicked(roomId: string, userId: string, reason: string): void {
  if (!ioInstance) return;
  notifyPlayerKicked(ioInstance, roomId, userId, reason);
}

/**
 * Emit game started event
 */
export function emitGameStarted(roomId: string): void {
  if (!ioInstance) return;
  broadcastGameStarted(ioInstance, roomId);
}

/**
 * Send direct message via WebSocket (from HTTP endpoint)
 */
export function emitDmMessage(recipientId: string, message: any): void {
  if (!ioInstance) return;
  emitDirectMessage(ioInstance, recipientId, message);
}

/**
 * Emit player joined event (from HTTP endpoint)
 */
export function emitPlayerJoined(roomId: string, player: {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  isReady: boolean;
  role: string;
}): void {
  if (!ioInstance) return;
  ioInstance.to(roomId).emit('room:playerJoined', { roomId, player });
  logger.info(`Emitted player joined event for ${player.username} in room ${roomId}`);
}

/**
 * Emit room updated event (from HTTP endpoint)
 */
export function emitRoomUpdated(roomId: string, updates: any): void {
  if (!ioInstance) return;
  ioInstance.to(roomId).emit('room:updated', { roomId, updates });
}

/**
 * Emit player ready event (from HTTP endpoint)
 */
export function emitPlayerReady(roomId: string, playerId: string, isReady: boolean): void {
  if (!ioInstance) return;
  ioInstance.to(roomId).emit('room:playerReady', { roomId, playerId, isReady });
}

/**
 * Notify both users of new friendship (both online/offline status)
 */
export function emitFriendshipAccepted(userId: string, friendId: string): void {
  if (!ioInstance) return;

  ioInstance.sockets.sockets.forEach((socket) => {
    const authSocket = socket as AuthenticatedSocket;
    if (authSocket.userId === friendId && isUserOnline(userId)) {
      authSocket.emit('friend:online', { userId });
    }
    if (authSocket.userId === userId && isUserOnline(friendId)) {
      authSocket.emit('friend:online', { userId: friendId });
    }
  });
}

// Export handlers for external use
export { broadcastRoomClosed, notifyPlayerKicked, broadcastGameStarted, cleanupGameRoom };
