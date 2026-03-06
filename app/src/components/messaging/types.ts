/**
 * Messaging system type definitions
 */

// ==================== NOTIFICATIONS ====================

/**
 * Notification types
 */
export type NotificationType =
  | "room_invite"
  | "friend_request"
  | "friend_accepted"
  | "system";

/**
 * Room invite action data
 */
export interface RoomInviteActionData {
  type: "room_invite";
  roomCode: string;
  packName: string;
  packId: string;
  password?: string;
  hostName: string;
}

/**
 * Friend request action data
 */
export interface FriendRequestActionData {
  type: "friend_request";
  senderId: string;
  senderName: string;
  friendshipId: string;
}

/**
 * Action data for different notification types
 */
export type NotificationActionData =
  | RoomInviteActionData
  | FriendRequestActionData
  | null;

/**
 * Notification sender info
 */
export interface NotificationSender {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

/**
 * Base notification structure
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  sender?: NotificationSender;
  actionData?: NotificationActionData;
  actionTaken?: string | null;
}

// ==================== CONVERSATIONS ====================

/**
 * Conversation participant
 */
export interface ConversationParticipant {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  isOnline?: boolean;
}

/**
 * Last message preview
 */
export interface LastMessagePreview {
  text: string;
  timestamp: Date;
  senderId: string;
}

/**
 * Conversation (chat thread) structure
 */
export interface Conversation {
  id: string;
  otherId: string;
  participants: ConversationParticipant[];
  lastMessage: LastMessagePreview;
  unreadCount: number;
  isMuted?: boolean;
}

// ==================== DIRECT MESSAGES ====================

/**
 * Direct message types
 */
export type DirectMessageType = "text" | "room_invite" | "system";

/**
 * Message delivery status
 */
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

/**
 * Room invite embedded in a message
 */
export interface RoomInviteData {
  roomCode: string;
  packName: string;
  packId: string;
  password?: string;
  hostId: string;
  hostName: string;
  isActive: boolean;
  currentPlayers: number;
  maxPlayers: number;
  expiredReason?: 'deleted' | 'full' | 'in_progress' | 'finished' | 'closed' | null;
}

/**
 * Direct message structure
 */
export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  type: DirectMessageType;
  text?: string;
  roomInvite?: RoomInviteData;
  timestamp: Date;
  isRead: boolean;
  status: MessageStatus;
}

// ==================== NOTIFICATION ACTIONS ====================

/**
 * Actions that can be taken on notifications
 */
export type NotificationAction = "join" | "accept" | "decline" | "view";

// ==================== UTILITY TYPES ====================

/**
 * Time group for notifications
 */
export type TimeGroup = "today" | "yesterday" | "this_week" | "earlier";

/**
 * Get time group for a date
 */
export function getTimeGroup(date: Date): TimeGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) {
    return "today";
  } else if (date >= yesterday) {
    return "yesterday";
  } else if (date >= weekAgo) {
    return "this_week";
  }
  return "earlier";
}

/**
 * Format timestamp for display
 */
export function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}
