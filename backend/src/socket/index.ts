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
import { registerGameHandlers, cleanupGameRoom } from './handlers/gameHandlers';
import { registerChatHandlers, cleanupUserTyping } from './handlers/chatHandlers';
import { registerDmHandlers, cleanupUserDmTyping } from './handlers/dmHandlers';
import {
  trackUserOnline,
  trackUserOffline,
  refreshPresence,
  getOnlineFriends,
  notifyFriendsOffline,
} from './presenceHandlers';
import { SocketRegistry } from './registry';
import { prisma } from '@config/database';
import logger from '@shared/utils/logger';
import { getErrorMessage } from '@shared/utils/errorUtils';
import { config } from '@config/env';

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
        origin: config.cors.origins,
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

    // Join user-specific room for O(1) targeted emits
    authSocket.join(`user:${authSocket.userId}`);

    // Track online status
    trackUserOnline(io, authSocket.userId);

    // Refresh presence TTL on every Socket.io heartbeat (~25s)
    socket.conn.on('packet', (packet: { type: string }) => {
      if (packet.type === 'pong') {
        refreshPresence(authSocket.userId).catch(() => {});
      }
    });

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
        logger.error(`Error getting friend status: ${getErrorMessage(error)}`);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${authSocket.username} (${reason})`);

      // Notify all rooms the user was in that they left
      const roomIds = Array.from(authSocket.roomIds || new Set());
      for (const roomId of roomIds) {
        io.to(roomId).emit('room:playerLeft', {
          roomId,
          playerId: authSocket.userId,
        });

        // If no active members remain, clean up game timers and close room
        try {
          const activeMembers = await prisma.roomMember.count({
            where: { roomId, isActive: true },
          });

          if (activeMembers === 0) {
            cleanupGameRoom(roomId);
            await prisma.room.update({
              where: { id: roomId },
              data: { status: 'CLOSED' },
            });
            logger.info(`Room ${roomId} closed — all players disconnected`);
          }
        } catch (error) {
          logger.error(`Error checking/closing room ${roomId}: ${getErrorMessage(error)}`);
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
  return registry;
}

/**
 * Get the SocketRegistry instance
 */
export function getSocketRegistry(): SocketRegistry | null {
  return registry;
}

// Re-export handler utilities for external use
export { broadcastRoomClosed, notifyPlayerKicked } from './handlers/roomHandlers';
export { broadcastGameStarted, cleanupGameRoom } from './handlers/gameHandlers';
