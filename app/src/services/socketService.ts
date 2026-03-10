/**
 * Socket Service
 * WebSocket connection and event handling for real-time features
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config/env';
import { storage } from './storage';

// Re-export types for consumers
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

// Event listener types
type ConnectionSuccessHandler = (data: { userId: string; username: string }) => void;
type ConnectionErrorHandler = (data: { message: string }) => void;
type RoomJoinedHandler = (data: { roomId: string; members: RoomMemberInfo[] }) => void;
type RoomLeftHandler = (data: { roomId: string }) => void;
type PlayerJoinedHandler = (data: { roomId: string; player: RoomMemberInfo }) => void;
type PlayerLeftHandler = (data: { roomId: string; playerId: string }) => void;
type PlayerReadyHandler = (data: { roomId: string; playerId: string; isReady: boolean }) => void;
type RoomUpdatedHandler = (data: { roomId: string; updates: Partial<RoomInfo> }) => void;
type RoomClosedHandler = (data: { roomId: string; reason: string }) => void;
type RoomKickedHandler = (data: { roomId: string; reason: string }) => void;
type RoomListUpdateHandler = (data: { roomId: string; currentPlayers: number; status: string }) => void;
type GameStartedHandler = (data: GameStartedData) => void;
type QuestionHandler = (data: QuestionData) => void;
type PlayerAnsweredHandler = (data: { roomId: string; playerId: string }) => void;
type QuestionResultsHandler = (data: QuestionResultsData) => void;
type TimerTickHandler = (data: { roomId: string; timeLeft: number }) => void;
type GameFinishedHandler = (data: GameFinishedData) => void;
type ScoreUpdateHandler = (data: { roomId: string; scores: PlayerScore[] }) => void;
type ChatMessageHandler = (data: ChatMessage) => void;
type ChatTypingHandler = (data: { roomId: string; userId: string; username: string }) => void;
type FriendOnlineHandler = (data: { userId: string }) => void;
type FriendOfflineHandler = (data: { userId: string }) => void;
type FriendStatusListHandler = (data: { online: string[] }) => void;
type NotificationHandler = (data: NotificationData) => void;
type NotificationUpdateHandler = (data: NotificationUpdateData) => void;
type DirectMessageHandler = (data: DirectMessage) => void;
type DmTypingHandler = (data: { senderId: string; senderName: string }) => void;
type DmReadHandler = (data: { byUserId: string }) => void;
type ErrorHandler = (data: { message: string; code?: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  // Event listeners (using Set for multiple listeners per event)
  private listeners = {
    connectionSuccess: new Set<ConnectionSuccessHandler>(),
    connectionError: new Set<ConnectionErrorHandler>(),
    roomJoined: new Set<RoomJoinedHandler>(),
    roomLeft: new Set<RoomLeftHandler>(),
    playerJoined: new Set<PlayerJoinedHandler>(),
    playerLeft: new Set<PlayerLeftHandler>(),
    playerReady: new Set<PlayerReadyHandler>(),
    roomUpdated: new Set<RoomUpdatedHandler>(),
    roomClosed: new Set<RoomClosedHandler>(),
    roomKicked: new Set<RoomKickedHandler>(),
    roomListUpdate: new Set<RoomListUpdateHandler>(),
    gameStarted: new Set<GameStartedHandler>(),
    question: new Set<QuestionHandler>(),
    playerAnswered: new Set<PlayerAnsweredHandler>(),
    questionResults: new Set<QuestionResultsHandler>(),
    timerTick: new Set<TimerTickHandler>(),
    gameFinished: new Set<GameFinishedHandler>(),
    scoreUpdate: new Set<ScoreUpdateHandler>(),
    chatMessage: new Set<ChatMessageHandler>(),
    chatTyping: new Set<ChatTypingHandler>(),
    chatStopTyping: new Set<ChatTypingHandler>(),
    friendOnline: new Set<FriendOnlineHandler>(),
    friendOffline: new Set<FriendOfflineHandler>(),
    friendStatusList: new Set<FriendStatusListHandler>(),
    notification: new Set<NotificationHandler>(),
    notificationUpdate: new Set<NotificationUpdateHandler>(),
    directMessage: new Set<DirectMessageHandler>(),
    dmTyping: new Set<DmTypingHandler>(),
    dmStopTyping: new Set<DmTypingHandler>(),
    dmRead: new Set<DmReadHandler>(),
    error: new Set<ErrorHandler>(),
    connect: new Set<() => void>(),
    disconnect: new Set<(reason: string) => void>(),
  };

  /**
   * Check if socket is connected
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await storage.getAccessToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.setupEventHandlers();
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  /**
   * Setup all event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.listeners.connect.forEach((handler) => handler());
    });

    this.socket.on('disconnect', (reason) => {
      this.listeners.disconnect.forEach((handler) => handler(reason));
    });

    this.socket.on('connection:success', (data) => {
      this.listeners.connectionSuccess.forEach((handler) => handler(data));
    });

    this.socket.on('connection:error', (data) => {
      this.listeners.connectionError.forEach((handler) => handler(data));
    });

    // Room events
    this.socket.on('room:joined', (data) => {
      this.listeners.roomJoined.forEach((handler) => handler(data));
    });

    this.socket.on('room:left', (data) => {
      this.listeners.roomLeft.forEach((handler) => handler(data));
    });

    this.socket.on('room:playerJoined', (data) => {
      this.listeners.playerJoined.forEach((handler) => handler(data));
    });

    this.socket.on('room:playerLeft', (data) => {
      this.listeners.playerLeft.forEach((handler) => handler(data));
    });

    this.socket.on('room:playerReady', (data) => {
      this.listeners.playerReady.forEach((handler) => handler(data));
    });

    this.socket.on('room:updated', (data) => {
      this.listeners.roomUpdated.forEach((handler) => handler(data));
    });

    this.socket.on('room:closed', (data) => {
      this.listeners.roomClosed.forEach((handler) => handler(data));
    });

    this.socket.on('room:kicked', (data) => {
      this.listeners.roomKicked.forEach((handler) => handler(data));
    });

    this.socket.on('room:listUpdate', (data) => {
      this.listeners.roomListUpdate.forEach((handler) => handler(data));
    });

    // Game events
    this.socket.on('game:started', (data) => {
      this.listeners.gameStarted.forEach((handler) => handler(data));
    });

    this.socket.on('game:question', (data) => {
      this.listeners.question.forEach((handler) => handler(data));
    });

    this.socket.on('game:playerAnswered', (data) => {
      this.listeners.playerAnswered.forEach((handler) => handler(data));
    });

    this.socket.on('game:questionResults', (data) => {
      this.listeners.questionResults.forEach((handler) => handler(data));
    });

    this.socket.on('game:timerTick', (data) => {
      this.listeners.timerTick.forEach((handler) => handler(data));
    });

    this.socket.on('game:finished', (data) => {
      this.listeners.gameFinished.forEach((handler) => handler(data));
    });

    this.socket.on('game:scoreUpdate', (data) => {
      this.listeners.scoreUpdate.forEach((handler) => handler(data));
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      this.listeners.chatMessage.forEach((handler) => handler(data));
    });

    this.socket.on('chat:typing', (data) => {
      this.listeners.chatTyping.forEach((handler) => handler(data));
    });

    this.socket.on('chat:stopTyping', (data) => {
      this.listeners.chatStopTyping.forEach((handler) => handler(data));
    });

    // Friend events
    this.socket.on('friend:online', (data) => {
      this.listeners.friendOnline.forEach((handler) => handler(data));
    });

    this.socket.on('friend:offline', (data) => {
      this.listeners.friendOffline.forEach((handler) => handler(data));
    });

    this.socket.on('friend:statusList', (data) => {
      this.listeners.friendStatusList.forEach((handler) => handler(data));
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.listeners.notification.forEach((handler) => handler(data));
    });

    this.socket.on('notification:updated', (data) => {
      this.listeners.notificationUpdate.forEach((handler) => handler(data));
    });

    // Direct message events
    this.socket.on('dm:message', (data) => {
      this.listeners.directMessage.forEach((handler) => handler(data));
    });

    this.socket.on('dm:typing', (data) => {
      this.listeners.dmTyping.forEach((handler) => handler(data));
    });

    this.socket.on('dm:stopTyping', (data) => {
      this.listeners.dmStopTyping.forEach((handler) => handler(data));
    });

    this.socket.on('dm:read', (data) => {
      this.listeners.dmRead.forEach((handler) => handler(data));
    });

    // Error events
    this.socket.on('error', (data) => {
      this.listeners.error.forEach((handler) => handler(data));
    });
  }

  // ============================================
  // Client to Server Events
  // ============================================

  /**
   * Join a room channel
   */
  joinRoom(roomId: string): void {
    this.socket?.emit('room:join', { roomId });
  }

  /**
   * Leave a room channel
   */
  leaveRoom(roomId: string): void {
    this.socket?.emit('room:leave', { roomId });
  }

  /**
   * Set ready status in a room
   */
  setReady(roomId: string, isReady: boolean): void {
    this.socket?.emit('room:ready', { roomId, isReady });
  }

  /**
   * Submit answer for current question
   */
  submitAnswer(roomId: string, answer: string, betAmount: number, timeRemaining: number): void {
    this.socket?.emit('game:answer', { roomId, answer, betAmount, timeRemaining });
  }

  /**
   * Request next question (host only)
   */
  nextQuestion(roomId: string): void {
    this.socket?.emit('game:next', { roomId });
  }

  /**
   * Send a chat message in a room
   */
  sendChatMessage(roomId: string, text: string): void {
    this.socket?.emit('chat:message', { roomId, text });
  }

  /**
   * Send typing indicator in a room
   */
  sendChatTyping(roomId: string): void {
    this.socket?.emit('chat:typing', { roomId });
  }

  /**
   * Stop typing indicator in a room
   */
  sendChatStopTyping(roomId: string): void {
    this.socket?.emit('chat:stopTyping', { roomId });
  }

  /**
   * Request friend statuses
   */
  requestFriendStatuses(): void {
    this.socket?.emit('friend:status');
  }

  /**
   * Send a direct message
   */
  sendDirectMessage(recipientId: string, text: string): void {
    this.socket?.emit('dm:send', { recipientId, text });
  }

  /**
   * Send typing indicator in a DM
   */
  sendDmTyping(recipientId: string): void {
    this.socket?.emit('dm:typing', { recipientId });
  }

  /**
   * Stop typing indicator in a DM
   */
  sendDmStopTyping(recipientId: string): void {
    this.socket?.emit('dm:stopTyping', { recipientId });
  }

  /**
   * Mark DM messages from a sender as read
   */
  markDmAsRead(senderId: string): void {
    this.socket?.emit('dm:read', { senderId });
  }

  // ============================================
  // Event Subscription Methods
  // ============================================

  onConnect(handler: () => void): () => void {
    this.listeners.connect.add(handler);
    return () => this.listeners.connect.delete(handler);
  }

  onDisconnect(handler: (reason: string) => void): () => void {
    this.listeners.disconnect.add(handler);
    return () => this.listeners.disconnect.delete(handler);
  }

  onConnectionSuccess(handler: ConnectionSuccessHandler): () => void {
    this.listeners.connectionSuccess.add(handler);
    return () => this.listeners.connectionSuccess.delete(handler);
  }

  onConnectionError(handler: ConnectionErrorHandler): () => void {
    this.listeners.connectionError.add(handler);
    return () => this.listeners.connectionError.delete(handler);
  }

  onRoomJoined(handler: RoomJoinedHandler): () => void {
    this.listeners.roomJoined.add(handler);
    return () => this.listeners.roomJoined.delete(handler);
  }

  onRoomLeft(handler: RoomLeftHandler): () => void {
    this.listeners.roomLeft.add(handler);
    return () => this.listeners.roomLeft.delete(handler);
  }

  onPlayerJoined(handler: PlayerJoinedHandler): () => void {
    this.listeners.playerJoined.add(handler);
    return () => this.listeners.playerJoined.delete(handler);
  }

  onPlayerLeft(handler: PlayerLeftHandler): () => void {
    this.listeners.playerLeft.add(handler);
    return () => this.listeners.playerLeft.delete(handler);
  }

  onPlayerReady(handler: PlayerReadyHandler): () => void {
    this.listeners.playerReady.add(handler);
    return () => this.listeners.playerReady.delete(handler);
  }

  onRoomUpdated(handler: RoomUpdatedHandler): () => void {
    this.listeners.roomUpdated.add(handler);
    return () => this.listeners.roomUpdated.delete(handler);
  }

  onRoomClosed(handler: RoomClosedHandler): () => void {
    this.listeners.roomClosed.add(handler);
    return () => this.listeners.roomClosed.delete(handler);
  }

  onRoomKicked(handler: RoomKickedHandler): () => void {
    this.listeners.roomKicked.add(handler);
    return () => this.listeners.roomKicked.delete(handler);
  }

  onRoomListUpdate(handler: RoomListUpdateHandler): () => void {
    this.listeners.roomListUpdate.add(handler);
    return () => this.listeners.roomListUpdate.delete(handler);
  }

  onGameStarted(handler: GameStartedHandler): () => void {
    this.listeners.gameStarted.add(handler);
    return () => this.listeners.gameStarted.delete(handler);
  }

  onQuestion(handler: QuestionHandler): () => void {
    this.listeners.question.add(handler);
    return () => this.listeners.question.delete(handler);
  }

  onPlayerAnswered(handler: PlayerAnsweredHandler): () => void {
    this.listeners.playerAnswered.add(handler);
    return () => this.listeners.playerAnswered.delete(handler);
  }

  onQuestionResults(handler: QuestionResultsHandler): () => void {
    this.listeners.questionResults.add(handler);
    return () => this.listeners.questionResults.delete(handler);
  }

  onTimerTick(handler: TimerTickHandler): () => void {
    this.listeners.timerTick.add(handler);
    return () => this.listeners.timerTick.delete(handler);
  }

  onGameFinished(handler: GameFinishedHandler): () => void {
    this.listeners.gameFinished.add(handler);
    return () => this.listeners.gameFinished.delete(handler);
  }

  onScoreUpdate(handler: ScoreUpdateHandler): () => void {
    this.listeners.scoreUpdate.add(handler);
    return () => this.listeners.scoreUpdate.delete(handler);
  }

  onChatMessage(handler: ChatMessageHandler): () => void {
    this.listeners.chatMessage.add(handler);
    return () => this.listeners.chatMessage.delete(handler);
  }

  onChatTyping(handler: ChatTypingHandler): () => void {
    this.listeners.chatTyping.add(handler);
    return () => this.listeners.chatTyping.delete(handler);
  }

  onChatStopTyping(handler: ChatTypingHandler): () => void {
    this.listeners.chatStopTyping.add(handler);
    return () => this.listeners.chatStopTyping.delete(handler);
  }

  onFriendOnline(handler: FriendOnlineHandler): () => void {
    this.listeners.friendOnline.add(handler);
    return () => this.listeners.friendOnline.delete(handler);
  }

  onFriendOffline(handler: FriendOfflineHandler): () => void {
    this.listeners.friendOffline.add(handler);
    return () => this.listeners.friendOffline.delete(handler);
  }

  onFriendStatusList(handler: FriendStatusListHandler): () => void {
    this.listeners.friendStatusList.add(handler);
    return () => this.listeners.friendStatusList.delete(handler);
  }

  onNotification(handler: NotificationHandler): () => void {
    this.listeners.notification.add(handler);
    return () => this.listeners.notification.delete(handler);
  }

  onNotificationUpdate(handler: NotificationUpdateHandler): () => void {
    this.listeners.notificationUpdate.add(handler);
    return () => this.listeners.notificationUpdate.delete(handler);
  }

  onDirectMessage(handler: DirectMessageHandler): () => void {
    this.listeners.directMessage.add(handler);
    return () => this.listeners.directMessage.delete(handler);
  }

  onDmTyping(handler: DmTypingHandler): () => void {
    this.listeners.dmTyping.add(handler);
    return () => this.listeners.dmTyping.delete(handler);
  }

  onDmStopTyping(handler: DmTypingHandler): () => void {
    this.listeners.dmStopTyping.add(handler);
    return () => this.listeners.dmStopTyping.delete(handler);
  }

  onDmRead(handler: DmReadHandler): () => void {
    this.listeners.dmRead.add(handler);
    return () => this.listeners.dmRead.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.listeners.error.add(handler);
    return () => this.listeners.error.delete(handler);
  }

  /**
   * Remove all event listeners (useful for cleanup)
   */
  removeAllListeners(): void {
    Object.values(this.listeners).forEach((set) => set.clear());
  }
}

export const socketService = new SocketService();
