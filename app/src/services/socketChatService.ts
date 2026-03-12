/**
 * Socket Chat Service — chat:message, chat:typing, dm:message, dm:typing events
 */

import type { Socket } from 'socket.io-client';
import type {
  SocketAccessor,
  SocketListeners,
  ChatMessageHandler,
  ChatTypingHandler,
  DirectMessageHandler,
  DmTypingHandler,
  DmReadHandler,
} from './socketTypes';

/**
 * Register socket.on handlers for chat and DM events
 */
export function setupChatHandlers(socket: Socket, listeners: SocketListeners): void {
  // Room chat
  socket.on('chat:message', (data) => {
    listeners.chatMessage.forEach((handler) => handler(data));
  });

  socket.on('chat:typing', (data) => {
    listeners.chatTyping.forEach((handler) => handler(data));
  });

  socket.on('chat:stopTyping', (data) => {
    listeners.chatStopTyping.forEach((handler) => handler(data));
  });

  // Direct messages
  socket.on('dm:message', (data) => {
    listeners.directMessage.forEach((handler) => handler(data));
  });

  socket.on('dm:typing', (data) => {
    listeners.dmTyping.forEach((handler) => handler(data));
  });

  socket.on('dm:stopTyping', (data) => {
    listeners.dmStopTyping.forEach((handler) => handler(data));
  });

  socket.on('dm:read', (data) => {
    listeners.dmRead.forEach((handler) => handler(data));
  });
}

// ============================================
// Client → Server emitters
// ============================================

export function sendChatMessage(accessor: SocketAccessor, roomId: string, text: string): void {
  accessor.getSocket()?.emit('chat:message', { roomId, text });
}

export function sendChatTyping(accessor: SocketAccessor, roomId: string): void {
  accessor.getSocket()?.emit('chat:typing', { roomId });
}

export function sendChatStopTyping(accessor: SocketAccessor, roomId: string): void {
  accessor.getSocket()?.emit('chat:stopTyping', { roomId });
}

export function sendDirectMessage(accessor: SocketAccessor, recipientId: string, text: string): void {
  accessor.getSocket()?.emit('dm:send', { recipientId, text });
}

export function sendDmTyping(accessor: SocketAccessor, recipientId: string): void {
  accessor.getSocket()?.emit('dm:typing', { recipientId });
}

export function sendDmStopTyping(accessor: SocketAccessor, recipientId: string): void {
  accessor.getSocket()?.emit('dm:stopTyping', { recipientId });
}

export function markDmAsRead(accessor: SocketAccessor, senderId: string): void {
  accessor.getSocket()?.emit('dm:read', { senderId });
}

// ============================================
// Subscription helpers
// ============================================

export function onChatMessage(accessor: SocketAccessor, handler: ChatMessageHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.chatMessage.add(handler);
  return () => { listeners.chatMessage.delete(handler); };
}

export function onChatTyping(accessor: SocketAccessor, handler: ChatTypingHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.chatTyping.add(handler);
  return () => { listeners.chatTyping.delete(handler); };
}

export function onChatStopTyping(accessor: SocketAccessor, handler: ChatTypingHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.chatStopTyping.add(handler);
  return () => { listeners.chatStopTyping.delete(handler); };
}

export function onDirectMessage(accessor: SocketAccessor, handler: DirectMessageHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.directMessage.add(handler);
  return () => { listeners.directMessage.delete(handler); };
}

export function onDmTyping(accessor: SocketAccessor, handler: DmTypingHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.dmTyping.add(handler);
  return () => { listeners.dmTyping.delete(handler); };
}

export function onDmStopTyping(accessor: SocketAccessor, handler: DmTypingHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.dmStopTyping.add(handler);
  return () => { listeners.dmStopTyping.delete(handler); };
}

export function onDmRead(accessor: SocketAccessor, handler: DmReadHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.dmRead.add(handler);
  return () => { listeners.dmRead.delete(handler); };
}
