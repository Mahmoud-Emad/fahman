/**
 * Room Socket Handler Unit Tests
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
  isReady: false,
  score: 0,
  role: 'MEMBER',
  room: {
    members: [
      {
        user: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
        score: 0,
        isReady: false,
        role: 'MEMBER',
      },
      {
        user: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: null },
        score: 100,
        isReady: true,
        role: 'CREATOR',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockRoomMemberFindFirst = mock(() => Promise.resolve(mockMember));
const mockRoomMemberUpdate = mock(() => Promise.resolve({}));
const mockRoomMemberUpdateMany = mock(() => Promise.resolve({ count: 1 }));

mock.module('../../config/database', () => ({
  prisma: {
    roomMember: {
      findFirst: mockRoomMemberFindFirst,
      update: mockRoomMemberUpdate,
      updateMany: mockRoomMemberUpdateMany,
    },
  },
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
  registerRoomHandlers,
  broadcastRoomUpdate,
  broadcastRoomClosed,
  notifyPlayerKicked,
} from '../../socket/handlers/roomHandlers';

// ---------------------------------------------------------------------------
// Socket/IO mock helpers
// ---------------------------------------------------------------------------

function createMockSocket(userId = 'user-1', username = 'alice') {
  const handlers = new Map<string, Function>();
  const emitted: Array<{ event: string; data: any }> = [];
  const joinedRooms: string[] = [];
  const leftRooms: string[] = [];
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
    join: mock((roomId: string) => {
      joinedRooms.push(roomId);
    }),
    leave: mock((roomId: string) => {
      leftRooms.push(roomId);
    }),
    to: mock((roomId: string) => ({
      emit: mock((event: string, data: any) => {
        toEmitted.push({ room: roomId, event, data });
      }),
    })),
    // Test helpers
    _handlers: handlers,
    _emitted: emitted,
    _joinedRooms: joinedRooms,
    _leftRooms: leftRooms,
    _toEmitted: toEmitted,
    _trigger: async (event: string, data: any) => {
      const handler = handlers.get(event);
      if (handler) await handler(data);
    },
  };
}

function createMockIO() {
  const toEmitted: Array<{ room: string; event: string; data: any }> = [];

  const io = {
    to: mock((roomId: string) => ({
      emit: mock((event: string, data: any) => {
        toEmitted.push({ room: roomId, event, data });
      }),
    })),
    sockets: {
      sockets: new Map<string, any>(),
    },
    _toEmitted: toEmitted,
  };

  return io;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Room Socket Handlers', () => {
  let socket: ReturnType<typeof createMockSocket>;
  let io: ReturnType<typeof createMockIO>;

  beforeEach(() => {
    socket = createMockSocket();
    io = createMockIO();
    mockRoomMemberFindFirst.mockReset();
    mockRoomMemberUpdate.mockReset();
    mockRoomMemberUpdateMany.mockReset();
    mockRoomMemberFindFirst.mockResolvedValue(mockMember as any);
    mockRoomMemberUpdate.mockResolvedValue({} as any);
    mockRoomMemberUpdateMany.mockResolvedValue({ count: 1 } as any);
  });

  describe('registerRoomHandlers', () => {
    it('should register room:join, room:leave, and room:ready handlers', () => {
      registerRoomHandlers(io as any, socket as any);

      expect(socket.on).toHaveBeenCalledTimes(3);
      expect(socket._handlers.has('room:join')).toBe(true);
      expect(socket._handlers.has('room:leave')).toBe(true);
      expect(socket._handlers.has('room:ready')).toBe(true);
    });
  });

  // =========================================================================
  // room:join
  // =========================================================================
  describe('room:join', () => {
    beforeEach(() => {
      registerRoomHandlers(io as any, socket as any);
    });

    it('should emit error when user is not a room member', async () => {
      mockRoomMemberFindFirst.mockResolvedValue(null);

      await socket._trigger('room:join', { roomId: 'room-1' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('You are not a member of this room');
    });

    it('should join socket room when user is a valid member', async () => {
      await socket._trigger('room:join', { roomId: 'room-1' });

      expect(socket.join).toHaveBeenCalledWith('room-1');
      expect(socket.roomIds.has('room-1')).toBe(true);
    });

    it('should update lastSeenAt in database', async () => {
      await socket._trigger('room:join', { roomId: 'room-1' });

      expect(mockRoomMemberUpdate).toHaveBeenCalled();
      const call = mockRoomMemberUpdate.mock.calls[0];
      expect(call[0].where.id).toBe('member-1');
      expect(call[0].data.lastSeenAt).toBeInstanceOf(Date);
    });

    it('should emit room:joined to the joining user with member list', async () => {
      await socket._trigger('room:join', { roomId: 'room-1' });

      const joinedEmit = socket._emitted.find((e) => e.event === 'room:joined');
      expect(joinedEmit).toBeDefined();
      expect(joinedEmit!.data.roomId).toBe('room-1');
      expect(joinedEmit!.data.members).toHaveLength(2);
      expect(joinedEmit!.data.members[0].id).toBe('user-1');
      expect(joinedEmit!.data.members[0].username).toBe('alice');
    });

    it('should broadcast room:playerJoined to other room members', async () => {
      await socket._trigger('room:join', { roomId: 'room-1' });

      const broadcastEmit = socket._toEmitted.find((e) => e.event === 'room:playerJoined');
      expect(broadcastEmit).toBeDefined();
      expect(broadcastEmit!.room).toBe('room-1');
      expect(broadcastEmit!.data.roomId).toBe('room-1');
      expect(broadcastEmit!.data.player.id).toBe('user-1');
    });

    it('should emit error on database failure', async () => {
      mockRoomMemberFindFirst.mockRejectedValue(new Error('DB error'));

      await socket._trigger('room:join', { roomId: 'room-1' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Failed to join room');
    });
  });

  // =========================================================================
  // room:leave
  // =========================================================================
  describe('room:leave', () => {
    beforeEach(() => {
      registerRoomHandlers(io as any, socket as any);
      socket.roomIds.add('room-1');
    });

    it('should leave the socket room', async () => {
      await socket._trigger('room:leave', { roomId: 'room-1' });

      expect(socket.leave).toHaveBeenCalledWith('room-1');
      expect(socket.roomIds.has('room-1')).toBe(false);
    });

    it('should update lastSeenAt in database', async () => {
      await socket._trigger('room:leave', { roomId: 'room-1' });

      expect(mockRoomMemberUpdateMany).toHaveBeenCalled();
      const call = mockRoomMemberUpdateMany.mock.calls[0];
      expect(call[0].where.roomId).toBe('room-1');
      expect(call[0].where.userId).toBe('user-1');
    });

    it('should emit room:left to the leaving user', async () => {
      await socket._trigger('room:leave', { roomId: 'room-1' });

      const leftEmit = socket._emitted.find((e) => e.event === 'room:left');
      expect(leftEmit).toBeDefined();
      expect(leftEmit!.data.roomId).toBe('room-1');
    });

    it('should broadcast room:playerLeft to other room members', async () => {
      await socket._trigger('room:leave', { roomId: 'room-1' });

      const broadcastEmit = socket._toEmitted.find((e) => e.event === 'room:playerLeft');
      expect(broadcastEmit).toBeDefined();
      expect(broadcastEmit!.room).toBe('room-1');
      expect(broadcastEmit!.data.playerId).toBe('user-1');
    });
  });

  // =========================================================================
  // room:ready
  // =========================================================================
  describe('room:ready', () => {
    beforeEach(() => {
      registerRoomHandlers(io as any, socket as any);
    });

    it('should update ready status in database', async () => {
      await socket._trigger('room:ready', { roomId: 'room-1', isReady: true });

      expect(mockRoomMemberUpdateMany).toHaveBeenCalled();
      const call = mockRoomMemberUpdateMany.mock.calls[0];
      expect(call[0].where.roomId).toBe('room-1');
      expect(call[0].where.userId).toBe('user-1');
      expect(call[0].data.isReady).toBe(true);
    });

    it('should broadcast room:playerReady to the entire room', async () => {
      await socket._trigger('room:ready', { roomId: 'room-1', isReady: true });

      const broadcast = io._toEmitted.find((e) => e.event === 'room:playerReady');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.playerId).toBe('user-1');
      expect(broadcast!.data.isReady).toBe(true);
    });

    it('should handle setting isReady to false', async () => {
      await socket._trigger('room:ready', { roomId: 'room-1', isReady: false });

      const call = mockRoomMemberUpdateMany.mock.calls[0];
      expect(call[0].data.isReady).toBe(false);

      const broadcast = io._toEmitted.find((e) => e.event === 'room:playerReady');
      expect(broadcast!.data.isReady).toBe(false);
    });

    it('should emit error on database failure', async () => {
      mockRoomMemberUpdateMany.mockRejectedValue(new Error('DB error'));

      await socket._trigger('room:ready', { roomId: 'room-1', isReady: true });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Failed to update ready status');
    });
  });

  // =========================================================================
  // Exported broadcast helpers
  // =========================================================================
  describe('broadcastRoomUpdate', () => {
    it('should emit room:updated to the room', () => {
      broadcastRoomUpdate(io as any, 'room-1', { status: 'PLAYING' });

      const broadcast = io._toEmitted.find((e) => e.event === 'room:updated');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.updates).toEqual({ status: 'PLAYING' });
    });
  });

  describe('broadcastRoomClosed', () => {
    it('should emit room:closed to the room', () => {
      broadcastRoomClosed(io as any, 'room-1', 'Host deleted the room');

      const broadcast = io._toEmitted.find((e) => e.event === 'room:closed');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.reason).toBe('Host deleted the room');
    });
  });

  describe('notifyPlayerKicked', () => {
    it('should emit room:kicked to the target user and remove from room', () => {
      const kickedSocket = createMockSocket('user-2', 'bob');
      kickedSocket.roomIds = new Set(['room-1']);
      io.sockets.sockets.set('socket-2', kickedSocket);

      notifyPlayerKicked(io as any, 'room-1', 'user-2', 'Bad behavior');

      // Kicked user should receive room:kicked
      const kickEmit = kickedSocket._emitted.find((e) => e.event === 'room:kicked');
      expect(kickEmit).toBeDefined();
      expect(kickEmit!.data.roomId).toBe('room-1');
      expect(kickEmit!.data.reason).toBe('Bad behavior');

      // Should leave the room
      expect(kickedSocket.leave).toHaveBeenCalledWith('room-1');
      expect(kickedSocket.roomIds.has('room-1')).toBe(false);
    });

    it('should broadcast room:playerLeft to remaining room members', () => {
      const kickedSocket = createMockSocket('user-2', 'bob');
      io.sockets.sockets.set('socket-2', kickedSocket);

      notifyPlayerKicked(io as any, 'room-1', 'user-2', 'Bad behavior');

      const broadcast = io._toEmitted.find((e) => e.event === 'room:playerLeft');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.playerId).toBe('user-2');
    });

    it('should not affect sockets of other users', () => {
      const otherSocket = createMockSocket('user-3', 'carol');
      io.sockets.sockets.set('socket-3', otherSocket);

      notifyPlayerKicked(io as any, 'room-1', 'user-2', 'Bad behavior');

      // Other user should not receive kick event
      expect(otherSocket._emitted).toHaveLength(0);
      expect(otherSocket.leave).not.toHaveBeenCalled();
    });
  });
});
