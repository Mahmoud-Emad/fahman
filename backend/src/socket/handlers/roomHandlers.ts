/**
 * Room Socket Event Handlers
 */

import { Server } from 'socket.io';
import { prisma } from '../../config/database';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  RoomMemberInfo,
} from '../types';
import logger from '../../utils/logger';

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

      // Update presence in database - mark as present
      await prisma.roomMember.update({
        where: { id: member.id },
        data: {
          lastSeenAt: new Date(),
        },
      });

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
    } catch (error: any) {
      logger.error(`Error joining room socket: ${error.message}`);
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

      // Update presence in database
      await prisma.roomMember.updateMany({
        where: {
          roomId,
          userId: socket.userId,
          isActive: true,
        },
        data: {
          lastSeenAt: new Date(),
        },
      });

      socket.emit('room:left', { roomId });

      // Notify others
      socket.to(roomId).emit('room:playerLeft', {
        roomId,
        playerId: socket.userId,
      });

      logger.info(`${socket.username} left room socket: ${roomId}`);
    } catch (error: any) {
      logger.error(`Error leaving room socket: ${error.message}`);
    }
  });

  /**
   * Set ready status
   */
  socket.on('room:ready', async ({ roomId, isReady }) => {
    try {
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
    } catch (error: any) {
      logger.error(`Error setting ready status: ${error.message}`);
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
export function notifyPlayerKicked(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  userId: string,
  reason: string
): void {
  // Get sockets for this user
  const sockets = io.sockets.sockets;
  sockets.forEach((socket) => {
    const authSocket = socket as AuthenticatedSocket;
    if (authSocket.userId === userId) {
      authSocket.emit('room:kicked', { roomId, reason });
      authSocket.leave(roomId);
      authSocket.roomIds?.delete(roomId);
    }
  });

  // Notify others
  io.to(roomId).emit('room:playerLeft', { roomId, playerId: userId });
}
