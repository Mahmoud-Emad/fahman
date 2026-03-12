/**
 * Socket Notification Service — notification and presence events
 */

import type { Socket } from 'socket.io-client';
import type {
  SocketAccessor,
  SocketListeners,
  FriendOnlineHandler,
  FriendOfflineHandler,
  FriendStatusListHandler,
  NotificationHandler,
  NotificationUpdateHandler,
} from './socketTypes';

/**
 * Register socket.on handlers for notification and presence events
 */
export function setupNotificationHandlers(socket: Socket, listeners: SocketListeners): void {
  // Friend presence
  socket.on('friend:online', (data) => {
    listeners.friendOnline.forEach((handler) => handler(data));
  });

  socket.on('friend:offline', (data) => {
    listeners.friendOffline.forEach((handler) => handler(data));
  });

  socket.on('friend:statusList', (data) => {
    listeners.friendStatusList.forEach((handler) => handler(data));
  });

  // Notifications
  socket.on('notification:new', (data) => {
    listeners.notification.forEach((handler) => handler(data));
  });

  socket.on('notification:updated', (data) => {
    listeners.notificationUpdate.forEach((handler) => handler(data));
  });
}

// ============================================
// Client → Server emitters
// ============================================

export function requestFriendStatuses(accessor: SocketAccessor): void {
  accessor.getSocket()?.emit('friend:status');
}

// ============================================
// Subscription helpers
// ============================================

export function onFriendOnline(accessor: SocketAccessor, handler: FriendOnlineHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.friendOnline.add(handler);
  return () => { listeners.friendOnline.delete(handler); };
}

export function onFriendOffline(accessor: SocketAccessor, handler: FriendOfflineHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.friendOffline.add(handler);
  return () => { listeners.friendOffline.delete(handler); };
}

export function onFriendStatusList(accessor: SocketAccessor, handler: FriendStatusListHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.friendStatusList.add(handler);
  return () => { listeners.friendStatusList.delete(handler); };
}

export function onNotification(accessor: SocketAccessor, handler: NotificationHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.notification.add(handler);
  return () => { listeners.notification.delete(handler); };
}

export function onNotificationUpdate(accessor: SocketAccessor, handler: NotificationUpdateHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.notificationUpdate.add(handler);
  return () => { listeners.notificationUpdate.delete(handler); };
}
