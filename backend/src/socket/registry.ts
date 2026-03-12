/**
 * Socket Registry
 * Clean, typed interface for emitting socket events.
 * Replaces the 15 facade functions in socket/index.ts.
 */

import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  DirectMessage,
  NotificationData,
  RoomInfo,
} from './types';
import { broadcastRoomClosed, notifyPlayerKicked } from './handlers/roomHandlers';
import { broadcastGameStarted, cleanupGameRoom } from './handlers/gameHandlers';
import { emitDirectMessage } from './handlers/dmHandlers';
import { isUserOnline as checkUserOnline } from './presenceHandlers';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketRegistry {
  constructor(private io: IO) {}

  /**
   * Get the raw io instance (for handler registration)
   */
  getIO(): IO {
    return this.io;
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  sendNotificationToUser(userId: string, notification: NotificationData): void {
    this.io.to(`user:${userId}`).emit('notification:new', notification);
  }

  sendNotificationUpdate(userId: string, data: { id: string; actionTaken: string }): void {
    this.io.to(`user:${userId}`).emit('notification:updated', data);
  }

  // ---------------------------------------------------------------------------
  // Room events
  // ---------------------------------------------------------------------------

  emitRoomClosed(roomId: string, reason: string): void {
    broadcastRoomClosed(this.io, roomId, reason);
    cleanupGameRoom(roomId);
  }

  emitRoomListUpdate(roomId: string, currentPlayers: number, status: string): void {
    this.io.emit('room:listUpdate', { roomId, currentPlayers, status });
  }

  emitPlayerLeft(roomId: string, userId: string): void {
    this.io.to(roomId).emit('room:playerLeft', { roomId, playerId: userId });
  }

  emitPlayerKicked(roomId: string, userId: string, reason: string): void {
    notifyPlayerKicked(this.io, roomId, userId, reason);
  }

  emitPlayerJoined(roomId: string, player: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
    isReady: boolean;
    role: string;
  }): void {
    this.io.to(roomId).emit('room:playerJoined', { roomId, player });
  }

  emitRoomUpdated(roomId: string, updates: Partial<RoomInfo>): void {
    this.io.to(roomId).emit('room:updated', { roomId, updates });
  }

  emitPlayerReady(roomId: string, playerId: string, isReady: boolean): void {
    this.io.to(roomId).emit('room:playerReady', { roomId, playerId, isReady });
  }

  // ---------------------------------------------------------------------------
  // Game events
  // ---------------------------------------------------------------------------

  emitGameStarted(roomId: string): void {
    broadcastGameStarted(this.io, roomId);
  }

  // ---------------------------------------------------------------------------
  // Messaging
  // ---------------------------------------------------------------------------

  emitDmMessage(recipientId: string, message: DirectMessage): void {
    emitDirectMessage(this.io, recipientId, message);
  }

  // ---------------------------------------------------------------------------
  // Presence
  // ---------------------------------------------------------------------------

  async isUserOnline(userId: string): Promise<boolean> {
    return checkUserOnline(userId);
  }

  async emitFriendshipAccepted(userId: string, friendId: string): Promise<void> {
    const [userOnline, friendOnline] = await Promise.all([
      checkUserOnline(userId),
      checkUserOnline(friendId),
    ]);

    if (userOnline) {
      this.io.to(`user:${friendId}`).emit('friend:online', { userId });
    }
    if (friendOnline) {
      this.io.to(`user:${userId}`).emit('friend:online', { userId: friendId });
    }
  }
}
