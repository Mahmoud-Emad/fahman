/**
 * FriendRequestService Unit Tests
 * Tests business logic for friend request lifecycle (send, accept, decline, cancel)
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';

// --- Mock Dependencies ---

const mockPrisma = {
  user: {
    findUnique: mock(() => Promise.resolve(null)),
  },
  friendship: {
    findUnique: mock(() => Promise.resolve(null)),
    findFirst: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve(null)),
    update: mock(() => Promise.resolve(null)),
    delete: mock(() => Promise.resolve(null)),
  },
};

const mockNotificationService = {
  createFriendRequestNotification: mock(() => Promise.resolve(null)),
  createFriendAcceptedNotification: mock(() => Promise.resolve(null)),
};

const mockSendNotificationToUser = mock(() => {});
const mockEmitFriendshipAccepted = mock(() => {});

mock.module('../../config/database', () => ({
  prisma: mockPrisma,
}));

mock.module('../../modules/social/notificationService', () => ({
  default: mockNotificationService,
}));

mock.module('../../socket', () => ({
  sendNotificationToUser: mockSendNotificationToUser,
  emitFriendshipAccepted: mockEmitFriendshipAccepted,
}));

// Import AFTER mocks are set up
import { FriendRequestService } from '../../modules/social/friendRequestService';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../../shared/utils/errors';

// --- Test Data ---

const USER_1_ID = 'user-1-uuid';
const USER_2_ID = 'user-2-uuid';
const USER_3_ID = 'user-3-uuid';
const REQUEST_ID = 'friendship-1-uuid';

const userSelect = { id: true, username: true, displayName: true, avatar: true };

const mockUser2 = {
  id: USER_2_ID,
  username: 'testuser2',
  displayName: 'Test User 2',
  avatar: 'https://example.com/avatar2.png',
};

const mockUser1 = {
  id: USER_1_ID,
  username: 'testuser1',
  displayName: 'Test User 1',
  avatar: 'https://example.com/avatar1.png',
};

/**
 * Helper to assert that an async function throws a specific error type with a specific message.
 * Calls the function only once, avoiding issues with mockResolvedValueOnce being consumed.
 */
async function expectError<T extends Error>(
  fn: () => Promise<unknown>,
  errorClass: new (...args: unknown[]) => T,
  expectedMessage: string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(errorClass);
    expect((error as T).message).toBe(expectedMessage);
  }
}

// --- Tests ---

describe('FriendRequestService', () => {
  let service: FriendRequestService;

  beforeEach(() => {
    service = new FriendRequestService();

    // Reset all mocks
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.friendship.findUnique.mockReset();
    mockPrisma.friendship.findFirst.mockReset();
    mockPrisma.friendship.create.mockReset();
    mockPrisma.friendship.update.mockReset();
    mockPrisma.friendship.delete.mockReset();
    mockNotificationService.createFriendRequestNotification.mockReset();
    mockNotificationService.createFriendAcceptedNotification.mockReset();
    mockSendNotificationToUser.mockReset();
    mockEmitFriendshipAccepted.mockReset();
  });

  // =========================================================================
  // sendFriendRequest
  // =========================================================================
  describe('sendFriendRequest', () => {
    it('should throw ValidationError when sending request to yourself', async () => {
      await expectError(
        () => service.sendFriendRequest(USER_1_ID, USER_1_ID),
        ValidationError,
        'You cannot send a friend request to yourself'
      );
    });

    it('should throw NotFoundError when target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expectError(
        () => service.sendFriendRequest(USER_1_ID, USER_2_ID),
        NotFoundError,
        'User not found'
      );
    });

    it('should throw ConflictError when users are already friends', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
      });

      await expectError(
        () => service.sendFriendRequest(USER_1_ID, USER_2_ID),
        ConflictError,
        'You are already friends'
      );
    });

    it('should throw ConflictError when a pending request already exists from the sender', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      await expectError(
        () => service.sendFriendRequest(USER_1_ID, USER_2_ID),
        ConflictError,
        'Friend request already sent'
      );
    });

    it('should auto-accept when the target already sent a pending request to the sender', async () => {
      // User2 already sent a pending request to User1, and now User1 sends one back
      const pendingRequest = {
        id: REQUEST_ID,
        userId: USER_2_ID,
        friendId: USER_1_ID,
        status: 'PENDING',
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce(pendingRequest);

      // Mock the acceptFriendRequest path (findUnique for the request)
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        ...pendingRequest,
        user: mockUser2,
      });

      const acceptedFriendship = {
        id: REQUEST_ID,
        userId: USER_2_ID,
        friendId: USER_1_ID,
        status: 'ACCEPTED',
        respondedAt: new Date(),
        user: mockUser2,
        friend: mockUser1,
      };
      mockPrisma.friendship.update.mockResolvedValueOnce(acceptedFriendship);
      mockNotificationService.createFriendAcceptedNotification.mockResolvedValueOnce(null);

      const result = await service.sendFriendRequest(USER_1_ID, USER_2_ID);

      expect(result).toHaveProperty('friendship');
      expect(result.friendship.status).toBe('ACCEPTED');
    });

    it('should throw ForbiddenError when the friendship is blocked', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'BLOCKED',
      });

      await expectError(
        () => service.sendFriendRequest(USER_1_ID, USER_2_ID),
        ForbiddenError,
        'Cannot send friend request'
      );
    });

    it('should re-send a previously rejected request by updating the existing record', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_2_ID,
        friendId: USER_1_ID,
        status: 'REJECTED',
      });

      const updatedRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        requestedAt: new Date(),
        respondedAt: null,
        friend: mockUser2,
      };
      mockPrisma.friendship.update.mockResolvedValueOnce(updatedRequest);
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(null);

      const result = await service.sendFriendRequest(USER_1_ID, USER_2_ID);

      expect(result).toHaveProperty('request');
      expect(result.request.status).toBe('PENDING');
      expect(mockPrisma.friendship.update).toHaveBeenCalled();
    });

    it('should send notification when re-sending a previously rejected request', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_2_ID,
        friendId: USER_1_ID,
        status: 'REJECTED',
      });

      const updatedRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      };
      mockPrisma.friendship.update.mockResolvedValueOnce(updatedRequest);

      const mockNotification = { id: 'notif-1', type: 'FRIEND_REQUEST' };
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(mockNotification);

      await service.sendFriendRequest(USER_1_ID, USER_2_ID);

      expect(mockNotificationService.createFriendRequestNotification).toHaveBeenCalledWith(
        USER_2_ID,
        USER_1_ID,
        REQUEST_ID
      );
      expect(mockSendNotificationToUser).toHaveBeenCalledWith(USER_2_ID, mockNotification);
    });

    it('should create a new friend request when no existing friendship exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce(null);

      const createdRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      };
      mockPrisma.friendship.create.mockResolvedValueOnce(createdRequest);
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(null);

      const result = await service.sendFriendRequest(USER_1_ID, USER_2_ID);

      expect(result).toHaveProperty('request');
      expect(result.request.status).toBe('PENDING');
      expect(result.request.friend).toEqual(mockUser2);
      expect(mockPrisma.friendship.create).toHaveBeenCalledWith({
        data: {
          userId: USER_1_ID,
          friendId: USER_2_ID,
          status: 'PENDING',
        },
        include: {
          friend: {
            select: userSelect,
          },
        },
      });
    });

    it('should send notification to target user when creating a new request', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce(null);

      const createdRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      };
      mockPrisma.friendship.create.mockResolvedValueOnce(createdRequest);

      const mockNotification = { id: 'notif-1', type: 'FRIEND_REQUEST' };
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(mockNotification);

      await service.sendFriendRequest(USER_1_ID, USER_2_ID);

      expect(mockNotificationService.createFriendRequestNotification).toHaveBeenCalledWith(
        USER_2_ID,
        USER_1_ID,
        REQUEST_ID
      );
      expect(mockSendNotificationToUser).toHaveBeenCalledWith(USER_2_ID, mockNotification);
    });

    it('should not send socket notification when notificationService returns null', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce(null);

      const createdRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      };
      mockPrisma.friendship.create.mockResolvedValueOnce(createdRequest);
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(null);

      await service.sendFriendRequest(USER_1_ID, USER_2_ID);

      expect(mockSendNotificationToUser).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // sendFriendRequestByIdentifier
  // =========================================================================
  describe('sendFriendRequestByIdentifier', () => {
    it('should look up user by gameId when identifier is numeric', async () => {
      const targetUser = { id: USER_2_ID };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(targetUser) // gameId lookup
        .mockResolvedValueOnce(mockUser2); // sendFriendRequest target lookup

      mockPrisma.friendship.findFirst.mockResolvedValueOnce(null);
      mockPrisma.friendship.create.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      });
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(null);

      await service.sendFriendRequestByIdentifier(USER_1_ID, '100002');

      // First call should be the gameId lookup
      const firstCall = mockPrisma.user.findUnique.mock.calls[0];
      expect(firstCall[0]).toEqual({
        where: { gameId: 100002 },
        select: { id: true },
      });
    });

    it('should look up user by username when identifier is not numeric', async () => {
      const targetUser = { id: USER_2_ID };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(targetUser) // username lookup
        .mockResolvedValueOnce(mockUser2); // sendFriendRequest target lookup

      mockPrisma.friendship.findFirst.mockResolvedValueOnce(null);
      mockPrisma.friendship.create.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      });
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(null);

      await service.sendFriendRequestByIdentifier(USER_1_ID, 'testuser2');

      const firstCall = mockPrisma.user.findUnique.mock.calls[0];
      expect(firstCall[0]).toEqual({
        where: { username: 'testuser2' },
        select: { id: true },
      });
    });

    it('should throw NotFoundError when identifier matches no user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expectError(
        () => service.sendFriendRequestByIdentifier(USER_1_ID, 'nonexistent'),
        NotFoundError,
        'User not found'
      );
    });

    it('should delegate to sendFriendRequest with the resolved user id', async () => {
      const targetUser = { id: USER_2_ID };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(mockUser2);

      mockPrisma.friendship.findFirst.mockResolvedValueOnce(null);

      const createdRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        friend: mockUser2,
      };
      mockPrisma.friendship.create.mockResolvedValueOnce(createdRequest);
      mockNotificationService.createFriendRequestNotification.mockResolvedValueOnce(null);

      const result = await service.sendFriendRequestByIdentifier(USER_1_ID, 'testuser2');

      expect(result).toHaveProperty('request');
      expect(result.request.friendId).toBe(USER_2_ID);
    });
  });

  // =========================================================================
  // acceptFriendRequest
  // =========================================================================
  describe('acceptFriendRequest', () => {
    it('should throw NotFoundError when request does not exist', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce(null);

      await expectError(
        () => service.acceptFriendRequest(USER_2_ID, REQUEST_ID),
        NotFoundError,
        'Friend request not found'
      );
    });

    it('should throw ForbiddenError when the user is not the recipient', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        user: mockUser1,
      });

      // USER_3_ID tries to accept a request meant for USER_2_ID
      await expectError(
        () => service.acceptFriendRequest(USER_3_ID, REQUEST_ID),
        ForbiddenError,
        'You cannot accept this request'
      );
    });

    it('should throw ValidationError when request is not pending', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
        user: mockUser1,
      });

      await expectError(
        () => service.acceptFriendRequest(USER_2_ID, REQUEST_ID),
        ValidationError,
        'This request has already been processed'
      );
    });

    it('should update friendship status to ACCEPTED', async () => {
      const pendingRequest = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        user: mockUser1,
      };
      mockPrisma.friendship.findUnique.mockResolvedValueOnce(pendingRequest);

      const acceptedFriendship = {
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
        respondedAt: new Date(),
        user: mockUser1,
        friend: mockUser2,
      };
      mockPrisma.friendship.update.mockResolvedValueOnce(acceptedFriendship);
      mockNotificationService.createFriendAcceptedNotification.mockResolvedValueOnce(null);

      const result = await service.acceptFriendRequest(USER_2_ID, REQUEST_ID);

      expect(result).toHaveProperty('friendship');
      expect(result.friendship.status).toBe('ACCEPTED');
      expect(mockPrisma.friendship.update).toHaveBeenCalledWith({
        where: { id: REQUEST_ID },
        data: {
          status: 'ACCEPTED',
          respondedAt: expect.any(Date),
        },
        include: {
          user: { select: userSelect },
          friend: { select: userSelect },
        },
      });
    });

    it('should send friend accepted notification to the original requester', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        user: mockUser1,
      });

      mockPrisma.friendship.update.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
        user: mockUser1,
        friend: mockUser2,
      });

      const mockNotification = { id: 'notif-accept', type: 'FRIEND_ACCEPTED' };
      mockNotificationService.createFriendAcceptedNotification.mockResolvedValueOnce(mockNotification);

      await service.acceptFriendRequest(USER_2_ID, REQUEST_ID);

      expect(mockNotificationService.createFriendAcceptedNotification).toHaveBeenCalledWith(
        USER_1_ID,
        USER_2_ID
      );
      expect(mockSendNotificationToUser).toHaveBeenCalledWith(USER_1_ID, mockNotification);
    });

    it('should emit friendship accepted socket event to both users', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        user: mockUser1,
      });

      mockPrisma.friendship.update.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
        user: mockUser1,
        friend: mockUser2,
      });
      mockNotificationService.createFriendAcceptedNotification.mockResolvedValueOnce(null);

      await service.acceptFriendRequest(USER_2_ID, REQUEST_ID);

      expect(mockEmitFriendshipAccepted).toHaveBeenCalledWith(USER_1_ID, USER_2_ID);
    });

    it('should not send socket notification when notificationService returns null', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
        user: mockUser1,
      });

      mockPrisma.friendship.update.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
        user: mockUser1,
        friend: mockUser2,
      });
      mockNotificationService.createFriendAcceptedNotification.mockResolvedValueOnce(null);

      await service.acceptFriendRequest(USER_2_ID, REQUEST_ID);

      expect(mockSendNotificationToUser).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // declineFriendRequest
  // =========================================================================
  describe('declineFriendRequest', () => {
    it('should throw NotFoundError when request does not exist', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce(null);

      await expectError(
        () => service.declineFriendRequest(USER_2_ID, REQUEST_ID),
        NotFoundError,
        'Friend request not found'
      );
    });

    it('should throw ForbiddenError when the user is not the recipient', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      await expectError(
        () => service.declineFriendRequest(USER_3_ID, REQUEST_ID),
        ForbiddenError,
        'You cannot decline this request'
      );
    });

    it('should throw ValidationError when request is not pending', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
      });

      await expectError(
        () => service.declineFriendRequest(USER_2_ID, REQUEST_ID),
        ValidationError,
        'This request has already been processed'
      );
    });

    it('should update friendship status to REJECTED', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      mockPrisma.friendship.update.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'REJECTED',
        respondedAt: new Date(),
      });

      const result = await service.declineFriendRequest(USER_2_ID, REQUEST_ID);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.friendship.update).toHaveBeenCalledWith({
        where: { id: REQUEST_ID },
        data: {
          status: 'REJECTED',
          respondedAt: expect.any(Date),
        },
      });
    });

    it('should throw ForbiddenError when the sender tries to decline their own request', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      // USER_1_ID is the sender, not the recipient
      await expectError(
        () => service.declineFriendRequest(USER_1_ID, REQUEST_ID),
        ForbiddenError,
        'You cannot decline this request'
      );
    });
  });

  // =========================================================================
  // cancelFriendRequest
  // =========================================================================
  describe('cancelFriendRequest', () => {
    it('should throw NotFoundError when request does not exist', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce(null);

      await expectError(
        () => service.cancelFriendRequest(USER_1_ID, REQUEST_ID),
        NotFoundError,
        'Friend request not found'
      );
    });

    it('should throw ForbiddenError when the user is not the sender', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      // USER_2_ID is the recipient, not the sender
      await expectError(
        () => service.cancelFriendRequest(USER_2_ID, REQUEST_ID),
        ForbiddenError,
        'You cannot cancel this request'
      );
    });

    it('should throw ValidationError when request is not pending', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
      });

      await expectError(
        () => service.cancelFriendRequest(USER_1_ID, REQUEST_ID),
        ValidationError,
        'This request cannot be cancelled'
      );
    });

    it('should delete the friendship record when cancelling', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      mockPrisma.friendship.delete.mockResolvedValueOnce({
        id: REQUEST_ID,
      });

      const result = await service.cancelFriendRequest(USER_1_ID, REQUEST_ID);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: REQUEST_ID },
      });
    });

    it('should throw ForbiddenError when the recipient tries to cancel the request', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'PENDING',
      });

      await expectError(
        () => service.cancelFriendRequest(USER_2_ID, REQUEST_ID),
        ForbiddenError,
        'You cannot cancel this request'
      );
    });

    it('should not allow cancelling a rejected request', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'REJECTED',
      });

      await expectError(
        () => service.cancelFriendRequest(USER_1_ID, REQUEST_ID),
        ValidationError,
        'This request cannot be cancelled'
      );
    });
  });

  // =========================================================================
  // Edge Cases & State Transitions
  // =========================================================================
  describe('edge cases and state transitions', () => {
    it('should handle blocked status in both friendship directions', async () => {
      // User2 blocked User1 (friendship.userId = User2, friendId = User1)
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser2);
      mockPrisma.friendship.findFirst.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_2_ID,
        friendId: USER_1_ID,
        status: 'BLOCKED',
      });

      await expectError(
        () => service.sendFriendRequest(USER_1_ID, USER_2_ID),
        ForbiddenError,
        'Cannot send friend request'
      );
    });

    it('should not allow declining a rejected request', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'REJECTED',
      });

      await expectError(
        () => service.declineFriendRequest(USER_2_ID, REQUEST_ID),
        ValidationError,
        'This request has already been processed'
      );
    });

    it('should not allow accepting an already accepted request', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
        user: mockUser1,
      });

      await expectError(
        () => service.acceptFriendRequest(USER_2_ID, REQUEST_ID),
        ValidationError,
        'This request has already been processed'
      );
    });

    it('should not allow cancelling an already accepted friendship', async () => {
      mockPrisma.friendship.findUnique.mockResolvedValueOnce({
        id: REQUEST_ID,
        userId: USER_1_ID,
        friendId: USER_2_ID,
        status: 'ACCEPTED',
      });

      await expectError(
        () => service.cancelFriendRequest(USER_1_ID, REQUEST_ID),
        ValidationError,
        'This request cannot be cancelled'
      );
    });

    it('should verify correct error types have correct status codes', () => {
      const validation = new ValidationError('test');
      const notFound = new NotFoundError('test');
      const forbidden = new ForbiddenError('test');
      const conflict = new ConflictError('test');

      expect(validation.statusCode).toBe(400);
      expect(notFound.statusCode).toBe(404);
      expect(forbidden.statusCode).toBe(403);
      expect(conflict.statusCode).toBe(409);
    });
  });
});
