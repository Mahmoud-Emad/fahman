/**
 * Mock data for messaging system testing
 */
import type {
  Notification,
  Conversation,
  DirectMessage,
} from "./types";

/**
 * Current user ID for testing
 */
export const CURRENT_USER_ID = "currentUser";

/**
 * Mock notifications
 */
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "room_invite",
    title: "Game Invitation",
    message: "Ahmed invited you to play Movie Trivia",
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
    isRead: false,
    sender: { id: "u1", name: "Ahmed Hassan", initials: "AH" },
    actionData: {
      type: "room_invite",
      roomCode: "ABC123",
      packName: "Movie Trivia",
      packId: "pack1",
      hostName: "Ahmed Hassan",
    },
  },
  {
    id: "n2",
    type: "friend_request",
    title: "Friend Request",
    message: "Sara wants to be your friend",
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    isRead: false,
    sender: { id: "u2", name: "Sara Ali", initials: "SA" },
    actionData: { type: "friend_request", userId: "u2" },
  },
  {
    id: "n3",
    type: "room_invite",
    title: "Game Invitation",
    message: "Omar invited you to play Sports Quiz",
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
    isRead: true,
    sender: { id: "u3", name: "Omar Khaled", initials: "OK" },
    actionData: {
      type: "room_invite",
      roomCode: "XYZ789",
      packName: "Sports Quiz",
      packId: "pack2",
      hostName: "Omar Khaled",
    },
  },
  {
    id: "n4",
    type: "friend_accepted",
    title: "Friend Request Accepted",
    message: "Fatima accepted your friend request",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    isRead: true,
    sender: { id: "u4", name: "Fatima Noor", initials: "FN" },
  },
  {
    id: "n5",
    type: "system",
    title: "Achievement Unlocked",
    message: "You played 10 games! Keep it up!",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
  },
  {
    id: "n6",
    type: "room_invite",
    title: "Game Invitation",
    message: "Youssef invited you to play General Knowledge",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    isRead: true,
    sender: { id: "u5", name: "Youssef Mahmoud", initials: "YM" },
    actionData: {
      type: "room_invite",
      roomCode: "DEF456",
      packName: "General Knowledge",
      packId: "pack3",
      hostName: "Youssef Mahmoud",
    },
  },
];

/**
 * Mock conversations
 */
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    participants: [
      { id: "u1", name: "Ahmed Hassan", initials: "AH", isOnline: true },
    ],
    lastMessage: {
      text: "Join my game room!",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      senderId: "u1",
    },
    unreadCount: 3,
  },
  {
    id: "conv2",
    participants: [
      { id: "u2", name: "Sara Ali", initials: "SA", isOnline: true },
    ],
    lastMessage: {
      text: "Sure, see you then!",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      senderId: CURRENT_USER_ID,
    },
    unreadCount: 0,
  },
  {
    id: "conv3",
    participants: [
      { id: "u3", name: "Omar Khaled", initials: "OK", isOnline: false },
    ],
    lastMessage: {
      text: "Great game yesterday!",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      senderId: "u3",
    },
    unreadCount: 1,
  },
  {
    id: "conv4",
    participants: [
      { id: "u4", name: "Fatima Noor", initials: "FN", isOnline: false },
    ],
    lastMessage: {
      text: "Thanks for accepting!",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      senderId: "u4",
    },
    unreadCount: 0,
  },
  {
    id: "conv5",
    participants: [
      { id: "u5", name: "Youssef Mahmoud", initials: "YM", isOnline: true },
    ],
    lastMessage: {
      text: "Let's play again soon",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      senderId: CURRENT_USER_ID,
    },
    unreadCount: 0,
  },
];

/**
 * Mock messages for conversation 1 (Ahmed Hassan)
 */
export const MOCK_MESSAGES_CONV1: DirectMessage[] = [
  {
    id: "m1",
    conversationId: "conv1",
    senderId: "u1",
    senderName: "Ahmed Hassan",
    senderInitials: "AH",
    type: "text",
    text: "Hey! You free?",
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m2",
    conversationId: "conv1",
    senderId: CURRENT_USER_ID,
    senderName: "You",
    senderInitials: "YO",
    type: "text",
    text: "Yeah what's up?",
    timestamp: new Date(Date.now() - 9 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m3",
    conversationId: "conv1",
    senderId: "u1",
    senderName: "Ahmed Hassan",
    senderInitials: "AH",
    type: "text",
    text: "Want to play some trivia?",
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m4",
    conversationId: "conv1",
    senderId: CURRENT_USER_ID,
    senderName: "You",
    senderInitials: "YO",
    type: "text",
    text: "Sure! Create a room",
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m5",
    conversationId: "conv1",
    senderId: "u1",
    senderName: "Ahmed Hassan",
    senderInitials: "AH",
    type: "room_invite",
    roomInvite: {
      roomCode: "ABC123",
      packName: "Movie Trivia Pack",
      packId: "pack1",
      hostId: "u1",
      hostName: "Ahmed Hassan",
      isActive: true,
      currentPlayers: 3,
      maxPlayers: 8,
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
    status: "delivered",
  },
  {
    id: "m6",
    conversationId: "conv1",
    senderId: "u1",
    senderName: "Ahmed Hassan",
    senderInitials: "AH",
    type: "text",
    text: "Join my game room!",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    isRead: false,
    status: "delivered",
  },
];

/**
 * Mock messages for conversation 2 (Sara Ali)
 */
export const MOCK_MESSAGES_CONV2: DirectMessage[] = [
  {
    id: "m10",
    conversationId: "conv2",
    senderId: "u2",
    senderName: "Sara Ali",
    senderInitials: "SA",
    type: "text",
    text: "Hi! Are you coming to the game night tomorrow?",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m11",
    conversationId: "conv2",
    senderId: CURRENT_USER_ID,
    senderName: "You",
    senderInitials: "YO",
    type: "text",
    text: "Yes! What time?",
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m12",
    conversationId: "conv2",
    senderId: "u2",
    senderName: "Sara Ali",
    senderInitials: "SA",
    type: "text",
    text: "Around 8 PM, I'll create the room then",
    timestamp: new Date(Date.now() - 80 * 60 * 1000),
    isRead: true,
    status: "read",
  },
  {
    id: "m13",
    conversationId: "conv2",
    senderId: CURRENT_USER_ID,
    senderName: "You",
    senderInitials: "YO",
    type: "text",
    text: "Sure, see you then!",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    isRead: true,
    status: "read",
  },
];

/**
 * Get messages for a conversation
 */
export function getMessagesForConversation(
  conversationId: string
): DirectMessage[] {
  switch (conversationId) {
    case "conv1":
      return MOCK_MESSAGES_CONV1;
    case "conv2":
      return MOCK_MESSAGES_CONV2;
    default:
      return [];
  }
}

/**
 * Get total unread notification count
 */
export function getUnreadNotificationCount(): number {
  return MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
}

/**
 * Get total unread message count
 */
export function getUnreadMessageCount(): number {
  return MOCK_CONVERSATIONS.reduce((sum, conv) => sum + conv.unreadCount, 0);
}
