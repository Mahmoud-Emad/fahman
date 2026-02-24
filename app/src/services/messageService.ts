/**
 * Message service
 * Handles all message-related API calls
 */

import { api, ApiResponse } from './api';

// Types
export interface Message {
  id: string;
  senderId: string;
  recipientId: string | null;
  roomId: string | null;
  text: string;
  messageType: 'ROOM' | 'PRIVATE' | 'SYSTEM' | 'ROOM_INVITE';
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface Conversation {
  otherId: string;
  otherName: string;
  otherAvatar: string | null;
  lastMessage: {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

export interface ConversationMessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Message Service
export const messageService = {
  /**
   * Get all conversations
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return api.get<Conversation[]>('/messages/conversations');
  },

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<ApiResponse<ConversationMessagesResponse>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);

    return api.get<ConversationMessagesResponse>(`/messages/conversations/${userId}?${params}`);
  },

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(userId: string): Promise<ApiResponse<{ markedRead: number }>> {
    return api.patch(`/messages/conversations/${userId}/read`);
  },

  /**
   * Send a direct message
   */
  async sendMessage(recipientId: string, text: string): Promise<ApiResponse<Message>> {
    return api.post<Message>('/messages', { recipientId, text });
  },

  /**
   * Send room invite messages
   */
  async sendRoomInvite(data: {
    recipientIds: string[];
    roomCode: string;
    roomTitle: string;
  }): Promise<ApiResponse<{ sent: number }>> {
    return api.post('/messages/room-invite', data);
  },

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<ApiResponse<{ markedRead: number }>> {
    return api.patch('/messages/read', { messageIds });
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    return api.get<UnreadCountResponse>('/messages/unread-count');
  },

  /**
   * Get room chat messages
   */
  async getRoomMessages(
    roomId: string,
    limit: number = 50,
    before?: string
  ): Promise<ApiResponse<ConversationMessagesResponse>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);

    return api.get<ConversationMessagesResponse>(`/messages/room/${roomId}?${params}`);
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<ApiResponse<null>> {
    return api.delete(`/messages/${messageId}`);
  },
};
