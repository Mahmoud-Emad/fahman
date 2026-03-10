/**
 * Chat Socket Event Handlers
 * Uses Redis for typing status tracking
 */

import { Server } from 'socket.io';
import { prisma } from '../../config/database';
import { getRedis } from '../../config/redis';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  ChatMessage,
} from '../types';
import logger from '../../shared/utils/logger';

const TYPING_TTL = 3; // 3 seconds

export function registerChatHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
): void {
  /**
   * Send a chat message to a room
   */
  socket.on('chat:message', async ({ roomId, text }) => {
    try {
      // Validate user is in the room
      const member = await prisma.roomMember.findFirst({
        where: {
          roomId,
          userId: socket.userId,
          isActive: true,
        },
        include: {
          user: {
            select: { username: true, displayName: true, avatar: true },
          },
        },
      });

      if (!member) {
        socket.emit('error', { message: 'You are not in this room' });
        return;
      }

      // Validate message
      if (!text || text.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (text.length > 500) {
        socket.emit('error', { message: 'Message too long (max 500 characters)' });
        return;
      }

      // Save message to database
      const savedMessage = await prisma.message.create({
        data: {
          senderId: socket.userId,
          roomId,
          text: text.trim(),
          messageType: 'ROOM',
        },
      });

      // Build chat message
      const chatMessage: ChatMessage = {
        id: savedMessage.id,
        roomId,
        senderId: socket.userId,
        senderName: member.user.displayName || member.user.username,
        senderAvatar: member.user.avatar,
        text: text.trim(),
        timestamp: savedMessage.createdAt,
        type: 'ROOM',
      };

      // Broadcast to room
      io.to(roomId).emit('chat:message', chatMessage);

      // Clear typing status
      await clearTypingStatus(socket.userId, roomId);

      logger.debug(`Chat message in room ${roomId} from ${socket.username}`);
    } catch (error) {
      logger.error(`Error sending chat message: ${error instanceof Error ? error.message : error}`);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * User is typing
   */
  socket.on('chat:typing', async ({ roomId }) => {
    await setTypingStatus(socket.userId, roomId);

    // Notify others in the room
    socket.to(roomId).emit('chat:typing', {
      roomId,
      userId: socket.userId,
      username: socket.username,
    });

    // Redis TTL handles auto-cleanup — no setTimeout needed
  });

  /**
   * User stopped typing
   */
  socket.on('chat:stopTyping', async ({ roomId }) => {
    await clearTypingStatus(socket.userId, roomId);
    socket.to(roomId).emit('chat:stopTyping', {
      roomId,
      userId: socket.userId,
    });
  });
}

/**
 * Set typing status in Redis with TTL
 */
async function setTypingStatus(userId: string, roomId: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`typing:room:${roomId}:${userId}`, '1', 'EX', TYPING_TTL);
}

/**
 * Clear typing status
 */
async function clearTypingStatus(userId: string, roomId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`typing:room:${roomId}:${userId}`);
}

/**
 * Broadcast a system message to a room
 */
export async function broadcastSystemMessage(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  text: string
): Promise<void> {
  // Save system message to database
  const savedMessage = await prisma.message.create({
    data: {
      senderId: 'system',
      roomId,
      text,
      messageType: 'SYSTEM',
    },
  });

  const chatMessage: ChatMessage = {
    id: savedMessage.id,
    roomId,
    senderId: 'system',
    senderName: 'System',
    senderAvatar: null,
    text,
    timestamp: savedMessage.createdAt,
    type: 'SYSTEM',
  };

  io.to(roomId).emit('chat:message', chatMessage);
}

/**
 * Clean up typing status when user disconnects
 * Scans and removes all typing keys for the user
 */
export async function cleanupUserTyping(userId: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(`typing:room:*:${userId}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Best effort cleanup
  }
}
