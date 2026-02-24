/**
 * Chat Socket Event Handlers
 */

import { Server } from 'socket.io';
import { prisma } from '../../config/database';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  ChatMessage,
} from '../types';
import logger from '../../utils/logger';

// Track typing status (userId -> roomId -> timestamp)
const typingUsers: Map<string, Map<string, number>> = new Map();
const TYPING_TIMEOUT = 3000; // 3 seconds

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
      clearTypingStatus(socket.userId, roomId);

      logger.debug(`Chat message in room ${roomId} from ${socket.username}`);
    } catch (error: any) {
      logger.error(`Error sending chat message: ${error.message}`);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * User is typing
   */
  socket.on('chat:typing', ({ roomId }) => {
    // Set typing status
    setTypingStatus(socket.userId, roomId);

    // Notify others in the room
    socket.to(roomId).emit('chat:typing', {
      roomId,
      userId: socket.userId,
      username: socket.username,
    });

    // Auto-clear after timeout
    setTimeout(() => {
      const userTyping = typingUsers.get(socket.userId);
      if (userTyping) {
        const timestamp = userTyping.get(roomId);
        if (timestamp && Date.now() - timestamp >= TYPING_TIMEOUT) {
          clearTypingStatus(socket.userId, roomId);
          socket.to(roomId).emit('chat:stopTyping', {
            roomId,
            userId: socket.userId,
          });
        }
      }
    }, TYPING_TIMEOUT);
  });

  /**
   * User stopped typing
   */
  socket.on('chat:stopTyping', ({ roomId }) => {
    clearTypingStatus(socket.userId, roomId);
    socket.to(roomId).emit('chat:stopTyping', {
      roomId,
      userId: socket.userId,
    });
  });
}

/**
 * Set typing status
 */
function setTypingStatus(userId: string, roomId: string): void {
  if (!typingUsers.has(userId)) {
    typingUsers.set(userId, new Map());
  }
  typingUsers.get(userId)!.set(roomId, Date.now());
}

/**
 * Clear typing status
 */
function clearTypingStatus(userId: string, roomId: string): void {
  const userTyping = typingUsers.get(userId);
  if (userTyping) {
    userTyping.delete(roomId);
    if (userTyping.size === 0) {
      typingUsers.delete(userId);
    }
  }
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
      senderId: 'system', // Need a system user or handle differently
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
 */
export function cleanupUserTyping(userId: string): void {
  typingUsers.delete(userId);
}
