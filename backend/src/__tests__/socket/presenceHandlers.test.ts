/**
 * Presence Handlers Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const aliceBobFriendship = { userId: 'user-1', friendId: 'user-2' };
const aliceCarolFriendship = { userId: 'user-1', friendId: 'user-3' };

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockFriendshipFindMany = mock(() => Promise.resolve([aliceBobFriendship, aliceCarolFriendship]));

mock.module('../../config/database', () => ({
  prisma: {
    friendship: {
      findMany: mockFriendshipFindMany,
    },
  },
}));

mock.module('../../utils/logger', () => ({
  default: {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
  },
}));

// Import after mocking
import {
  onlineUsers,
  trackUserOnline,
  trackUserOffline,
  getOnlineFriends,
  notifyFriendsOnline,
  notifyFriendsOffline,
} from '../../socket/presenceHandlers';

// ---------------------------------------------------------------------------
// IO mock helper
// ---------------------------------------------------------------------------

function createMockSocket(userId: string) {
  const emitted: Array<{ event: string; data: any }> = [];
  return {
    userId,
    emit: mock((event: string, data: any) => {
      emitted.push({ event, data });
    }),
    _emitted: emitted,
  };
}

function createMockIO(sockets: Array<ReturnType<typeof createMockSocket>> = []) {
  const socketMap = new Map<string, any>();
  sockets.forEach((s, i) => socketMap.set(`socket-${i}`, s));

  return {
    sockets: {
      sockets: socketMap,
    },
    _addSocket: (socket: ReturnType<typeof createMockSocket>) => {
      socketMap.set(`socket-${socketMap.size}`, socket);
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Presence Handlers', () => {
  beforeEach(() => {
    // Clear online users between tests
    onlineUsers.clear();
    mockFriendshipFindMany.mockReset();
    mockFriendshipFindMany.mockResolvedValue([aliceBobFriendship, aliceCarolFriendship] as any);
  });

  // =========================================================================
  // trackUserOnline
  // =========================================================================
  describe('trackUserOnline', () => {
    it('should add user to onlineUsers set', () => {
      const io = createMockIO();

      trackUserOnline(io as any, 'user-1');

      expect(onlineUsers.has('user-1')).toBe(true);
    });

    it('should notify friends when a user comes online for the first time', async () => {
      const bobSocket = createMockSocket('user-2');
      const io = createMockIO([bobSocket]);

      trackUserOnline(io as any, 'user-1');

      // Give async notifyFriendsOnline time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const onlineEmit = bobSocket._emitted.find((e) => e.event === 'friend:online');
      expect(onlineEmit).toBeDefined();
      expect(onlineEmit!.data.userId).toBe('user-1');
    });

    it('should not re-notify friends when user is already online', async () => {
      const bobSocket = createMockSocket('user-2');
      const io = createMockIO([bobSocket]);

      // First connect
      onlineUsers.add('user-1');
      trackUserOnline(io as any, 'user-1');

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should NOT have notified since user was already online
      expect(bobSocket._emitted.filter((e) => e.event === 'friend:online')).toHaveLength(0);
    });
  });

  // =========================================================================
  // trackUserOffline
  // =========================================================================
  describe('trackUserOffline', () => {
    it('should remove user from onlineUsers set', () => {
      onlineUsers.add('user-1');

      trackUserOffline('user-1');

      expect(onlineUsers.has('user-1')).toBe(false);
    });

    it('should not throw when user is not in online set', () => {
      expect(() => trackUserOffline('user-unknown')).not.toThrow();
    });
  });

  // =========================================================================
  // getOnlineFriends
  // =========================================================================
  describe('getOnlineFriends', () => {
    it('should return only friends that are online', async () => {
      onlineUsers.add('user-2'); // Bob is online
      // Carol (user-3) is offline

      const result = await getOnlineFriends('user-1');

      expect(result).toEqual(['user-2']);
    });

    it('should return all friends when all are online', async () => {
      onlineUsers.add('user-2');
      onlineUsers.add('user-3');

      const result = await getOnlineFriends('user-1');

      expect(result).toHaveLength(2);
      expect(result).toContain('user-2');
      expect(result).toContain('user-3');
    });

    it('should return empty array when no friends are online', async () => {
      const result = await getOnlineFriends('user-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when user has no friends', async () => {
      mockFriendshipFindMany.mockResolvedValue([]);

      const result = await getOnlineFriends('user-1');

      expect(result).toEqual([]);
    });

    it('should resolve friend IDs correctly when user is on either side of the friendship', async () => {
      // Alice is friendId in one, userId in another
      mockFriendshipFindMany.mockResolvedValue([
        { userId: 'user-2', friendId: 'user-1' }, // Bob sent request to Alice
        { userId: 'user-1', friendId: 'user-3' }, // Alice sent request to Carol
      ] as any);

      onlineUsers.add('user-2');
      onlineUsers.add('user-3');

      const result = await getOnlineFriends('user-1');

      expect(result).toHaveLength(2);
      expect(result).toContain('user-2');
      expect(result).toContain('user-3');
    });
  });

  // =========================================================================
  // notifyFriendsOnline
  // =========================================================================
  describe('notifyFriendsOnline', () => {
    it('should emit friend:online to connected friend sockets', async () => {
      const bobSocket = createMockSocket('user-2');
      const carolSocket = createMockSocket('user-3');
      const io = createMockIO([bobSocket, carolSocket]);

      await notifyFriendsOnline(io as any, 'user-1');

      const bobEmit = bobSocket._emitted.find((e) => e.event === 'friend:online');
      expect(bobEmit).toBeDefined();
      expect(bobEmit!.data.userId).toBe('user-1');

      const carolEmit = carolSocket._emitted.find((e) => e.event === 'friend:online');
      expect(carolEmit).toBeDefined();
      expect(carolEmit!.data.userId).toBe('user-1');
    });

    it('should not emit to non-friend sockets', async () => {
      const strangerSocket = createMockSocket('user-99');
      const io = createMockIO([strangerSocket]);

      await notifyFriendsOnline(io as any, 'user-1');

      expect(strangerSocket._emitted).toHaveLength(0);
    });

    it('should not throw when friendship query fails', async () => {
      mockFriendshipFindMany.mockRejectedValue(new Error('DB error'));
      const io = createMockIO();

      // Should not throw
      await notifyFriendsOnline(io as any, 'user-1');
    });

    it('should not emit when user has no friends', async () => {
      mockFriendshipFindMany.mockResolvedValue([]);
      const bobSocket = createMockSocket('user-2');
      const io = createMockIO([bobSocket]);

      await notifyFriendsOnline(io as any, 'user-1');

      expect(bobSocket._emitted).toHaveLength(0);
    });
  });

  // =========================================================================
  // notifyFriendsOffline
  // =========================================================================
  describe('notifyFriendsOffline', () => {
    it('should emit friend:offline to connected friend sockets', async () => {
      const bobSocket = createMockSocket('user-2');
      const io = createMockIO([bobSocket]);

      await notifyFriendsOffline(io as any, 'user-1');

      const offlineEmit = bobSocket._emitted.find((e) => e.event === 'friend:offline');
      expect(offlineEmit).toBeDefined();
      expect(offlineEmit!.data.userId).toBe('user-1');
    });

    it('should not emit to non-friend sockets', async () => {
      const strangerSocket = createMockSocket('user-99');
      const io = createMockIO([strangerSocket]);

      await notifyFriendsOffline(io as any, 'user-1');

      expect(strangerSocket._emitted).toHaveLength(0);
    });

    it('should not throw when friendship query fails', async () => {
      mockFriendshipFindMany.mockRejectedValue(new Error('DB error'));
      const io = createMockIO();

      await notifyFriendsOffline(io as any, 'user-1');
    });
  });
});
