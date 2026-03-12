/**
 * Notification Core Service
 * CRUD operations for notification management
 */

import { Prisma, NotificationType } from '@prisma/client';
import { prisma } from '@config/database';
import { NotFoundError, ForbiddenError } from '@shared/utils/errors';
import { PaginationParams } from '@shared/types/pagination';
import { paginate } from '@shared/utils/pagination';

type NotificationWithSender = Prisma.NotificationGetPayload<{
  include: { sender: { select: { id: true; username: true; displayName: true; avatar: true } } };
}>;

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  senderId?: string;
  actionData?: Record<string, any>;
}

export class NotificationCoreService {
  /**
   * Create a notification
   */
  async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, message, senderId, actionData } = params;

    // Silently skip if either user has blocked the other
    if (senderId) {
      const blockExists = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: senderId, status: 'BLOCKED' },
            { userId: senderId, friendId: userId, status: 'BLOCKED' },
          ],
        },
      });
      if (blockExists) return null;
    }

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
    const notifWithSender = notification as NotificationWithSender;
    return {
      id: notifWithSender.id,
      userId: notifWithSender.userId,
      type: notifWithSender.type,
      title: notifWithSender.title,
      message: notifWithSender.message,
      senderId: notifWithSender.senderId,
      actionData: notifWithSender.actionData,
      isRead: notifWithSender.isRead,
      actionTaken: notifWithSender.actionTaken,
      createdAt: notifWithSender.createdAt,
      sender: notifWithSender.sender ? {
        id: notifWithSender.sender.id,
        username: notifWithSender.sender.username,
        displayName: notifWithSender.sender.displayName,
        avatar: notifWithSender.sender.avatar,
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
    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const include = {
      sender: {
        select: { id: true, username: true, displayName: true, avatar: true },
      },
    };

    const [result, unreadCount] = await Promise.all([
      paginate({
        page: pagination.page,
        limit: pagination.limit,
        findMany: ({ skip, take }) =>
          prisma.notification.findMany({ where, skip, take, include, orderBy: { createdAt: 'desc' } }),
        count: () => prisma.notification.count({ where }),
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications: result.data, ...result.meta, unreadCount };
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

export default new NotificationCoreService();
