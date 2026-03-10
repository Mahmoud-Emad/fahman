/**
 * DM Socket Handler Unit Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRecipient = { id: 'user-2', username: 'bob', isActive: true };
const mockSender = { username: 'alice', displayName: 'Alice', avatar: 'alice-avatar' };

const mockBlockedFriendship = {
  id: 'f-1',
  userId: 'user-1',
  friendId: 'user-2',
  status: 'BLOCKED',
};

const mockAcceptedFriendship = {
  id: 'f-2',
  userId: 'user-1',
  friendId: 'user-2',
  status: 'ACCEPTED',
};

const mockSavedMessage = {
  id: 'dm-1',
  senderId: 'user-1',
  recipientId: 'user-2',
  text: 'Hey Bob!',
  messageType: 'PRIVATE',
  createdAt: new Date('2026-01-15T12:00:00Z'),
};

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockUserFindUnique = mock(() => Promise.resolve(mockRecipient));
const mockFriendshipFindFirst = mock(() => Promise.resolve(null));
const mockMessageCreate = mock(() => Promise.resolve(mockSavedMessage));
const mockMessageUpdateMany = mock(() => Promise.resolve({ count: 3 }));

// We need separate mock calls for blocked check vs friendship check
// The DM handler calls findFirst twice: once for blocked, once for accepted
let friendshipCallCount = 0;

mock.module('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
    },
    friendship: {
      findFirst: mockFriendshipFindFirst,
    },
    message: {
      create: mockMessageCreate,
      updateMany: mockMessageUpdateMany,
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
  registerDmHandlers,
  cleanupUserDmTyping,
  emitDirectMessage,
} from '../../socket/handlers/dmHandlers';

// ---------------------------------------------------------------------------
// Socket/IO mock helpers
// ---------------------------------------------------------------------------

function createMockSocket(userId = 'user-1', username = 'alice') {
  const handlers = new Map<string, Function>();
  const emitted: Array<{ event: string; data: any }> = [];

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
    to: mock(() => ({
      emit: mock(() => {}),
    })),
    _handlers: handlers,
    _emitted: emitted,
    _trigger: async (event: string, data: any) => {
      const handler = handlers.get(event);
      if (handler) await handler(data);
    },
  };
}

function createMockIO() {
  const allSocketEmits: Map<string, Array<{ event: string; data: any }>> = new Map();

  const io = {
    to: mock(() => ({
      emit: mock(() => {}),
    })),
    sockets: {
      sockets: new Map<string, any>(),
    },
    _addSocket: (socketId: string, socket: any) => {
      io.sockets.sockets.set(socketId, socket);
    },
  };

  return io;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DM Socket Handlers', () => {
  let socket: ReturnType<typeof createMockSocket>;
  let io: ReturnType<typeof createMockIO>;

  beforeEach(() => {
    socket = createMockSocket();
    io = createMockIO();
    friendshipCallCount = 0;

    mockUserFindUnique.mockReset();
    mockFriendshipFindFirst.mockReset();
    mockMessageCreate.mockReset();
    mockMessageUpdateMany.mockReset();

    mockUserFindUnique.mockResolvedValue(mockRecipient as any);
    // Default: no blocked, then accepted
    mockFriendshipFindFirst
      .mockResolvedValueOnce(null) // blocked check returns null (not blocked)
      .mockResolvedValueOnce(mockAcceptedFriendship as any); // friendship check returns accepted
    mockMessageCreate.mockResolvedValue(mockSavedMessage as any);
    mockMessageUpdateMany.mockResolvedValue({ count: 3 } as any);
  });

  describe('registerDmHandlers', () => {
    it('should register dm:send, dm:typing, dm:stopTyping, and dm:read handlers', () => {
      registerDmHandlers(io as any, socket as any);

      expect(socket.on).toHaveBeenCalledTimes(4);
      expect(socket._handlers.has('dm:send')).toBe(true);
      expect(socket._handlers.has('dm:typing')).toBe(true);
      expect(socket._handlers.has('dm:stopTyping')).toBe(true);
      expect(socket._handlers.has('dm:read')).toBe(true);
    });
  });

  // =========================================================================
  // dm:send
  // =========================================================================
  describe('dm:send', () => {
    beforeEach(() => {
      // Also mock sender lookup (4th prisma call in dm:send)
      mockUserFindUnique
        .mockResolvedValueOnce(mockRecipient as any) // recipient lookup
        .mockResolvedValueOnce(mockSender as any); // sender lookup
      registerDmHandlers(io as any, socket as any);
    });

    it('should emit error when recipient does not exist', async () => {
      mockUserFindUnique.mockReset();
      mockUserFindUnique.mockResolvedValue(null);

      await socket._trigger('dm:send', { recipientId: 'user-unknown', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Recipient not found');
    });

    it('should emit error when recipient is inactive', async () => {
      mockUserFindUnique.mockReset();
      mockUserFindUnique.mockResolvedValue({ id: 'user-2', username: 'bob', isActive: false } as any);

      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Recipient not found');
    });

    it('should emit error when users are blocked', async () => {
      mockFriendshipFindFirst.mockReset();
      mockFriendshipFindFirst.mockResolvedValueOnce(mockBlockedFriendship as any);

      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Cannot message this user');
    });

    it('should emit error when users are not friends', async () => {
      mockFriendshipFindFirst.mockReset();
      mockFriendshipFindFirst
        .mockResolvedValueOnce(null) // not blocked
        .mockResolvedValueOnce(null); // not friends either

      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('You can only message friends');
    });

    it('should emit error when text is empty', async () => {
      await socket._trigger('dm:send', { recipientId: 'user-2', text: '' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Message cannot be empty');
    });

    it('should emit error when text exceeds 2000 characters', async () => {
      const longText = 'x'.repeat(2001);

      await socket._trigger('dm:send', { recipientId: 'user-2', text: longText });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Message too long (max 2000 characters)');
    });

    it('should save message to database', async () => {
      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hey Bob!' });

      expect(mockMessageCreate).toHaveBeenCalled();
      const call = mockMessageCreate.mock.calls[0];
      expect(call[0].data.senderId).toBe('user-1');
      expect(call[0].data.recipientId).toBe('user-2');
      expect(call[0].data.text).toBe('Hey Bob!');
      expect(call[0].data.messageType).toBe('PRIVATE');
    });

    it('should trim whitespace from message text', async () => {
      await socket._trigger('dm:send', { recipientId: 'user-2', text: '  Hey!  ' });

      const call = mockMessageCreate.mock.calls[0];
      expect(call[0].data.text).toBe('Hey!');
    });

    it('should send dm:message to sender for confirmation', async () => {
      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hey Bob!' });

      const senderEmit = socket._emitted.find((e) => e.event === 'dm:message');
      expect(senderEmit).toBeDefined();
      expect(senderEmit!.data.id).toBe('dm-1');
      expect(senderEmit!.data.senderId).toBe('user-1');
      expect(senderEmit!.data.recipientId).toBe('user-2');
      expect(senderEmit!.data.text).toBe('Hey Bob!');
      expect(senderEmit!.data.type).toBe('PRIVATE');
    });

    it('should send dm:message to recipient socket', async () => {
      const recipientSocket = createMockSocket('user-2', 'bob');
      io._addSocket('socket-2', recipientSocket);

      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hey Bob!' });

      const recipientEmit = recipientSocket._emitted.find((e) => e.event === 'dm:message');
      expect(recipientEmit).toBeDefined();
      expect(recipientEmit!.data.senderId).toBe('user-1');
      expect(recipientEmit!.data.text).toBe('Hey Bob!');
    });

    it('should not send to sockets of other users', async () => {
      const otherSocket = createMockSocket('user-3', 'carol');
      io._addSocket('socket-3', otherSocket);

      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hey Bob!' });

      expect(otherSocket._emitted.filter((e) => e.event === 'dm:message')).toHaveLength(0);
    });

    it('should emit error on database failure', async () => {
      mockMessageCreate.mockRejectedValue(new Error('DB error'));

      await socket._trigger('dm:send', { recipientId: 'user-2', text: 'Hello' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Failed to send message');
    });
  });

  // =========================================================================
  // dm:typing
  // =========================================================================
  describe('dm:typing', () => {
    beforeEach(() => {
      mockUserFindUnique.mockReset();
      mockUserFindUnique.mockResolvedValue(mockSender as any);
      registerDmHandlers(io as any, socket as any);
    });

    it('should send dm:typing to the recipient socket', async () => {
      const recipientSocket = createMockSocket('user-2', 'bob');
      io._addSocket('socket-2', recipientSocket);

      await socket._trigger('dm:typing', { recipientId: 'user-2' });

      const typingEmit = recipientSocket._emitted.find((e) => e.event === 'dm:typing');
      expect(typingEmit).toBeDefined();
      expect(typingEmit!.data.senderId).toBe('user-1');
      expect(typingEmit!.data.senderName).toBe('Alice');
    });

    it('should not send typing to other users', async () => {
      const otherSocket = createMockSocket('user-3', 'carol');
      io._addSocket('socket-3', otherSocket);

      await socket._trigger('dm:typing', { recipientId: 'user-2' });

      expect(otherSocket._emitted.filter((e) => e.event === 'dm:typing')).toHaveLength(0);
    });
  });

  // =========================================================================
  // dm:stopTyping
  // =========================================================================
  describe('dm:stopTyping', () => {
    beforeEach(() => {
      registerDmHandlers(io as any, socket as any);
    });

    it('should send dm:stopTyping to the recipient socket', async () => {
      const recipientSocket = createMockSocket('user-2', 'bob');
      io._addSocket('socket-2', recipientSocket);

      await socket._handlers.get('dm:stopTyping')!({ recipientId: 'user-2' });

      const stopEmit = recipientSocket._emitted.find((e) => e.event === 'dm:stopTyping');
      expect(stopEmit).toBeDefined();
      expect(stopEmit!.data.senderId).toBe('user-1');
    });

    it('should not notify other users', async () => {
      const otherSocket = createMockSocket('user-3', 'carol');
      io._addSocket('socket-3', otherSocket);

      await socket._handlers.get('dm:stopTyping')!({ recipientId: 'user-2' });

      expect(otherSocket._emitted.filter((e) => e.event === 'dm:stopTyping')).toHaveLength(0);
    });
  });

  // =========================================================================
  // dm:read
  // =========================================================================
  describe('dm:read', () => {
    beforeEach(() => {
      registerDmHandlers(io as any, socket as any);
    });

    it('should mark messages as read in the database', async () => {
      await socket._trigger('dm:read', { senderId: 'user-2' });

      expect(mockMessageUpdateMany).toHaveBeenCalled();
      const call = mockMessageUpdateMany.mock.calls[0];
      expect(call[0].where.senderId).toBe('user-2');
      expect(call[0].where.recipientId).toBe('user-1');
      expect(call[0].where.messageType).toBe('PRIVATE');
      expect(call[0].where.isRead).toBe(false);
      expect(call[0].data.isRead).toBe(true);
    });

    it('should notify the sender that their messages were read', async () => {
      const senderSocket = createMockSocket('user-2', 'bob');
      io._addSocket('socket-2', senderSocket);

      await socket._trigger('dm:read', { senderId: 'user-2' });

      const readEmit = senderSocket._emitted.find((e) => e.event === 'dm:read');
      expect(readEmit).toBeDefined();
      expect(readEmit!.data.byUserId).toBe('user-1');
    });

    it('should not notify other users about read receipts', async () => {
      const otherSocket = createMockSocket('user-3', 'carol');
      io._addSocket('socket-3', otherSocket);

      await socket._trigger('dm:read', { senderId: 'user-2' });

      expect(otherSocket._emitted.filter((e) => e.event === 'dm:read')).toHaveLength(0);
    });
  });

  // =========================================================================
  // Exported helpers
  // =========================================================================
  describe('cleanupUserDmTyping', () => {
    it('should not throw when cleaning up user with no typing status', () => {
      expect(() => cleanupUserDmTyping('user-unknown')).not.toThrow();
    });
  });

  describe('emitDirectMessage', () => {
    it('should emit dm:message to the recipient socket', () => {
      const recipientSocket = createMockSocket('user-2', 'bob');
      io._addSocket('socket-2', recipientSocket);

      const message = {
        id: 'dm-5',
        senderId: 'user-1',
        senderName: 'Alice',
        senderAvatar: null,
        recipientId: 'user-2',
        text: 'Hello from HTTP',
        timestamp: new Date(),
        type: 'PRIVATE' as const,
      };

      emitDirectMessage(io as any, 'user-2', message);

      const dmEmit = recipientSocket._emitted.find((e) => e.event === 'dm:message');
      expect(dmEmit).toBeDefined();
      expect(dmEmit!.data.id).toBe('dm-5');
      expect(dmEmit!.data.text).toBe('Hello from HTTP');
    });

    it('should not emit to non-recipient sockets', () => {
      const otherSocket = createMockSocket('user-3', 'carol');
      io._addSocket('socket-3', otherSocket);

      const message = {
        id: 'dm-5',
        senderId: 'user-1',
        senderName: 'Alice',
        senderAvatar: null,
        recipientId: 'user-2',
        text: 'Hello',
        timestamp: new Date(),
        type: 'PRIVATE' as const,
      };

      emitDirectMessage(io as any, 'user-2', message);

      expect(otherSocket._emitted).toHaveLength(0);
    });
  });
});
