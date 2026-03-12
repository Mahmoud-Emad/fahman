/**
 * Socket Service — Shared types and interfaces
 */

import type { Socket } from 'socket.io-client';

// ============================================
// Data types
// ============================================

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
  roomCode?: string;
  roomTitle?: string;
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

// ============================================
// Handler types
// ============================================

export type ConnectionSuccessHandler = (data: { userId: string; username: string }) => void;
export type ConnectionErrorHandler = (data: { message: string }) => void;
export type RoomJoinedHandler = (data: { roomId: string; members: RoomMemberInfo[] }) => void;
export type RoomLeftHandler = (data: { roomId: string }) => void;
export type PlayerJoinedHandler = (data: { roomId: string; player: RoomMemberInfo }) => void;
export type PlayerLeftHandler = (data: { roomId: string; playerId: string }) => void;
export type PlayerReadyHandler = (data: { roomId: string; playerId: string; isReady: boolean }) => void;
export type RoomUpdatedHandler = (data: { roomId: string; updates: Partial<RoomInfo> }) => void;
export type RoomClosedHandler = (data: { roomId: string; reason: string }) => void;
export type RoomKickedHandler = (data: { roomId: string; reason: string }) => void;
export type RoomListUpdateHandler = (data: { roomId: string; currentPlayers: number; status: string }) => void;
export type GameStartedHandler = (data: GameStartedData) => void;
export type QuestionHandler = (data: QuestionData) => void;
export type PlayerAnsweredHandler = (data: { roomId: string; playerId: string }) => void;
export type QuestionResultsHandler = (data: QuestionResultsData) => void;
export type TimerTickHandler = (data: { roomId: string; timeLeft: number }) => void;
export type GameFinishedHandler = (data: GameFinishedData) => void;
export type ScoreUpdateHandler = (data: { roomId: string; scores: PlayerScore[] }) => void;
export type ChatMessageHandler = (data: ChatMessage) => void;
export type ChatTypingHandler = (data: { roomId: string; userId: string; username: string }) => void;
export type FriendOnlineHandler = (data: { userId: string }) => void;
export type FriendOfflineHandler = (data: { userId: string }) => void;
export type FriendStatusListHandler = (data: { online: string[] }) => void;
export type NotificationHandler = (data: NotificationData) => void;
export type NotificationUpdateHandler = (data: NotificationUpdateData) => void;
export type DirectMessageHandler = (data: DirectMessage) => void;
export type DmTypingHandler = (data: { senderId: string; senderName: string }) => void;
export type DmReadHandler = (data: { byUserId: string }) => void;
export type ErrorHandler = (data: { message: string; code?: string }) => void;

// ============================================
// Listener map type (shared across modules)
// ============================================

export interface SocketListeners {
  connectionSuccess: Set<ConnectionSuccessHandler>;
  connectionError: Set<ConnectionErrorHandler>;
  roomJoined: Set<RoomJoinedHandler>;
  roomLeft: Set<RoomLeftHandler>;
  playerJoined: Set<PlayerJoinedHandler>;
  playerLeft: Set<PlayerLeftHandler>;
  playerReady: Set<PlayerReadyHandler>;
  roomUpdated: Set<RoomUpdatedHandler>;
  roomClosed: Set<RoomClosedHandler>;
  roomKicked: Set<RoomKickedHandler>;
  roomListUpdate: Set<RoomListUpdateHandler>;
  gameStarted: Set<GameStartedHandler>;
  question: Set<QuestionHandler>;
  playerAnswered: Set<PlayerAnsweredHandler>;
  questionResults: Set<QuestionResultsHandler>;
  timerTick: Set<TimerTickHandler>;
  gameFinished: Set<GameFinishedHandler>;
  scoreUpdate: Set<ScoreUpdateHandler>;
  chatMessage: Set<ChatMessageHandler>;
  chatTyping: Set<ChatTypingHandler>;
  chatStopTyping: Set<ChatTypingHandler>;
  friendOnline: Set<FriendOnlineHandler>;
  friendOffline: Set<FriendOfflineHandler>;
  friendStatusList: Set<FriendStatusListHandler>;
  notification: Set<NotificationHandler>;
  notificationUpdate: Set<NotificationUpdateHandler>;
  directMessage: Set<DirectMessageHandler>;
  dmTyping: Set<DmTypingHandler>;
  dmStopTyping: Set<DmTypingHandler>;
  dmRead: Set<DmReadHandler>;
  error: Set<ErrorHandler>;
  connect: Set<() => void>;
  disconnect: Set<(reason: string) => void>;
}

/**
 * Accessor interface — passed to domain modules so they can
 * read the socket reference and the listener map without
 * accessing SocketService internals directly.
 */
export interface SocketAccessor {
  getSocket(): Socket | null;
  getListeners(): SocketListeners;
}
