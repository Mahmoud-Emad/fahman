/**
 * Notification Controller
 * HTTP request handlers for notification operations
 */

import { Response, NextFunction } from 'express';
import notificationService from './notificationService';
import { successResponse } from '../../shared/utils/responseFormatter';
import { sendNotificationToUser } from '../../socket';
import { AuthRequest } from '../../shared/types/index';

/**
 * Get user's notifications
 */
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, unreadOnly } = req.query;

    const result = await notificationService.getNotifications(
      req.user.id,
      {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      },
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      data: result.notifications,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        hasNext: result.page < Math.ceil(result.total / result.limit),
        hasPrev: result.page > 1,
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json(successResponse({ unreadCount: count }));
  } catch (error) {
    next(error);
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(successResponse(notification, 'Notification marked as read'));
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(successResponse(result, 'All notifications marked as read'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.deleteNotification(req.user.id, req.params.id);
    res.json(successResponse(result, 'Notification deleted'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete all read notifications
 */
export async function deleteReadNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationService.deleteReadNotifications(req.user.id);
    res.json(successResponse(result, 'Read notifications deleted'));
  } catch (error) {
    next(error);
  }
}

/**
 * Resolve an action on a notification (accept, decline, joined, etc.)
 */
export async function resolveAction(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { action } = req.body;
    const notification = await notificationService.resolveAction(req.user.id, req.params.id, action);
    sendNotificationToUser(req.user.id, notification);
    res.json(successResponse(notification, 'Notification action resolved'));
  } catch (error) {
    next(error);
  }
}

/**
 * Send room invite notifications to multiple users
 */
export async function sendRoomInvites(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { recipientIds, roomCode, roomTitle, packTitle } = req.body;

    const notifications = await Promise.all(
      recipientIds.map(async (recipientId: string) => {
        const notification = await notificationService.createRoomInviteNotification(
          recipientId,
          req.user.id,
          roomCode,
          roomTitle,
          packTitle
        );
        sendNotificationToUser(recipientId, notification);
        return notification;
      })
    );

    res.status(201).json(successResponse({ sent: notifications.length }, 'Invitations sent'));
  } catch (error) {
    next(error);
  }
}
