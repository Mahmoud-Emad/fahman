/**
 * Room Socket Event Handlers
 */

import { Server } from 'socket.io';
import { prisma } from '@config/database';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  RoomMemberInfo,
} from '../types';
import logger from '@shared/utils/logger';
import { getErrorMessage } from '@shared/utils/errorUtils';

export function registerRoomHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
): void {
  /**
   * Join a room's socket channel
   */
  socket.on('room:join', async ({ roomId }) => {
    try {
      // Verify user is actually a member of this room
      const member = await prisma.roomMember.findFirst({
        where: {
          roomId,
          userId: socket.userId,
          isActive: true,
        },
        include: {
          room: {
            include: {
              members: {
                where: { isActive: true },
                include: {
                  user: {
                    select: { id: true, username: true, displayName: true, avatar: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!member) {
        socket.emit('error', { message: 'You are not a member of this room' });
        return;
      }

      // Join the socket room
      socket.join(roomId);
      socket.roomIds.add(roomId);

      // Build member list
      const members: RoomMemberInfo[] = member.room.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatar: m.user.avatar,
        score: m.score,
        isReady: m.isReady,
        role: m.role,
      }));

      // Send room joined confirmation
      socket.emit('room:joined', { roomId, members });

      // Notify others that this player connected
      socket.to(roomId).emit('room:playerJoined', {
        roomId,
        player: members.find((m) => m.id === socket.userId)!,
      });

      logger.info(`${socket.username} joined room socket: ${roomId}`);
    } catch (error) {
      logger.error(`Error joining room socket: ${getErrorMessage(error)}`);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  /**
   * Leave a room's socket channel
   */
  socket.on('room:leave', async ({ roomId }) => {
    try {
      socket.leave(roomId);
      socket.roomIds.delete(roomId);

      socket.emit('room:left', { roomId });

      // Notify others
      socket.to(roomId).emit('room:playerLeft', {
        roomId,
        playerId: socket.userId,
      });

      logger.info(`${socket.username} left room socket: ${roomId}`);
    } catch (error) {
      logger.error(`Error leaving room socket: ${getErrorMessage(error)}`);
    }
  });

  /**
   * Set ready status
   */
  socket.on('room:ready', async ({ roomId, isReady }) => {
    try {
      if (!socket.rooms.has(roomId)) {
        socket.emit('error', { message: 'Not in room' });
        return;
      }

      // Update in database
      await prisma.roomMember.updateMany({
        where: {
          roomId,
          userId: socket.userId,
          isActive: true,
        },
        data: { isReady },
      });

      // Broadcast to room
      io.to(roomId).emit('room:playerReady', {
        roomId,
        playerId: socket.userId,
        isReady,
      });

      logger.info(`${socket.username} set ready=${isReady} in room ${roomId}`);
    } catch (error) {
      logger.error(`Error setting ready status: ${getErrorMessage(error)}`);
      socket.emit('error', { message: 'Failed to update ready status' });
    }
  });
}

/**
 * Broadcast room update to all members
 */
export function broadcastRoomUpdate(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  updates: Record<string, any>
): void {
  io.to(roomId).emit('room:updated', { roomId, updates });
}

/**
 * Broadcast that a room was closed
 */
export function broadcastRoomClosed(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  reason: string
): void {
  io.to(roomId).emit('room:closed', { roomId, reason });
}

/**
 * Notify a specific user they were kicked
 */
export async function notifyPlayerKicked(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  userId: string,
  reason: string
): Promise<void> {
  // Emit kick event via user room
  io.to(`user:${userId}`).emit('room:kicked', { roomId, reason });

  // Remove the user's sockets from the game room
  const sockets = await io.in(`user:${userId}`).fetchSockets();
  for (const socket of sockets) {
    socket.leave(roomId);
    (socket as unknown as AuthenticatedSocket).roomIds?.delete(roomId);
  }

  // Notify others
  io.to(roomId).emit('room:playerLeft', { roomId, playerId: userId });
}
