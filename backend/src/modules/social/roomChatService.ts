/**
 * Room Chat Service
 * Business logic for room-based chat messages
 */

import { prisma } from '@config/database';
import { MessageType, Prisma } from '@prisma/client';
import { AppError } from '@shared/utils/errors';

interface PaginationOptions {
  limit?: number;
  before?: string; // Message ID for cursor-based pagination
}

class RoomChatService {
  /**
   * Get room chat messages
   */
  async getRoomMessages(
    userId: string,
    roomId: string,
    options: PaginationOptions = {}
  ) {
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
    const where: Prisma.MessageWhereInput = {
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
}

export default new RoomChatService();
