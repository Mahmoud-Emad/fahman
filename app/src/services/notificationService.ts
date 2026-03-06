/**
 * Notification service
 * Handles all notification-related API calls
 */

import { api, ApiResponse } from './api';

// Types
export interface Notification {
  id: string;
  userId: string;
  type: 'ROOM_INVITE' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'SYSTEM';
  title: string;
  message: string;
  senderId: string | null;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  actionData: any | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  unreadCount: number;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  meta: PaginationMeta;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Notification Service
export const notificationService = {
  /**
   * Get notifications with pagination
   */
  async getNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Promise<ApiResponse<Notification[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    });

    const response = await api.get<Notification[]>(`/notifications?${params}`);
    return response;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    return api.get<UnreadCountResponse>('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<null>> {
    return api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<ApiResponse<{ updated: number }>> {
    return api.post('/notifications/read-all');
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    return api.delete(`/notifications/${notificationId}`);
  },

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(): Promise<ApiResponse<{ deleted: number }>> {
    return api.delete('/notifications/clear-read');
  },

  /**
   * Resolve a notification action (accept, decline, join)
   */
  async resolveAction(notificationId: string, action: string): Promise<ApiResponse<null>> {
    return api.patch(`/notifications/${notificationId}/action`, { action });
  },

  /**
   * Send room invites
   */
  async sendRoomInvites(data: {
    recipientIds: string[];
    roomCode: string;
    roomTitle: string;
    packTitle?: string;
  }): Promise<ApiResponse<{ sent: number }>> {
    return api.post('/notifications/room-invite', data);
  },
};
