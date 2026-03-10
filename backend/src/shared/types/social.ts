/**
 * Social DTOs (Messaging, Friends, Notifications)
 */

export interface SendMessageDto {
  recipientId: string;
  text: string;
}

export interface SendRoomInviteDto {
  recipientIds: string[];
  roomCode: string;
  roomTitle: string;
}

export interface FriendRequestDto {
  userId: string;
}

export interface FriendRequestByIdentifierDto {
  identifier: string;
}

export interface MarkAsReadDto {
  messageIds: string[];
}
