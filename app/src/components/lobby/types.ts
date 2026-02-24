/**
 * Lobby type definitions
 */

/**
 * Player data structure
 */
export interface Player {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  score: number;
  answer?: string;
  isCorrect?: boolean;
  hasAnswered: boolean;
  isFriend?: boolean;
  isMuted?: boolean;
  isBlocked?: boolean;
  friendRequestSent?: boolean;
}

/**
 * Chat message type
 */
export type ChatMessageType = "user" | "system";

/**
 * System message variants for styling
 */
export type SystemMessageVariant = "info" | "success" | "warning" | "error";

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderInitials: string;
  senderAvatar?: string;
  message: string;
  timestamp: Date;
  type?: ChatMessageType;
  systemVariant?: SystemMessageVariant;
}
