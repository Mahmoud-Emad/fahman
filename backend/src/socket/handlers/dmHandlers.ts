/**
 * Direct Message Socket Event Handlers
 */

import { Server } from 'socket.io';
import { prisma } from '../../config/database';
import { MessageType, FriendshipStatus } from '@prisma/client';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  DirectMessage,
} from '../types';
import logger from '../../utils/logger';

// Track typing status for DMs (userId -> recipientId -> timestamp)
const dmTypingUsers: Map<string, Map<string, number>> = new Map();
const TYPING_TIMEOUT = 3000;

export function registerDmHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
): void {
  /**
   * Send a direct message
   */
  socket.on('dm:send', async ({ recipientId, text }) => {
    try {
      // Validate recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, username: true, isActive: true },
      });

      if (!recipient || !recipient.isActive) {
        socket.emit('error', { message: 'Recipient not found' });
        return;
      }

      // Check if blocked
      const blocked = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: socket.userId, friendId: recipientId, status: FriendshipStatus.BLOCKED },
            { userId: recipientId, friendId: socket.userId, status: FriendshipStatus.BLOCKED },
          ],
        },
      });

      if (blocked) {
        socket.emit('error', { message: 'Cannot message this user' });
        return;
      }

      // Check if friends
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: socket.userId, friendId: recipientId, status: FriendshipStatus.ACCEPTED },
            { userId: recipientId, friendId: socket.userId, status: FriendshipStatus.ACCEPTED },
          ],
        },
      });

      if (!friendship) {
        socket.emit('error', { message: 'You can only message friends' });
        return;
      }

      // Validate message
      if (!text || text.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (text.length > 2000) {
        socket.emit('error', { message: 'Message too long (max 2000 characters)' });
        return;
      }

      // Get sender info
      const sender = await prisma.user.findUnique({
        where: { id: socket.userId },
        select: { username: true, displayName: true, avatar: true },
      });

      // Create message
      const message = await prisma.message.create({
        data: {
          senderId: socket.userId,
          recipientId,
          text: text.trim(),
          messageType: MessageType.PRIVATE,
        },
      });

      // Build DM payload
      const dmMessage: DirectMessage = {
        id: message.id,
        senderId: socket.userId,
        senderName: sender?.displayName || sender?.username || socket.username,
        senderAvatar: sender?.avatar || null,
        recipientId,
        text: text.trim(),
        timestamp: message.createdAt,
        type: 'PRIVATE',
      };

      // Send to recipient (find their socket)
      io.sockets.sockets.forEach((s) => {
        const authSocket = s as AuthenticatedSocket;
        if (authSocket.userId === recipientId) {
          authSocket.emit('dm:message', dmMessage);
        }
      });

      // Also send back to sender for confirmation
      socket.emit('dm:message', dmMessage);

      // Clear typing status
      clearDmTypingStatus(socket.userId, recipientId);

      logger.debug(`DM sent from ${socket.username} to ${recipient.username}`);
    } catch (error: any) {
      logger.error(`Error sending DM: ${error.message}`);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * User is typing a DM
   */
  socket.on('dm:typing', async ({ recipientId }) => {
    try {
      // Set typing status
      setDmTypingStatus(socket.userId, recipientId);

      // Get sender name
      const sender = await prisma.user.findUnique({
        where: { id: socket.userId },
        select: { username: true, displayName: true },
      });

      // Notify recipient
      io.sockets.sockets.forEach((s) => {
        const authSocket = s as AuthenticatedSocket;
        if (authSocket.userId === recipientId) {
          authSocket.emit('dm:typing', {
            senderId: socket.userId,
            senderName: sender?.displayName || sender?.username || socket.username,
          });
        }
      });

      // Auto-clear after timeout
      setTimeout(() => {
        const userTyping = dmTypingUsers.get(socket.userId);
        if (userTyping) {
          const timestamp = userTyping.get(recipientId);
          if (timestamp && Date.now() - timestamp >= TYPING_TIMEOUT) {
            clearDmTypingStatus(socket.userId, recipientId);
            // Notify recipient that typing stopped
            io.sockets.sockets.forEach((s) => {
              const authSocket = s as AuthenticatedSocket;
              if (authSocket.userId === recipientId) {
                authSocket.emit('dm:stopTyping', { senderId: socket.userId });
              }
            });
          }
        }
      }, TYPING_TIMEOUT);
    } catch (error: any) {
      logger.error(`Error handling DM typing: ${error.message}`);
    }
  });

  /**
   * User stopped typing a DM
   */
  socket.on('dm:stopTyping', ({ recipientId }) => {
    clearDmTypingStatus(socket.userId, recipientId);

    // Notify recipient
    io.sockets.sockets.forEach((s) => {
      const authSocket = s as AuthenticatedSocket;
      if (authSocket.userId === recipientId) {
        authSocket.emit('dm:stopTyping', { senderId: socket.userId });
      }
    });
  });

  /**
   * Mark messages from a sender as read
   */
  socket.on('dm:read', async ({ senderId }) => {
    try {
      // Mark all messages from sender as read
      await prisma.message.updateMany({
        where: {
          senderId,
          recipientId: socket.userId,
          messageType: MessageType.PRIVATE,
          isRead: false,
        },
        data: { isRead: true },
      });

      // Notify sender that their messages were read
      io.sockets.sockets.forEach((s) => {
        const authSocket = s as AuthenticatedSocket;
        if (authSocket.userId === senderId) {
          authSocket.emit('dm:read', { byUserId: socket.userId });
        }
      });

      logger.debug(`${socket.username} marked messages from ${senderId} as read`);
    } catch (error: any) {
      logger.error(`Error marking DMs as read: ${error.message}`);
    }
  });
}

/**
 * Set DM typing status
 */
function setDmTypingStatus(userId: string, recipientId: string): void {
  if (!dmTypingUsers.has(userId)) {
    dmTypingUsers.set(userId, new Map());
  }
  dmTypingUsers.get(userId)!.set(recipientId, Date.now());
}

/**
 * Clear DM typing status
 */
function clearDmTypingStatus(userId: string, recipientId: string): void {
  const userTyping = dmTypingUsers.get(userId);
  if (userTyping) {
    userTyping.delete(recipientId);
    if (userTyping.size === 0) {
      dmTypingUsers.delete(userId);
    }
  }
}

/**
 * Clean up DM typing status when user disconnects
 */
export function cleanupUserDmTyping(userId: string): void {
  dmTypingUsers.delete(userId);
}

/**
 * Send a DM notification via WebSocket (for use from HTTP endpoints)
 */
export function emitDirectMessage(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  recipientId: string,
  message: DirectMessage
): void {
  io.sockets.sockets.forEach((s) => {
    const authSocket = s as AuthenticatedSocket;
    if (authSocket.userId === recipientId) {
      authSocket.emit('dm:message', message);
    }
  });
}
