/**
 * Notification Service
 * Business logic for notification management
 */

import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { NotificationType } from '@prisma/client';
import { PaginationParams } from '../types';
import logger from '../utils/logger';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  senderId?: string;
  actionData?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, senderId, actionData } = params;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        senderId,
        actionData: actionData || {},
      },
      include: {
        sender: senderId ? {
          select: { id: true, username: true, displayName: true, avatar: true },
        } : false,
      },
    });

    // Explicitly serialize to plain object for reliable socket transmission
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      senderId: notification.senderId,
      actionData: notification.actionData,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      sender: (notification as any).sender ? {
        id: (notification as any).sender.id,
        username: (notification as any).sender.username,
        displayName: (notification as any).sender.displayName,
        avatar: (notification as any).sender.avatar,
      } : null,
    };
  }

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    pagination: PaginationParams = {},
    unreadOnly: boolean = false
  ) {
    const { page = 1, limit = 20 } = pagination;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('Cannot access this notification');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { updated: result.count };
  }

  /**
   * Delete notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('Cannot delete this notification');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(userId: string) {
    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });

    return { deleted: result.count };
  }

  // ==========================================
  // Helper methods for creating specific types
  // ==========================================

  /**
   * Create room invite notification
   */
  async createRoomInviteNotification(
    recipientId: string,
    senderId: string,
    roomCode: string,
    roomTitle: string,
    packTitle?: string
  ) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true, username: true },
    });

    const senderName = sender?.displayName || sender?.username || 'Someone';

    return this.createNotification({
      userId: recipientId,
      type: 'ROOM_INVITE',
      title: 'Room Invitation',
      message: `${senderName} invited you to join "${roomTitle}"`,
      senderId,
      actionData: {
        roomCode,
        roomTitle,
        packTitle,
      },
    });
  }

  /**
   * Create friend request notification
   */
  async createFriendRequestNotification(recipientId: string, senderId: string, friendshipId: string) {
    // Prevent duplicate notifications for the same friend request
    const existing = await prisma.notification.findFirst({
      where: {
        userId: recipientId,
        senderId,
        type: 'FRIEND_REQUEST',
        isRead: false,
      },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    if (existing) {
      // Explicitly serialize for reliable socket transmission
      const serialized = {
        id: existing.id,
        userId: existing.userId,
        type: existing.type,
        title: existing.title,
        message: existing.message,
        senderId: existing.senderId,
        actionData: existing.actionData,
        isRead: existing.isRead,
        createdAt: existing.createdAt,
        sender: (existing as any).sender ? {
          id: (existing as any).sender.id,
          username: (existing as any).sender.username,
          displayName: (existing as any).sender.displayName,
          avatar: (existing as any).sender.avatar,
        } : null,
      };
      return serialized;
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, displayName: true, username: true, avatar: true },
    });

    const senderName = sender?.displayName || sender?.username || 'Someone';

    const notification = await this.createNotification({
      userId: recipientId,
      type: 'FRIEND_REQUEST',
      title: 'Friend Request',
      message: `${senderName} sent you a friend request`,
      senderId,
      actionData: {
        type: 'friend_request',
        senderId,
        senderName,
        senderAvatar: sender?.avatar,
        friendshipId,
      },
    });

    return notification;
  }

  /**
   * Create friend accepted notification
   */
  async createFriendAcceptedNotification(recipientId: string, senderId: string) {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true, username: true },
    });

    const senderName = sender?.displayName || sender?.username || 'Someone';

    return this.createNotification({
      userId: recipientId,
      type: 'FRIEND_ACCEPTED',
      title: 'Friend Request Accepted',
      message: `${senderName} accepted your friend request`,
      senderId,
      actionData: {
        friendId: senderId,
        friendName: senderName,
      },
    });
  }

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    actionData?: Record<string, any>
  ) {
    return this.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      actionData,
    });
  }

  /**
   * Bulk send notifications (e.g., room invites to multiple users)
   */
  async bulkCreateNotifications(notifications: CreateNotificationParams[]) {
    const results = await prisma.$transaction(
      notifications.map((n) =>
        prisma.notification.create({
          data: {
            userId: n.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            senderId: n.senderId,
            actionData: n.actionData || {},
          },
        })
      )
    );

    return results;
  }
}

export default new NotificationService();
