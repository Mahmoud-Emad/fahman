/**
 * WebSocket Type Definitions
 */

import { Socket } from 'socket.io';

// Authenticated socket with user data
export interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
  roomIds: Set<string>; // Rooms the user is currently in
}

// Client to Server Events
export interface ClientToServerEvents {
  // Room events
  'room:join': (data: { roomId: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:ready': (data: { roomId: string; isReady: boolean }) => void;

  // Game events
  'game:answer': (data: {
    roomId: string;
    answer: number | number[];
    betAmount: number;
    timeRemaining: number;
  }) => void;
  'game:next': (data: { roomId: string }) => void;

  // Chat events
  'chat:message': (data: { roomId: string; text: string }) => void;
  'chat:typing': (data: { roomId: string }) => void;
  'chat:stopTyping': (data: { roomId: string }) => void;

  // Friend events
  'friend:status': () => void; // Request friend statuses

  // Direct message events
  'dm:send': (data: { recipientId: string; text: string }) => void;
  'dm:typing': (data: { recipientId: string }) => void;
  'dm:stopTyping': (data: { recipientId: string }) => void;
  'dm:read': (data: { senderId: string }) => void; // Mark messages from sender as read
}

// Server to Client Events
export interface ServerToClientEvents {
  // Connection events
  'connection:success': (data: { userId: string; username: string }) => void;
  'connection:error': (data: { message: string }) => void;

  // Room events
  'room:joined': (data: { roomId: string; members: RoomMemberInfo[] }) => void;
  'room:left': (data: { roomId: string }) => void;
  'room:playerJoined': (data: { roomId: string; player: RoomMemberInfo }) => void;
  'room:playerLeft': (data: { roomId: string; playerId: string }) => void;
  'room:playerReady': (data: { roomId: string; playerId: string; isReady: boolean }) => void;
  'room:updated': (data: { roomId: string; updates: Partial<RoomInfo> }) => void;
  'room:closed': (data: { roomId: string; reason: string }) => void;
  'room:kicked': (data: { roomId: string; reason: string }) => void;
  'room:listUpdate': (data: { roomId: string; currentPlayers: number; status: string }) => void;

  // Game events
  'game:started': (data: GameStartedData) => void;
  'game:question': (data: QuestionData) => void;
  'game:playerAnswered': (data: { roomId: string; playerId: string }) => void;
  'game:questionResults': (data: QuestionResultsData) => void;
  'game:timerTick': (data: { roomId: string; timeLeft: number }) => void;
  'game:finished': (data: GameFinishedData) => void;
  'game:scoreUpdate': (data: { roomId: string; scores: PlayerScore[] }) => void;

  // Chat events
  'chat:message': (data: ChatMessage) => void;
  'chat:typing': (data: { roomId: string; userId: string; username: string }) => void;
  'chat:stopTyping': (data: { roomId: string; userId: string }) => void;

  // Friend events
  'friend:online': (data: { userId: string }) => void;
  'friend:offline': (data: { userId: string }) => void;
  'friend:statusList': (data: { online: string[] }) => void;

  // Notification events
  'notification:new': (data: NotificationData) => void;
  'notification:updated': (data: NotificationUpdateData) => void;

  // Direct message events
  'dm:message': (data: DirectMessage) => void;
  'dm:typing': (data: { senderId: string; senderName: string }) => void;
  'dm:stopTyping': (data: { senderId: string }) => void;
  'dm:read': (data: { byUserId: string }) => void; // Your messages were read

  // Error events
  'error': (data: { message: string; code?: string }) => void;
}

// Data types
export interface RoomMemberInfo {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  isReady: boolean;
  role: string;
}

export interface RoomInfo {
  id: string;
  code: string;
  title: string;
  status: string;
  maxPlayers: number;
  currentPlayers: number;
}

export interface GameStartedData {
  roomId: string;
  totalQuestions: number;
  packTitle: string;
  textHint: string | null;
}

export interface QuestionData {
  roomId: string;
  questionNumber: number;
  totalQuestions: number;
  question: {
    id: string;
    text: string;
    options: string[];
    questionType: string;
    mediaUrl: string | null;
    mediaType: string | null;
    timeLimit: number;
    points: number;
  };
}

export interface QuestionResultsData {
  roomId: string;
  questionId: string;
  correctAnswer: number[];
  playerResults: {
    playerId: string;
    username: string;
    isCorrect: boolean;
    pointsEarned: number;
    newScore: number;
  }[];
}

export interface GameFinishedData {
  roomId: string;
  winner: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
  } | null;
  finalScores: PlayerScore[];
}

export interface PlayerScore {
  playerId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  rank: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  text: string;
  timestamp: Date;
  type: 'ROOM' | 'SYSTEM';
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  recipientId: string;
  text: string;
  timestamp: Date;
  type: 'PRIVATE' | 'ROOM_INVITE';
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  senderId: string | null;
  senderName: string | null;
  actionData: Record<string, any> | null;
  createdAt: Date;
  sender?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
}

export interface NotificationUpdateData {
  id: string;
  actionTaken: string;
}

// Inter-server events (for scaling with Redis adapter)
export interface InterServerEvents {
  ping: () => void;
}

// Socket data stored on the socket instance
export interface SocketData {
  userId: string;
  username: string;
}
