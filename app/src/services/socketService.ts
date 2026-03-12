/**
 * Socket Service
 * WebSocket connection management and event routing.
 *
 * Domain-specific handlers, emitters, and subscriptions live in:
 *   socketRoomService.ts, socketGameService.ts,
 *   socketChatService.ts, socketNotificationService.ts
 *
 * All types are re-exported from this file for backwards compatibility.
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config/env';
import { storage } from './storage';

// Domain modules
import { setupRoomHandlers } from './socketRoomService';
import { setupGameHandlers } from './socketGameService';
import { setupChatHandlers } from './socketChatService';
import { setupNotificationHandlers } from './socketNotificationService';

// Re-export every type so existing `import { … } from '@/services/socketService'` works
export type {
  RoomMemberInfo,
  RoomInfo,
  GameStartedData,
  QuestionData,
  QuestionResultsData,
  GameFinishedData,
  PlayerScore,
  ChatMessage,
  DirectMessage,
  NotificationData,
  NotificationUpdateData,
  ConnectionSuccessHandler,
  ConnectionErrorHandler,
  RoomJoinedHandler,
  RoomLeftHandler,
  PlayerJoinedHandler,
  PlayerLeftHandler,
  PlayerReadyHandler,
  RoomUpdatedHandler,
  RoomClosedHandler,
  RoomKickedHandler,
  RoomListUpdateHandler,
  GameStartedHandler,
  QuestionHandler,
  PlayerAnsweredHandler,
  QuestionResultsHandler,
  TimerTickHandler,
  GameFinishedHandler,
  ScoreUpdateHandler,
  ChatMessageHandler,
  ChatTypingHandler,
  FriendOnlineHandler,
  FriendOfflineHandler,
  FriendStatusListHandler,
  NotificationHandler,
  NotificationUpdateHandler,
  DirectMessageHandler,
  DmTypingHandler,
  DmReadHandler,
  ErrorHandler,
  SocketListeners,
  SocketAccessor,
} from './socketTypes';

import type {
  SocketListeners,
  SocketAccessor,
  ConnectionSuccessHandler,
  ConnectionErrorHandler,
  RoomJoinedHandler,
  RoomLeftHandler,
  PlayerJoinedHandler,
  PlayerLeftHandler,
  PlayerReadyHandler,
  RoomUpdatedHandler,
  RoomClosedHandler,
  RoomKickedHandler,
  RoomListUpdateHandler,
  GameStartedHandler,
  QuestionHandler,
  PlayerAnsweredHandler,
  QuestionResultsHandler,
  TimerTickHandler,
  GameFinishedHandler,
  ScoreUpdateHandler,
  ChatMessageHandler,
  ChatTypingHandler,
  FriendOnlineHandler,
  FriendOfflineHandler,
  FriendStatusListHandler,
  NotificationHandler,
  NotificationUpdateHandler,
  DirectMessageHandler,
  DmTypingHandler,
  DmReadHandler,
  ErrorHandler,
} from './socketTypes';

// Domain emitter / subscription imports (used in forwarding methods)
import * as room from './socketRoomService';
import * as game from './socketGameService';
import * as chat from './socketChatService';
import * as notif from './socketNotificationService';

class SocketService implements SocketAccessor {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  private listeners: SocketListeners = {
    connectionSuccess: new Set(),
    connectionError: new Set(),
    roomJoined: new Set(),
    roomLeft: new Set(),
    playerJoined: new Set(),
    playerLeft: new Set(),
    playerReady: new Set(),
    roomUpdated: new Set(),
    roomClosed: new Set(),
    roomKicked: new Set(),
    roomListUpdate: new Set(),
    gameStarted: new Set(),
    question: new Set(),
    playerAnswered: new Set(),
    questionResults: new Set(),
    timerTick: new Set(),
    gameFinished: new Set(),
    scoreUpdate: new Set(),
    chatMessage: new Set(),
    chatTyping: new Set(),
    chatStopTyping: new Set(),
    friendOnline: new Set(),
    friendOffline: new Set(),
    friendStatusList: new Set(),
    notification: new Set(),
    notificationUpdate: new Set(),
    directMessage: new Set(),
    dmTyping: new Set(),
    dmStopTyping: new Set(),
    dmRead: new Set(),
    error: new Set(),
    connect: new Set(),
    disconnect: new Set(),
  };

  // --- SocketAccessor interface ---
  getSocket(): Socket | null { return this.socket; }
  getListeners(): SocketListeners { return this.listeners; }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    try {
      const token = await storage.getAccessToken();
      if (!token) throw new Error('No authentication token available');

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

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events (kept in core — they are cross-cutting)
    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.listeners.connect.forEach((handler) => handler());
    });

    this.socket.on('disconnect', (reason) => {
      this.listeners.disconnect.forEach((handler) => handler(reason));
    });

    // Auth-related connect errors: the api interceptor may have already
    // refreshed the token. Re-read from storage and retry once.
    this.socket.on('connect_error', async (err) => {
      const isAuthError = err.message?.toLowerCase().includes('auth')
        || err.message?.toLowerCase().includes('token')
        || err.message?.toLowerCase().includes('unauthorized');

      if (isAuthError && this.socket) {
        const freshToken = await storage.getAccessToken();
        if (freshToken && this.socket.auth) {
          (this.socket.auth as Record<string, string>).token = freshToken;
          // Let socket.io's built-in reconnection handle the retry
        }
      }
    });

    this.socket.on('connection:success', (data) => {
      this.listeners.connectionSuccess.forEach((handler) => handler(data));
    });

    this.socket.on('connection:error', (data) => {
      this.listeners.connectionError.forEach((handler) => handler(data));
    });

    this.socket.on('error', (data) => {
      this.listeners.error.forEach((handler) => handler(data));
    });

    // Delegate domain-specific handlers
    setupRoomHandlers(this.socket, this.listeners);
    setupGameHandlers(this.socket, this.listeners);
    setupChatHandlers(this.socket, this.listeners);
    setupNotificationHandlers(this.socket, this.listeners);
  }

  // ============================================
  // Forwarding: Client → Server emitters
  // ============================================

  // Room
  joinRoom(roomId: string): void { room.joinRoom(this, roomId); }
  leaveRoom(roomId: string): void { room.leaveRoom(this, roomId); }
  setReady(roomId: string, isReady: boolean): void { room.setReady(this, roomId, isReady); }

  // Game
  submitAnswer(roomId: string, answer: string, betAmount: number): void {
    game.submitAnswer(this, roomId, answer, betAmount);
  }
  nextQuestion(roomId: string): void { game.nextQuestion(this, roomId); }

  // Chat
  sendChatMessage(roomId: string, text: string): void { chat.sendChatMessage(this, roomId, text); }
  sendChatTyping(roomId: string): void { chat.sendChatTyping(this, roomId); }
  sendChatStopTyping(roomId: string): void { chat.sendChatStopTyping(this, roomId); }
  sendDirectMessage(recipientId: string, text: string): void { chat.sendDirectMessage(this, recipientId, text); }
  sendDmTyping(recipientId: string): void { chat.sendDmTyping(this, recipientId); }
  sendDmStopTyping(recipientId: string): void { chat.sendDmStopTyping(this, recipientId); }
  markDmAsRead(senderId: string): void { chat.markDmAsRead(this, senderId); }

  // Notifications / Presence
  requestFriendStatuses(): void { notif.requestFriendStatuses(this); }

  // ============================================
  // Forwarding: Event subscriptions
  // ============================================

  // Connection (kept inline — only 4 events)
  onConnect(handler: () => void): () => void {
    this.listeners.connect.add(handler);
    return () => { this.listeners.connect.delete(handler); };
  }
  onDisconnect(handler: (reason: string) => void): () => void {
    this.listeners.disconnect.add(handler);
    return () => { this.listeners.disconnect.delete(handler); };
  }
  onConnectionSuccess(handler: ConnectionSuccessHandler): () => void {
    this.listeners.connectionSuccess.add(handler);
    return () => { this.listeners.connectionSuccess.delete(handler); };
  }
  onConnectionError(handler: ConnectionErrorHandler): () => void {
    this.listeners.connectionError.add(handler);
    return () => { this.listeners.connectionError.delete(handler); };
  }
  onError(handler: ErrorHandler): () => void {
    this.listeners.error.add(handler);
    return () => { this.listeners.error.delete(handler); };
  }

  // Room
  onRoomJoined(handler: RoomJoinedHandler): () => void { return room.onRoomJoined(this, handler); }
  onRoomLeft(handler: RoomLeftHandler): () => void { return room.onRoomLeft(this, handler); }
  onPlayerJoined(handler: PlayerJoinedHandler): () => void { return room.onPlayerJoined(this, handler); }
  onPlayerLeft(handler: PlayerLeftHandler): () => void { return room.onPlayerLeft(this, handler); }
  onPlayerReady(handler: PlayerReadyHandler): () => void { return room.onPlayerReady(this, handler); }
  onRoomUpdated(handler: RoomUpdatedHandler): () => void { return room.onRoomUpdated(this, handler); }
  onRoomClosed(handler: RoomClosedHandler): () => void { return room.onRoomClosed(this, handler); }
  onRoomKicked(handler: RoomKickedHandler): () => void { return room.onRoomKicked(this, handler); }
  onRoomListUpdate(handler: RoomListUpdateHandler): () => void { return room.onRoomListUpdate(this, handler); }

  // Game
  onGameStarted(handler: GameStartedHandler): () => void { return game.onGameStarted(this, handler); }
  onQuestion(handler: QuestionHandler): () => void { return game.onQuestion(this, handler); }
  onPlayerAnswered(handler: PlayerAnsweredHandler): () => void { return game.onPlayerAnswered(this, handler); }
  onQuestionResults(handler: QuestionResultsHandler): () => void { return game.onQuestionResults(this, handler); }
  onTimerTick(handler: TimerTickHandler): () => void { return game.onTimerTick(this, handler); }
  onGameFinished(handler: GameFinishedHandler): () => void { return game.onGameFinished(this, handler); }
  onScoreUpdate(handler: ScoreUpdateHandler): () => void { return game.onScoreUpdate(this, handler); }

  // Chat
  onChatMessage(handler: ChatMessageHandler): () => void { return chat.onChatMessage(this, handler); }
  onChatTyping(handler: ChatTypingHandler): () => void { return chat.onChatTyping(this, handler); }
  onChatStopTyping(handler: ChatTypingHandler): () => void { return chat.onChatStopTyping(this, handler); }
  onDirectMessage(handler: DirectMessageHandler): () => void { return chat.onDirectMessage(this, handler); }
  onDmTyping(handler: DmTypingHandler): () => void { return chat.onDmTyping(this, handler); }
  onDmStopTyping(handler: DmTypingHandler): () => void { return chat.onDmStopTyping(this, handler); }
  onDmRead(handler: DmReadHandler): () => void { return chat.onDmRead(this, handler); }

  // Notifications / Presence
  onFriendOnline(handler: FriendOnlineHandler): () => void { return notif.onFriendOnline(this, handler); }
  onFriendOffline(handler: FriendOfflineHandler): () => void { return notif.onFriendOffline(this, handler); }
  onFriendStatusList(handler: FriendStatusListHandler): () => void { return notif.onFriendStatusList(this, handler); }
  onNotification(handler: NotificationHandler): () => void { return notif.onNotification(this, handler); }
  onNotificationUpdate(handler: NotificationUpdateHandler): () => void { return notif.onNotificationUpdate(this, handler); }

  /**
   * Remove all event listeners (useful for cleanup)
   */
  removeAllListeners(): void {
    Object.values(this.listeners).forEach((set) => set.clear());
  }
}

export const socketService = new SocketService();
