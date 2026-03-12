/**
 * Notification Action Service
 * Handles notification actions (resolve, create typed notifications)
 */

import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import { NotFoundError, ForbiddenError } from '@shared/utils/errors';
import logger from '@shared/utils/logger';
import notificationCoreService from './notificationCoreService';

type NotificationWithSender = Prisma.NotificationGetPayload<{
  include: { sender: { select: { id: true; username: true; displayName: true; avatar: true } } };
}>;

export class NotificationActionService {
  /**
   * Resolve an action on a notification (e.g., accept/decline friend request, join room)
   */
  async resolveAction(userId: string, notificationId: string, action: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError('Cannot access this notification');
    }

    if (notification.actionTaken) {
      return notification;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { actionTaken: action },
      include: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    const updatedWithSender = updated as NotificationWithSender;
    return {
      id: updatedWithSender.id,
      userId: updatedWithSender.userId,
      type: updatedWithSender.type,
      title: updatedWithSender.title,
      message: updatedWithSender.message,
      senderId: updatedWithSender.senderId,
      actionData: updatedWithSender.actionData,
      isRead: updatedWithSender.isRead,
      actionTaken: updatedWithSender.actionTaken,
      createdAt: updatedWithSender.createdAt,
      sender: updatedWithSender.sender ? {
        id: updatedWithSender.sender.id,
        username: updatedWithSender.sender.username,
        displayName: updatedWithSender.sender.displayName,
        avatar: updatedWithSender.sender.avatar,
      } : null,
    };
  }

  /**
   * Resolve a notification by sender and type (used internally when the action happens externally)
   */
  async resolveByContext(userId: string, senderId: string, type: NotificationType, action: string) {
    const notification = await prisma.notification.findFirst({
      where: {
        userId,
        senderId,
        type,
        actionTaken: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!notification) {
      logger.info(`No pending ${type} notification found for user ${userId} from ${senderId}`);
      return null;
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { actionTaken: action },
    });

    return { id: updated.id, actionTaken: updated.actionTaken };
  }

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

    return notificationCoreService.createNotification({
      userId: recipientId,
      type: 'ROOM_INVITE',
      title: 'Room Invitation',
      message: `${senderName} invited you to join "${roomTitle}"`,
      senderId,
      actionData: {
        type: 'room_invite',
        roomCode,
        roomTitle,
        packTitle,
        senderName,
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
      const existingWithSender = existing as NotificationWithSender;
      const serialized = {
        id: existingWithSender.id,
        userId: existingWithSender.userId,
        type: existingWithSender.type,
        title: existingWithSender.title,
        message: existingWithSender.message,
        senderId: existingWithSender.senderId,
        actionData: existingWithSender.actionData,
        isRead: existingWithSender.isRead,
        actionTaken: existingWithSender.actionTaken,
        createdAt: existingWithSender.createdAt,
        sender: existingWithSender.sender ? {
          id: existingWithSender.sender.id,
          username: existingWithSender.sender.username,
          displayName: existingWithSender.sender.displayName,
          avatar: existingWithSender.sender.avatar,
        } : null,
      };
      return serialized;
    }

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, displayName: true, username: true, avatar: true },
    });

    const senderName = sender?.displayName || sender?.username || 'Someone';

    const notification = await notificationCoreService.createNotification({
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

    return notificationCoreService.createNotification({
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
    return notificationCoreService.createNotification({
      userId,
      type: 'SYSTEM',
      title,
      message,
      actionData,
    });
  }
}

export default new NotificationActionService();
