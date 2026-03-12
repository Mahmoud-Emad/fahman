/**
 * Notification Service - Re-export barrel for backwards compatibility
 * Core CRUD operations are in notificationCoreService.ts
 * Action/typed notification operations are in notificationActionService.ts
 */

import notificationCoreService from './notificationCoreService';
import notificationActionService from './notificationActionService';
export { NotificationCoreService } from './notificationCoreService';
export type { CreateNotificationParams } from './notificationCoreService';
export { NotificationActionService } from './notificationActionService';

// Compose a unified facade that preserves the original API surface
const notificationService = {
  // Core CRUD methods
  createNotification: notificationCoreService.createNotification.bind(notificationCoreService),
  getNotifications: notificationCoreService.getNotifications.bind(notificationCoreService),
  getUnreadCount: notificationCoreService.getUnreadCount.bind(notificationCoreService),
  markAsRead: notificationCoreService.markAsRead.bind(notificationCoreService),
  markAllAsRead: notificationCoreService.markAllAsRead.bind(notificationCoreService),
  deleteNotification: notificationCoreService.deleteNotification.bind(notificationCoreService),
  deleteReadNotifications: notificationCoreService.deleteReadNotifications.bind(notificationCoreService),
  bulkCreateNotifications: notificationCoreService.bulkCreateNotifications.bind(notificationCoreService),
  // Action methods
  resolveAction: notificationActionService.resolveAction.bind(notificationActionService),
  resolveByContext: notificationActionService.resolveByContext.bind(notificationActionService),
  createRoomInviteNotification: notificationActionService.createRoomInviteNotification.bind(notificationActionService),
  createFriendRequestNotification: notificationActionService.createFriendRequestNotification.bind(notificationActionService),
  createFriendAcceptedNotification: notificationActionService.createFriendAcceptedNotification.bind(notificationActionService),
  createSystemNotification: notificationActionService.createSystemNotification.bind(notificationActionService),
};

export default notificationService;
