/**
 * Presence Handlers Unit Tests
 * Tests Redis-backed presence tracking and friend notifications
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const aliceBobFriendship = { userId: 'user-1', friendId: 'user-2' };
const aliceCarolFriendship = { userId: 'user-1', friendId: 'user-3' };

// ---------------------------------------------------------------------------
// Redis mock — tracks keys in memory to simulate Redis behavior
// ---------------------------------------------------------------------------

const redisStore = new Map<string, string>();

const mockRedis = {
  set: mock(async (key: string, value: string, _ex?: string, _ttl?: number) => {
    redisStore.set(key, value);
    return 'OK';
  }),
  del: mock(async (key: string) => {
    const existed = redisStore.has(key) ? 1 : 0;
    redisStore.delete(key);
    return existed;
  }),
  exists: mock(async (key: string) => {
    return redisStore.has(key) ? 1 : 0;
  }),
  expire: mock(async () => 1),
  pipeline: mock(() => {
    const commands: Array<() => Promise<[null, number]>> = [];
    return {
      exists: (key: string) => {
        commands.push(async () => [null, redisStore.has(key) ? 1 : 0]);
      },
      exec: async () => {
        return Promise.all(commands.map((cmd) => cmd()));
      },
    };
  }),
};

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockFriendshipFindMany = mock(() =>
  Promise.resolve([aliceBobFriendship, aliceCarolFriendship])
);

mock.module('../../config/database', () => ({
  prisma: {
    friendship: {
      findMany: mockFriendshipFindMany,
    },
  },
}));

mock.module('../../config/redis', () => ({
  getRedis: () => mockRedis,
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
  trackUserOnline,
  trackUserOffline,
  isUserOnline,
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
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Presence Handlers', () => {
  beforeEach(() => {
    redisStore.clear();
    mockRedis.set.mockClear();
    mockRedis.del.mockClear();
    mockRedis.exists.mockClear();
    mockFriendshipFindMany.mockReset();
    mockFriendshipFindMany.mockResolvedValue([aliceBobFriendship, aliceCarolFriendship] as any);
  });

  // =========================================================================
  // trackUserOnline
  // =========================================================================
  describe('trackUserOnline', () => {
    it('should set presence key in Redis', async () => {
      const io = createMockIO();

      await trackUserOnline(io as any, 'user-1');

      expect(redisStore.has('presence:user-1')).toBe(true);
    });

    it('should notify friends when a user comes online for the first time', async () => {
      const bobSocket = createMockSocket('user-2');
      const io = createMockIO([bobSocket]);

      await trackUserOnline(io as any, 'user-1');

      // Give async notifyFriendsOnline time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      const onlineEmit = bobSocket._emitted.find((e) => e.event === 'friend:online');
      expect(onlineEmit).toBeDefined();
      expect(onlineEmit!.data.userId).toBe('user-1');
    });

    it('should not re-notify friends when user is already online', async () => {
      const bobSocket = createMockSocket('user-2');
      const io = createMockIO([bobSocket]);

      // Simulate user already online in Redis
      redisStore.set('presence:user-1', '1');
      await trackUserOnline(io as any, 'user-1');

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should NOT have notified since user was already online
      expect(bobSocket._emitted.filter((e) => e.event === 'friend:online')).toHaveLength(0);
    });
  });

  // =========================================================================
  // trackUserOffline
  // =========================================================================
  describe('trackUserOffline', () => {
    it('should remove presence key from Redis', async () => {
      redisStore.set('presence:user-1', '1');

      await trackUserOffline('user-1');

      expect(redisStore.has('presence:user-1')).toBe(false);
    });

    it('should not throw when user is not online', async () => {
      await expect(trackUserOffline('user-unknown')).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // isUserOnline
  // =========================================================================
  describe('isUserOnline', () => {
    it('should return true when user presence key exists', async () => {
      redisStore.set('presence:user-1', '1');

      expect(await isUserOnline('user-1')).toBe(true);
    });

    it('should return false when user presence key does not exist', async () => {
      expect(await isUserOnline('user-99')).toBe(false);
    });
  });

  // =========================================================================
  // getOnlineFriends
  // =========================================================================
  describe('getOnlineFriends', () => {
    it('should return only friends that are online', async () => {
      redisStore.set('presence:user-2', '1'); // Bob is online
      // Carol (user-3) is offline

      const result = await getOnlineFriends('user-1');

      expect(result).toEqual(['user-2']);
    });

    it('should return all friends when all are online', async () => {
      redisStore.set('presence:user-2', '1');
      redisStore.set('presence:user-3', '1');

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

    it('should resolve friend IDs correctly when user is on either side', async () => {
      mockFriendshipFindMany.mockResolvedValue([
        { userId: 'user-2', friendId: 'user-1' },
        { userId: 'user-1', friendId: 'user-3' },
      ] as any);

      redisStore.set('presence:user-2', '1');
      redisStore.set('presence:user-3', '1');

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
