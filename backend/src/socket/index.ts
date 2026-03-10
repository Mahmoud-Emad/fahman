/**
 * Socket.io Server Setup
 * Main entry point for WebSocket functionality
 */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './types';
import { authenticateSocket } from './middleware';
import { registerRoomHandlers } from './handlers/roomHandlers';
import { registerGameHandlers } from './handlers/gameHandlers';
import { registerChatHandlers, cleanupUserTyping } from './handlers/chatHandlers';
import { registerDmHandlers, cleanupUserDmTyping } from './handlers/dmHandlers';
import {
  trackUserOnline,
  trackUserOffline,
  getOnlineFriends,
  notifyFriendsOffline,
} from './presenceHandlers';
import { SocketRegistry } from './registry';
import logger from '../shared/utils/logger';
import { config } from '../config/env';

// The registry instance
let registry: SocketRegistry | null = null;

/**
 * Initialize Socket.io server and return the SocketRegistry
 */
export function initializeSocket(httpServer: HttpServer): SocketRegistry {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    }
  );

  registry = new SocketRegistry(io);

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
    trackUserOnline(io, authSocket.userId);

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
      } catch (error) {
        logger.error(`Error getting friend status: ${error instanceof Error ? error.message : error}`);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${authSocket.username} (${reason})`);

      // Notify all rooms the user was in that they left
      const roomIds = Array.from(authSocket.roomIds || new Set());
      if (roomIds.length > 0) {
        roomIds.forEach((roomId) => {
          io.to(roomId).emit('room:playerLeft', {
            roomId,
            playerId: authSocket.userId,
          });
        });
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
  return registry;
}

/**
 * Get the SocketRegistry instance
 */
export function getSocketRegistry(): SocketRegistry | null {
  return registry;
}

// ---------------------------------------------------------------------------
// Backward-compatible facade functions
// These delegate to the registry. They will be removed in Phase 7 when
// controllers access the registry via req.app.get('socketRegistry').
// ---------------------------------------------------------------------------

function getRegistry(): SocketRegistry {
  if (!registry) {
    logger.warn('Socket.io not initialized');
    throw new Error('Socket.io not initialized');
  }
  return registry;
}

export function sendNotificationToUser(userId: string, notification: unknown): void {
  try { getRegistry().sendNotificationToUser(userId, notification); } catch {}
}

export function sendNotificationUpdate(userId: string, data: { id: string; actionTaken: string }): void {
  try { getRegistry().sendNotificationUpdate(userId, data); } catch {}
}

export function emitRoomClosed(roomId: string, reason: string): void {
  try { getRegistry().emitRoomClosed(roomId, reason); } catch {}
}

export function emitRoomListUpdate(roomId: string, currentPlayers: number, status: string): void {
  try { getRegistry().emitRoomListUpdate(roomId, currentPlayers, status); } catch {}
}

export function emitPlayerLeft(roomId: string, userId: string): void {
  try { getRegistry().emitPlayerLeft(roomId, userId); } catch {}
}

export function emitPlayerKicked(roomId: string, userId: string, reason: string): void {
  try { getRegistry().emitPlayerKicked(roomId, userId, reason); } catch {}
}

export function emitGameStarted(roomId: string): void {
  try { getRegistry().emitGameStarted(roomId); } catch {}
}

export function emitDmMessage(recipientId: string, message: unknown): void {
  try { getRegistry().emitDmMessage(recipientId, message as any); } catch {}
}

export function emitPlayerJoined(roomId: string, player: {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  isReady: boolean;
  role: string;
}): void {
  try { getRegistry().emitPlayerJoined(roomId, player); } catch {}
}

export function emitRoomUpdated(roomId: string, updates: unknown): void {
  try { getRegistry().emitRoomUpdated(roomId, updates as any); } catch {}
}

export function emitPlayerReady(roomId: string, playerId: string, isReady: boolean): void {
  try { getRegistry().emitPlayerReady(roomId, playerId, isReady); } catch {}
}

export async function emitFriendshipAccepted(userId: string, friendId: string): Promise<void> {
  try { await getRegistry().emitFriendshipAccepted(userId, friendId); } catch {}
}

export async function isUserOnline(userId: string): Promise<boolean> {
  try { return await getRegistry().isUserOnline(userId); } catch { return false; }
}

// Re-export handler utilities for external use
export { broadcastRoomClosed, notifyPlayerKicked } from './handlers/roomHandlers';
export { broadcastGameStarted, cleanupGameRoom } from './handlers/gameHandlers';
