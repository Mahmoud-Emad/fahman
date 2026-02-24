/**
 * Message Service
 * Handles direct messaging and room chat functionality
 */

import { prisma } from '../config/database';
import { MessageType, FriendshipStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

interface SendMessageInput {
  text: string;
  recipientId?: string;
  roomId?: string;
  messageType?: MessageType;
}

interface ConversationPreview {
  otherId: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: {
    id: string;
    text: string;
    senderId: string;
    createdAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
}

interface PaginationOptions {
  limit?: number;
  before?: string; // Message ID for cursor-based pagination
}

class MessageService {
  /**
   * Get all conversations for a user (grouped DMs)
   */
  async getConversations(userId: string): Promise<ConversationPreview[]> {
    // Get all DM messages involving this user
    const messages = await prisma.message.findMany({
      where: {
        messageType: MessageType.PRIVATE,
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        recipient: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversationMap = new Map<string, ConversationPreview>();

    for (const msg of messages) {
      // Determine the other user in the conversation
      const otherId = msg.senderId === userId ? msg.recipientId! : msg.senderId;
      const other = msg.senderId === userId ? msg.recipient! : msg.sender;

      if (!conversationMap.has(otherId)) {
        // Count unread messages from this person
        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherId,
            recipientId: userId,
            messageType: MessageType.PRIVATE,
            isRead: false,
          },
        });

        conversationMap.set(otherId, {
          otherId: other.id,
          otherName: other.displayName || other.username,
          otherAvatar: other.avatar,
          lastMessage: {
            id: msg.id,
            text: msg.text,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
          },
          unreadCount,
        });
      }
    }

    return Array.from(conversationMap.values());
  }

  /**
   * Get messages in a conversation with another user
   */
  async getConversationMessages(
    userId: string,
    otherUserId: string,
    options: PaginationOptions = {}
  ): Promise<{
    messages: any[];
    hasMore: boolean;
  }> {
    const { limit = 50, before } = options;

    // Build where clause
    const where: any = {
      messageType: MessageType.PRIVATE,
      OR: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    };

    // Cursor-based pagination
    if (before) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop(); // Remove the extra message
    }

    return {
      messages: messages.reverse(), // Return in chronological order
      hasMore,
    };
  }

  /**
   * Send a direct message to another user
   */
  async sendDirectMessage(
    senderId: string,
    recipientId: string,
    text: string
  ): Promise<any> {
    // Validate recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, username: true, isActive: true },
    });

    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    if (!recipient.isActive) {
      throw new AppError('Cannot message this user', 400);
    }

    // Check if blocked
    const blocked = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: recipientId, status: FriendshipStatus.BLOCKED },
          { userId: recipientId, friendId: senderId, status: FriendshipStatus.BLOCKED },
        ],
      },
    });

    if (blocked) {
      throw new AppError('Cannot message this user', 403);
    }

    // Check if they are friends (optional - you may want to allow messaging non-friends)
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: recipientId, status: FriendshipStatus.ACCEPTED },
          { userId: recipientId, friendId: senderId, status: FriendshipStatus.ACCEPTED },
        ],
      },
    });

    if (!friendship) {
      throw new AppError('You can only message friends', 403);
    }

    // Validate message
    if (!text || text.trim().length === 0) {
      throw new AppError('Message cannot be empty', 400);
    }

    if (text.length > 2000) {
      throw new AppError('Message too long (max 2000 characters)', 400);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        text: text.trim(),
        messageType: MessageType.PRIVATE,
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        recipient: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return message;
  }

  /**
   * Send a room invite message
   */
  async sendRoomInvite(
    senderId: string,
    recipientIds: string[],
    roomCode: string,
    roomTitle: string
  ): Promise<any[]> {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, displayName: true },
    });

    if (!sender) {
      throw new AppError('Sender not found', 404);
    }

    const messages: any[] = [];

    for (const recipientId of recipientIds) {
      // Check if blocked
      const blocked = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId: senderId, friendId: recipientId, status: FriendshipStatus.BLOCKED },
            { userId: recipientId, friendId: senderId, status: FriendshipStatus.BLOCKED },
          ],
        },
      });

      if (blocked) continue;

      const message = await prisma.message.create({
        data: {
          senderId,
          recipientId,
          text: `${sender.displayName || sender.username} invited you to join room "${roomTitle}" (Code: ${roomCode})`,
          messageType: MessageType.ROOM_INVITE,
        },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      });

      messages.push(message);
    }

    return messages;
  }

  /**
   * Get room chat messages
   */
  async getRoomMessages(
    userId: string,
    roomId: string,
    options: PaginationOptions = {}
  ): Promise<{
    messages: any[];
    hasMore: boolean;
  }> {
    const { limit = 50, before } = options;

    // Verify user is a member of the room
    const member = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId,
        isActive: true,
      },
    });

    if (!member) {
      throw new AppError('You are not a member of this room', 403);
    }

    // Build where clause
    const where: any = {
      roomId,
      messageType: { in: [MessageType.ROOM, MessageType.SYSTEM] },
    };

    // Cursor-based pagination
    if (before) {
      const cursorMessage = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true },
      });
      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    return {
      messages: messages.reverse(),
      hasMore,
    };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(userId: string, messageIds: string[]): Promise<number> {
    const result = await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Mark all messages from a user as read
   */
  async markConversationAsRead(userId: string, otherUserId: string): Promise<number> {
    const result = await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: userId,
        messageType: MessageType.PRIVATE,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count;
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.message.count({
      where: {
        recipientId: userId,
        messageType: MessageType.PRIVATE,
        isRead: false,
      },
    });
  }

  /**
   * Delete a message (only sender can delete)
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    if (message.senderId !== userId) {
      throw new AppError('You can only delete your own messages', 403);
    }

    await prisma.message.delete({
      where: { id: messageId },
    });
  }
}

export default new MessageService();
