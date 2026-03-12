/**
 * Notification Service Unit Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { NotFoundError, ForbiddenError } from '@shared/utils/errors';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const userAlice = { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null };
const userBob = { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png' };

const now = new Date('2026-01-15T12:00:00Z');
const earlier = new Date('2026-01-15T11:00:00Z');

function buildNotification(overrides: Record<string, any> = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'SYSTEM',
    title: 'Test Notification',
    message: 'This is a test',
    senderId: null,
    actionData: {},
    isRead: false,
    createdAt: now,
    sender: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockNotificationCreate = mock(() => Promise.resolve(buildNotification()));
const mockNotificationFindUnique = mock(() => Promise.resolve(null));
const mockNotificationFindMany = mock(() => Promise.resolve([]));
const mockNotificationCount = mock(() => Promise.resolve(0));
const mockNotificationUpdate = mock(() => Promise.resolve(buildNotification()));
const mockNotificationUpdateMany = mock(() => Promise.resolve({ count: 0 }));
const mockNotificationDelete = mock(() => Promise.resolve({}));
const mockNotificationDeleteMany = mock(() => Promise.resolve({ count: 0 }));

const mockUserFindUnique = mock(() => Promise.resolve(null));

mock.module('../../config/database', () => ({
  prisma: {
    notification: {
      create: mockNotificationCreate,
      findUnique: mockNotificationFindUnique,
      findMany: mockNotificationFindMany,
      findFirst: mock(() => Promise.resolve(null)),
      count: mockNotificationCount,
      update: mockNotificationUpdate,
      updateMany: mockNotificationUpdateMany,
      delete: mockNotificationDelete,
      deleteMany: mockNotificationDeleteMany,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  },
}));

// Mock logger to prevent console output during tests
mock.module('../../shared/utils/logger', () => ({
  default: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    debug: mock(() => {}),
  },
}));

// Import after mocking so the module picks up the mocked prisma
import { NotificationService } from '@modules/social/notificationService';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    service = new NotificationService();
    mockNotificationCreate.mockReset();
    mockNotificationFindUnique.mockReset();
    mockNotificationFindMany.mockReset();
    mockNotificationCount.mockReset();
    mockNotificationUpdate.mockReset();
    mockNotificationUpdateMany.mockReset();
    mockNotificationDelete.mockReset();
    mockNotificationDeleteMany.mockReset();
    mockUserFindUnique.mockReset();

    // Defaults
    mockNotificationCreate.mockResolvedValue(buildNotification() as any);
    mockNotificationFindUnique.mockResolvedValue(null);
    mockNotificationFindMany.mockResolvedValue([]);
    mockNotificationCount.mockResolvedValue(0);
    mockNotificationUpdate.mockResolvedValue(buildNotification() as any);
    mockNotificationUpdateMany.mockResolvedValue({ count: 0 } as any);
    mockNotificationDelete.mockResolvedValue({} as any);
    mockNotificationDeleteMany.mockResolvedValue({ count: 0 } as any);
    mockUserFindUnique.mockResolvedValue(null);
  });

  // =========================================================================
  // createNotification
  // =========================================================================
  describe('createNotification', () => {
    it('should create a notification with correct data', async () => {
      const notif = buildNotification({
        type: 'SYSTEM',
        title: 'Welcome',
        message: 'Welcome to Fahman!',
      });
      mockNotificationCreate.mockResolvedValue(notif as any);

      const result = await service.createNotification({
        userId: 'user-1',
        type: 'SYSTEM' as any,
        title: 'Welcome',
        message: 'Welcome to Fahman!',
      });

      expect(result.userId).toBe('user-1');
      expect(result.title).toBe('Welcome');
      expect(result.message).toBe('Welcome to Fahman!');
      expect(result.type).toBe('SYSTEM');
      expect(result.isRead).toBe(false);
      expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    });

    it('should include sender when senderId is provided', async () => {
      const notifWithSender = buildNotification({
        senderId: 'user-2',
        sender: userBob,
      });
      mockNotificationCreate.mockResolvedValue(notifWithSender as any);

      const result = await service.createNotification({
        userId: 'user-1',
        type: 'FRIEND_REQUEST' as any,
        title: 'Friend Request',
        message: 'Bob sent you a friend request',
        senderId: 'user-2',
      });

      expect(result.senderId).toBe('user-2');
      expect(result.sender).toEqual({
        id: 'user-2',
        username: 'bob',
        displayName: 'Bob',
        avatar: 'bob.png',
      });
    });

    it('should set sender to null when no senderId is provided', async () => {
      const notif = buildNotification({ senderId: null, sender: null });
      mockNotificationCreate.mockResolvedValue(notif as any);

      const result = await service.createNotification({
        userId: 'user-1',
        type: 'SYSTEM' as any,
        title: 'System Update',
        message: 'Maintenance scheduled',
      });

      expect(result.senderId).toBeNull();
      expect(result.sender).toBeNull();
    });

    it('should pass actionData to the create call', async () => {
      const actionData = { roomCode: 'ABC123', roomTitle: 'Fun Quiz' };
      const notif = buildNotification({ actionData });
      mockNotificationCreate.mockResolvedValue(notif as any);

      await service.createNotification({
        userId: 'user-1',
        type: 'ROOM_INVITE' as any,
        title: 'Room Invite',
        message: 'Join the room!',
        actionData,
      });

      const createCall = mockNotificationCreate.mock.calls[0] as any[];
      expect(createCall[0].data.actionData).toEqual(actionData);
    });

    it('should default actionData to empty object when not provided', async () => {
      mockNotificationCreate.mockResolvedValue(buildNotification() as any);

      await service.createNotification({
        userId: 'user-1',
        type: 'SYSTEM' as any,
        title: 'Test',
        message: 'Test message',
      });

      const createCall = mockNotificationCreate.mock.calls[0] as any[];
      expect(createCall[0].data.actionData).toEqual({});
    });
  });

  // =========================================================================
  // getNotifications
  // =========================================================================
  describe('getNotifications', () => {
    it('should return notifications with pagination data', async () => {
      const notifications = [
        buildNotification({ id: 'notif-1', createdAt: now }),
        buildNotification({ id: 'notif-2', createdAt: earlier }),
      ];

      mockNotificationFindMany.mockResolvedValue(notifications as any);
      mockNotificationCount
        .mockResolvedValueOnce(2)  // total count
        .mockResolvedValueOnce(1); // unread count

      const result = await service.getNotifications('user-1', { page: 1, limit: 20 });

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.unreadCount).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply pagination offset correctly', async () => {
      mockNotificationFindMany.mockResolvedValue([]);
      mockNotificationCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getNotifications('user-1', { page: 3, limit: 10 });

      const findCall = mockNotificationFindMany.mock.calls[0] as any[];
      expect(findCall[0].skip).toBe(20); // (3-1) * 10
      expect(findCall[0].take).toBe(10);
    });

    it('should filter to unread only when unreadOnly is true', async () => {
      mockNotificationFindMany.mockResolvedValue([]);
      mockNotificationCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getNotifications('user-1', { page: 1, limit: 20 }, true);

      const findCall = mockNotificationFindMany.mock.calls[0] as any[];
      expect(findCall[0].where.isRead).toBe(false);
    });

    it('should not filter by isRead when unreadOnly is false', async () => {
      mockNotificationFindMany.mockResolvedValue([]);
      mockNotificationCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getNotifications('user-1', { page: 1, limit: 20 }, false);

      const findCall = mockNotificationFindMany.mock.calls[0] as any[];
      expect(findCall[0].where.isRead).toBeUndefined();
    });

    it('should use default pagination when not provided', async () => {
      mockNotificationFindMany.mockResolvedValue([]);
      mockNotificationCount
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getNotifications('user-1');

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should always include unreadCount in the response', async () => {
      mockNotificationFindMany.mockResolvedValue([]);
      mockNotificationCount
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(4); // unread

      const result = await service.getNotifications('user-1');

      expect(result.unreadCount).toBe(4);
    });
  });

  // =========================================================================
  // getUnreadCount
  // =========================================================================
  describe('getUnreadCount', () => {
    it('should return the count of unread notifications', async () => {
      mockNotificationCount.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockNotificationCount).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });

    it('should return 0 when there are no unread notifications', async () => {
      mockNotificationCount.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // markAsRead
  // =========================================================================
  describe('markAsRead', () => {
    it('should mark a notification as read when user owns it', async () => {
      const notif = buildNotification({ id: 'notif-1', userId: 'user-1', isRead: false });
      const updatedNotif = { ...notif, isRead: true };

      mockNotificationFindUnique.mockResolvedValue(notif as any);
      mockNotificationUpdate.mockResolvedValue(updatedNotif as any);

      const result = await service.markAsRead('user-1', 'notif-1');

      expect(result.isRead).toBe(true);
      expect(mockNotificationUpdate).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
        include: {
          sender: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      });
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      mockNotificationFindUnique.mockResolvedValue(null);

      await expect(
        service.markAsRead('user-1', 'notif-nonexistent')
      ).rejects.toThrow(NotFoundError);

      await expect(
        service.markAsRead('user-1', 'notif-nonexistent')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw ForbiddenError when user does not own the notification', async () => {
      const notif = buildNotification({ id: 'notif-1', userId: 'user-2' });
      mockNotificationFindUnique.mockResolvedValue(notif as any);

      await expect(
        service.markAsRead('user-1', 'notif-1')
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.markAsRead('user-1', 'notif-1')
      ).rejects.toThrow('Cannot access this notification');
    });
  });

  // =========================================================================
  // markAllAsRead
  // =========================================================================
  describe('markAllAsRead', () => {
    it('should update all unread notifications for the user', async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 8 } as any);

      const result = await service.markAllAsRead('user-1');

      expect(result.updated).toBe(8);
      expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });

    it('should return 0 updated when all notifications are already read', async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.markAllAsRead('user-1');

      expect(result.updated).toBe(0);
    });
  });

  // =========================================================================
  // deleteNotification
  // =========================================================================
  describe('deleteNotification', () => {
    it('should delete the notification when user owns it', async () => {
      const notif = buildNotification({ id: 'notif-1', userId: 'user-1' });
      mockNotificationFindUnique.mockResolvedValue(notif as any);

      const result = await service.deleteNotification('user-1', 'notif-1');

      expect(result.success).toBe(true);
      expect(mockNotificationDelete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });

    it('should throw NotFoundError when notification does not exist', async () => {
      mockNotificationFindUnique.mockResolvedValue(null);

      await expect(
        service.deleteNotification('user-1', 'notif-nonexistent')
      ).rejects.toThrow(NotFoundError);

      await expect(
        service.deleteNotification('user-1', 'notif-nonexistent')
      ).rejects.toThrow('Notification not found');
    });

    it('should throw ForbiddenError when user does not own the notification', async () => {
      const notif = buildNotification({ id: 'notif-1', userId: 'user-2' });
      mockNotificationFindUnique.mockResolvedValue(notif as any);

      await expect(
        service.deleteNotification('user-1', 'notif-1')
      ).rejects.toThrow(ForbiddenError);

      await expect(
        service.deleteNotification('user-1', 'notif-1')
      ).rejects.toThrow('Cannot delete this notification');
    });
  });

  // =========================================================================
  // deleteReadNotifications
  // =========================================================================
  describe('deleteReadNotifications', () => {
    it('should delete only read notifications for the user', async () => {
      mockNotificationDeleteMany.mockResolvedValue({ count: 5 } as any);

      const result = await service.deleteReadNotifications('user-1');

      expect(result.deleted).toBe(5);
      expect(mockNotificationDeleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: true },
      });
    });

    it('should return 0 deleted when there are no read notifications', async () => {
      mockNotificationDeleteMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.deleteReadNotifications('user-1');

      expect(result.deleted).toBe(0);
    });
  });
});
