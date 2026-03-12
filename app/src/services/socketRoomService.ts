/**
 * Socket Room Service — room:join, room:leave, room:ready, room:kick events
 */

import type { Socket } from 'socket.io-client';
import type {
  SocketAccessor,
  SocketListeners,
  RoomJoinedHandler,
  RoomLeftHandler,
  PlayerJoinedHandler,
  PlayerLeftHandler,
  PlayerReadyHandler,
  RoomUpdatedHandler,
  RoomClosedHandler,
  RoomKickedHandler,
  RoomListUpdateHandler,
} from './socketTypes';

/**
 * Register socket.on handlers for room events
 */
export function setupRoomHandlers(socket: Socket, listeners: SocketListeners): void {
  socket.on('room:joined', (data) => {
    listeners.roomJoined.forEach((handler) => handler(data));
  });

  socket.on('room:left', (data) => {
    listeners.roomLeft.forEach((handler) => handler(data));
  });

  socket.on('room:playerJoined', (data) => {
    listeners.playerJoined.forEach((handler) => handler(data));
  });

  socket.on('room:playerLeft', (data) => {
    listeners.playerLeft.forEach((handler) => handler(data));
  });

  socket.on('room:playerReady', (data) => {
    listeners.playerReady.forEach((handler) => handler(data));
  });

  socket.on('room:updated', (data) => {
    listeners.roomUpdated.forEach((handler) => handler(data));
  });

  socket.on('room:closed', (data) => {
    listeners.roomClosed.forEach((handler) => handler(data));
  });

  socket.on('room:kicked', (data) => {
    listeners.roomKicked.forEach((handler) => handler(data));
  });

  socket.on('room:listUpdate', (data) => {
    listeners.roomListUpdate.forEach((handler) => handler(data));
  });
}

// ============================================
// Client → Server emitters
// ============================================

export function joinRoom(accessor: SocketAccessor, roomId: string): void {
  accessor.getSocket()?.emit('room:join', { roomId });
}

export function leaveRoom(accessor: SocketAccessor, roomId: string): void {
  accessor.getSocket()?.emit('room:leave', { roomId });
}

export function setReady(accessor: SocketAccessor, roomId: string, isReady: boolean): void {
  accessor.getSocket()?.emit('room:ready', { roomId, isReady });
}

// ============================================
// Subscription helpers
// ============================================

export function onRoomJoined(accessor: SocketAccessor, handler: RoomJoinedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.roomJoined.add(handler);
  return () => { listeners.roomJoined.delete(handler); };
}

export function onRoomLeft(accessor: SocketAccessor, handler: RoomLeftHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.roomLeft.add(handler);
  return () => { listeners.roomLeft.delete(handler); };
}

export function onPlayerJoined(accessor: SocketAccessor, handler: PlayerJoinedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.playerJoined.add(handler);
  return () => { listeners.playerJoined.delete(handler); };
}

export function onPlayerLeft(accessor: SocketAccessor, handler: PlayerLeftHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.playerLeft.add(handler);
  return () => { listeners.playerLeft.delete(handler); };
}

export function onPlayerReady(accessor: SocketAccessor, handler: PlayerReadyHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.playerReady.add(handler);
  return () => { listeners.playerReady.delete(handler); };
}

export function onRoomUpdated(accessor: SocketAccessor, handler: RoomUpdatedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.roomUpdated.add(handler);
  return () => { listeners.roomUpdated.delete(handler); };
}

export function onRoomClosed(accessor: SocketAccessor, handler: RoomClosedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.roomClosed.add(handler);
  return () => { listeners.roomClosed.delete(handler); };
}

export function onRoomKicked(accessor: SocketAccessor, handler: RoomKickedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.roomKicked.add(handler);
  return () => { listeners.roomKicked.delete(handler); };
}

export function onRoomListUpdate(accessor: SocketAccessor, handler: RoomListUpdateHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.roomListUpdate.add(handler);
  return () => { listeners.roomListUpdate.delete(handler); };
}
