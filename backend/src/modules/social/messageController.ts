/**
 * Message Controller
 * Handles HTTP requests for messaging functionality
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '@shared/types/index';
import { getAuthUser } from '@shared/middleware/getAuthUser';
import messageService from './messageService';
import { successResponse } from '@shared/utils/responseFormatter';
import { getSocketRegistry } from '@/socket';

/**
 * Get all conversations (DMs)
 */
export async function getConversations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const conversations = await messageService.getConversations(getAuthUser(req).id);
    res.json(successResponse(conversations, 'Conversations retrieved'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages in a conversation with another user
 */
export async function getConversationMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;
    const { limit, before } = req.query;

    const result = await messageService.getConversationMessages(
      getAuthUser(req).id,
      userId,
      {
        limit: limit ? parseInt(limit as string) : undefined,
        before: before as string,
      }
    );

    res.json(successResponse(result, 'Messages retrieved'));
  } catch (error) {
    next(error);
  }
}

/**
 * Send a direct message
 */
export async function sendMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { recipientId, text } = req.body;

    const message = await messageService.sendDirectMessage(
      getAuthUser(req).id,
      recipientId,
      text
    );

    // Emit WebSocket event for real-time delivery
    getSocketRegistry()?.emitDmMessage(recipientId, {
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender.displayName || message.sender.username,
      senderAvatar: message.sender.avatar,
      recipientId,
      text: message.text,
      timestamp: message.createdAt,
      type: 'PRIVATE',
    });

    res.status(201).json(successResponse(message, 'Message sent'));
  } catch (error) {
    next(error);
  }
}

/**
 * Send room invite to multiple users
 */
export async function sendRoomInvite(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { recipientIds, roomCode, roomTitle } = req.body;

    const messages = await messageService.sendRoomInvite(
      getAuthUser(req).id,
      recipientIds,
      roomCode,
      roomTitle
    );

    // Emit WebSocket events for real-time delivery
    for (const message of messages) {
      if (!message.recipientId) continue;
      getSocketRegistry()?.emitDmMessage(message.recipientId, {
        id: message.id,
        senderId: message.senderId,
        senderName: message.sender.displayName || message.sender.username,
        senderAvatar: message.sender.avatar,
        recipientId: message.recipientId,
        text: message.text,
        timestamp: message.createdAt,
        type: 'ROOM_INVITE',
        roomCode,
        roomTitle,
      });
    }

    res.status(201).json(successResponse({ sent: messages.length }, 'Room invites sent'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get room chat messages
 */
export async function getRoomMessages(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { roomId } = req.params;
    const { limit, before } = req.query;

    const result = await messageService.getRoomMessages(getAuthUser(req).id, roomId, {
      limit: limit ? parseInt(limit as string) : undefined,
      before: before as string,
    });

    res.json(successResponse(result, 'Room messages retrieved'));
  } catch (error) {
    next(error);
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { messageIds } = req.body;

    const count = await messageService.markAsRead(getAuthUser(req).id, messageIds);

    res.json(successResponse({ markedRead: count }, 'Messages marked as read'));
  } catch (error) {
    next(error);
  }
}

/**
 * Mark entire conversation as read
 */
export async function markConversationAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { userId } = req.params;

    const count = await messageService.markConversationAsRead(getAuthUser(req).id, userId);

    res.json(successResponse({ markedRead: count }, 'Conversation marked as read'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread message count
 */
export async function getUnreadCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const count = await messageService.getUnreadCount(getAuthUser(req).id);
    res.json(successResponse({ unreadCount: count }));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    await messageService.deleteMessage(getAuthUser(req).id, id);

    res.json(successResponse(null, 'Message deleted'));
  } catch (error) {
    next(error);
  }
}
