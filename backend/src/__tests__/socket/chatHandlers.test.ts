/**
 * Chat Socket Handler Unit Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockMember = {
  id: 'member-1',
  userId: 'user-1',
  roomId: 'room-1',
  isActive: true,
  user: {
    username: 'alice',
    displayName: 'Alice',
    avatar: 'avatar-url',
  },
};

const mockSavedMessage = {
  id: 'msg-1',
  senderId: 'user-1',
  roomId: 'room-1',
  text: 'Hello room!',
  messageType: 'ROOM',
  createdAt: new Date('2026-01-15T10:00:00Z'),
};

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockRoomMemberFindFirst = mock(() => Promise.resolve(mockMember));
const mockMessageCreate = mock(() => Promise.resolve(mockSavedMessage));

mock.module('../../config/database', () => ({
  prisma: {
    roomMember: {
      findFirst: mockRoomMemberFindFirst,
    },
    message: {
      create: mockMessageCreate,
    },
  },
}));

// Redis mock
const mockRedisSet = mock(() => Promise.resolve('OK'));
const mockRedisDel = mock(() => Promise.resolve(1));
const mockRedisKeys = mock(() => Promise.resolve([]));

mock.module('../../config/redis', () => ({
  getRedis: () => ({
    set: mockRedisSet,
    del: mockRedisDel,
    keys: mockRedisKeys,
  }),
  connectRedis: () => Promise.resolve({}),
  disconnectRedis: () => Promise.resolve(),
}));

mock.module('../../shared/utils/logger', () => ({
  default: {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
  },
}));

// Import after mocking
import {
  registerChatHandlers,
  broadcastSystemMessage,
  cleanupUserTyping,
} from '@/socket/handlers/chatHandlers';

// ---------------------------------------------------------------------------
// Socket/IO mock helpers
// ---------------------------------------------------------------------------

function createMockSocket(userId = 'user-1', username = 'alice') {
  const handlers = new Map<string, Function>();
  const emitted: Array<{ event: string; data: any }> = [];
  const toEmitted: Array<{ room: string; event: string; data: any }> = [];

  return {
    userId,
    username,
    roomIds: new Set<string>(),
    on: mock((event: string, handler: Function) => {
      handlers.set(event, handler);
    }),
    emit: mock((event: string, data: any) => {
      emitted.push({ event, data });
    }),
    to: mock((roomId: string) => ({
      emit: mock((event: string, data: any) => {
        toEmitted.push({ room: roomId, event, data });
      }),
    })),
    _handlers: handlers,
    _emitted: emitted,
    _toEmitted: toEmitted,
    _trigger: async (event: string, data: any) => {
      const handler = handlers.get(event);
      if (handler) await handler(data);
    },
  };
}

function createMockIO() {
  const toEmitted: Array<{ room: string; event: string; data: any }> = [];

  return {
    to: mock((roomId: string) => ({
      emit: mock((event: string, data: any) => {
        toEmitted.push({ room: roomId, event, data });
      }),
    })),
    _toEmitted: toEmitted,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Chat Socket Handlers', () => {
  let socket: ReturnType<typeof createMockSocket>;
  let io: ReturnType<typeof createMockIO>;

  beforeEach(() => {
    socket = createMockSocket();
    io = createMockIO();
    mockRoomMemberFindFirst.mockReset();
    mockMessageCreate.mockReset();
    mockRoomMemberFindFirst.mockResolvedValue(mockMember as any);
    mockMessageCreate.mockResolvedValue(mockSavedMessage as any);
  });

  describe('registerChatHandlers', () => {
    it('should register chat:message, chat:typing, and chat:stopTyping handlers', () => {
      registerChatHandlers(io as any, socket as any);

      expect(socket.on).toHaveBeenCalledTimes(3);
      expect(socket._handlers.has('chat:message')).toBe(true);
      expect(socket._handlers.has('chat:typing')).toBe(true);
      expect(socket._handlers.has('chat:stopTyping')).toBe(true);
    });
  });

  // =========================================================================
  // chat:message
  // =========================================================================
  describe('chat:message', () => {
    beforeEach(() => {
      registerChatHandlers(io as any, socket as any);
    });

    it('should emit error when user is not a room member', async () => {
      mockRoomMemberFindFirst.mockResolvedValue(null);

      await socket._trigger('chat:message', { roomId: 'room-1', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('You are not in this room');
    });

    it('should emit error when text is empty', async () => {
      await socket._trigger('chat:message', { roomId: 'room-1', text: '' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Message cannot be empty');
    });

    it('should emit error when text is whitespace only', async () => {
      await socket._trigger('chat:message', { roomId: 'room-1', text: '   ' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Message cannot be empty');
    });

    it('should emit error when text exceeds 500 characters', async () => {
      const longText = 'a'.repeat(501);

      await socket._trigger('chat:message', { roomId: 'room-1', text: longText });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Message too long (max 500 characters)');
    });

    it('should save message to database with correct data', async () => {
      await socket._trigger('chat:message', { roomId: 'room-1', text: 'Hello room!' });

      expect(mockMessageCreate).toHaveBeenCalled();
      const call = mockMessageCreate.mock.calls[0];
      expect(call[0].data.senderId).toBe('user-1');
      expect(call[0].data.roomId).toBe('room-1');
      expect(call[0].data.text).toBe('Hello room!');
      expect(call[0].data.messageType).toBe('ROOM');
    });

    it('should trim whitespace from message text', async () => {
      await socket._trigger('chat:message', { roomId: 'room-1', text: '  Hello!  ' });

      const call = mockMessageCreate.mock.calls[0];
      expect(call[0].data.text).toBe('Hello!');
    });

    it('should broadcast chat:message to the room with correct payload', async () => {
      await socket._trigger('chat:message', { roomId: 'room-1', text: 'Hello room!' });

      const broadcast = io._toEmitted.find((e) => e.event === 'chat:message');
      expect(broadcast).toBeDefined();
      expect(broadcast!.room).toBe('room-1');
      expect(broadcast!.data.id).toBe('msg-1');
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.senderId).toBe('user-1');
      expect(broadcast!.data.senderName).toBe('Alice');
      expect(broadcast!.data.senderAvatar).toBe('avatar-url');
      expect(broadcast!.data.text).toBe('Hello room!');
      expect(broadcast!.data.type).toBe('ROOM');
    });

    it('should fall back to username when displayName is null', async () => {
      mockRoomMemberFindFirst.mockResolvedValue({
        ...mockMember,
        user: { username: 'alice', displayName: null, avatar: null },
      } as any);

      await socket._trigger('chat:message', { roomId: 'room-1', text: 'Hi' });

      const broadcast = io._toEmitted.find((e) => e.event === 'chat:message');
      expect(broadcast!.data.senderName).toBe('alice');
    });

    it('should emit error on database failure', async () => {
      mockMessageCreate.mockRejectedValue(new Error('DB error'));

      await socket._trigger('chat:message', { roomId: 'room-1', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Failed to send message');
    });
  });

  // =========================================================================
  // chat:typing
  // =========================================================================
  describe('chat:typing', () => {
    beforeEach(() => {
      registerChatHandlers(io as any, socket as any);
    });

    it('should broadcast chat:typing to other room members', async () => {
      await socket._handlers.get('chat:typing')!({ roomId: 'room-1' });

      const broadcast = socket._toEmitted.find((e) => e.event === 'chat:typing');
      expect(broadcast).toBeDefined();
      expect(broadcast!.room).toBe('room-1');
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.userId).toBe('user-1');
      expect(broadcast!.data.username).toBe('alice');
    });
  });

  // =========================================================================
  // chat:stopTyping
  // =========================================================================
  describe('chat:stopTyping', () => {
    beforeEach(() => {
      registerChatHandlers(io as any, socket as any);
    });

    it('should broadcast chat:stopTyping to other room members', async () => {
      await socket._handlers.get('chat:stopTyping')!({ roomId: 'room-1' });

      const broadcast = socket._toEmitted.find((e) => e.event === 'chat:stopTyping');
      expect(broadcast).toBeDefined();
      expect(broadcast!.room).toBe('room-1');
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.userId).toBe('user-1');
    });
  });

  // =========================================================================
  // broadcastSystemMessage
  // =========================================================================
  describe('broadcastSystemMessage', () => {
    it('should save a system message to the database', async () => {
      await broadcastSystemMessage(io as any, 'room-1', 'Game started!');

      expect(mockMessageCreate).toHaveBeenCalled();
      const call = mockMessageCreate.mock.calls[0];
      expect(call[0].data.senderId).toBe('system');
      expect(call[0].data.roomId).toBe('room-1');
      expect(call[0].data.text).toBe('Game started!');
      expect(call[0].data.messageType).toBe('SYSTEM');
    });

    it('should broadcast the system message to the room', async () => {
      await broadcastSystemMessage(io as any, 'room-1', 'Game started!');

      const broadcast = io._toEmitted.find((e) => e.event === 'chat:message');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.senderId).toBe('system');
      expect(broadcast!.data.senderName).toBe('System');
      expect(broadcast!.data.senderAvatar).toBeNull();
      expect(broadcast!.data.type).toBe('SYSTEM');
    });
  });

  // =========================================================================
  // cleanupUserTyping
  // =========================================================================
  describe('cleanupUserTyping', () => {
    it('should not throw when cleaning up user with no typing status', () => {
      expect(() => cleanupUserTyping('user-unknown')).not.toThrow();
    });
  });
});
