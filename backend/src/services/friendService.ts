/**
 * Friend Service
 * Business logic for friendship management
 */

import { prisma } from '../config/database';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import notificationService from './notificationService';
import { sendNotificationToUser, emitFriendshipAccepted } from '../socket';

export class FriendService {
  /**
   * Get user's friends (accepted friendships)
   * Returns flat friend objects with friendshipId for easy frontend use
   */
  async getFriends(userId: string) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true, gameId: true },
        },
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true, gameId: true },
        },
      },
      orderBy: { respondedAt: 'desc' },
    });

    // Return flat friend objects (the other user in each friendship)
    return friendships.map((f) => {
      const friend = f.userId === userId ? f.friend : f.user;
      return {
        id: friend.id,
        username: friend.username,
        displayName: friend.displayName,
        avatar: friend.avatar,
        gameId: friend.gameId,
        friendshipId: f.id,
        since: f.respondedAt,
      };
    });
  }

  /**
   * Get pending friend requests (received)
   * Returns requests with user info for display
   */
  async getPendingRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true, gameId: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      status: 'PENDING' as const,
      requestedAt: r.requestedAt.toISOString(),
      user: r.user,
    }));
  }

  /**
   * Get sent friend requests (pending)
   * Returns requests with target user info
   */
  async getSentRequests(userId: string) {
    const requests = await prisma.friendship.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true, gameId: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      status: 'PENDING' as const,
      requestedAt: r.requestedAt.toISOString(),
      user: r.friend, // Use 'user' key for consistency with received requests
    }));
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string, targetUserId: string) {
    // Can't friend yourself
    if (userId === targetUserId) {
      throw new ValidationError('You cannot send a friend request to yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, displayName: true, avatar: true },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check existing friendship in either direction
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      switch (existingFriendship.status) {
        case 'ACCEPTED':
          throw new ConflictError('You are already friends');
        case 'PENDING':
          if (existingFriendship.userId === userId) {
            throw new ConflictError('Friend request already sent');
          } else {
            // They already sent us a request, accept it instead
            return this.acceptFriendRequest(userId, existingFriendship.id);
          }
        case 'BLOCKED':
          throw new ForbiddenError('Cannot send friend request');
        case 'REJECTED':
          // Update the existing rejected request to pending
          const updatedRequest = await prisma.friendship.update({
            where: { id: existingFriendship.id },
            data: {
              userId,
              friendId: targetUserId,
              status: 'PENDING',
              requestedAt: new Date(),
              respondedAt: null,
            },
            include: {
              friend: {
                select: { id: true, username: true, displayName: true, avatar: true },
              },
            },
          });

          // Create and send real-time notification
          const rejectedNotification = await notificationService.createFriendRequestNotification(targetUserId, userId, updatedRequest.id);
          if (rejectedNotification) {
            sendNotificationToUser(targetUserId, rejectedNotification);
          }

          return { request: updatedRequest };
      }
    }

    // Create new friend request
    const request = await prisma.friendship.create({
      data: {
        userId,
        friendId: targetUserId,
        status: 'PENDING',
      },
      include: {
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    // Create and send real-time notification to target user
    const notification = await notificationService.createFriendRequestNotification(targetUserId, userId, request.id);
    if (notification) {
      sendNotificationToUser(targetUserId, notification);
    }

    return { request };
  }

  /**
   * Send friend request by username or game ID
   */
  async sendFriendRequestByIdentifier(userId: string, identifier: string) {
    let targetUser;

    // Check if identifier is a game ID (numeric)
    if (/^\d+$/.test(identifier)) {
      targetUser = await prisma.user.findUnique({
        where: { gameId: parseInt(identifier, 10) },
        select: { id: true },
      });
    } else {
      // Treat as username
      targetUser = await prisma.user.findUnique({
        where: { username: identifier },
        select: { id: true },
      });
    }

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    return this.sendFriendRequest(userId, targetUser.id);
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendship.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    if (!request) {
      throw new NotFoundError('Friend request not found');
    }

    // Must be the recipient of the request
    if (request.friendId !== userId) {
      throw new ForbiddenError('You cannot accept this request');
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('This request has already been processed');
    }

    const friendship = await prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    // Notify the original sender that their request was accepted
    const notification = await notificationService.createFriendAcceptedNotification(request.userId, userId);
    if (notification) {
      sendNotificationToUser(request.userId, notification);
    }

    // Notify both users of each other's online status via socket
    emitFriendshipAccepted(request.userId, userId);

    return { friendship };
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Friend request not found');
    }

    // Must be the recipient of the request
    if (request.friendId !== userId) {
      throw new ForbiddenError('You cannot decline this request');
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('This request has already been processed');
    }

    await prisma.friendship.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Cancel sent friend request
   */
  async cancelFriendRequest(userId: string, requestId: string) {
    const request = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundError('Friend request not found');
    }

    // Must be the sender of the request
    if (request.userId !== userId) {
      throw new ForbiddenError('You cannot cancel this request');
    }

    if (request.status !== 'PENDING') {
      throw new ValidationError('This request cannot be cancelled');
    }

    await prisma.friendship.delete({
      where: { id: requestId },
    });

    return { success: true };
  }

  /**
   * Remove friend (unfriend)
   */
  async removeFriend(userId: string, friendId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId, status: 'ACCEPTED' },
          { userId: friendId, friendId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundError('Friendship not found');
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { success: true };
  }

  /**
   * Block user
   */
  async blockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ValidationError('You cannot block yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('User not found');
    }

    // Check existing friendship
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      // Update to blocked status
      await prisma.friendship.update({
        where: { id: existingFriendship.id },
        data: {
          userId, // Blocker is always the userId
          friendId: targetUserId,
          status: 'BLOCKED',
          respondedAt: new Date(),
        },
      });
    } else {
      // Create new blocked entry
      await prisma.friendship.create({
        data: {
          userId,
          friendId: targetUserId,
          status: 'BLOCKED',
          respondedAt: new Date(),
        },
      });
    }

    return { success: true };
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string, targetUserId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        userId,
        friendId: targetUserId,
        status: 'BLOCKED',
      },
    });

    if (!friendship) {
      throw new NotFoundError('Block not found');
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return { success: true };
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string) {
    const blocks = await prisma.friendship.findMany({
      where: {
        userId,
        status: 'BLOCKED',
      },
      include: {
        friend: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return blocks.map((b) => b.friend);
  }

  /**
   * Search users (for adding friends)
   */
  async searchUsers(userId: string, query: string, limit: number = 20) {
    if (!query || query.length < 2) {
      return [];
    }

    // Get blocked users to exclude
    const blockedIds = await this.getBlockedUserIds(userId);

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          { id: { notIn: blockedIds } },
          { isActive: true },
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
              // Search by game ID if numeric
              ...((/^\d+$/.test(query)) ? [{ gameId: parseInt(query, 10) }] : []),
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        gameId: true,
      },
      take: limit,
    });

    // Batch-check friendship status for all results
    const userIds = users.map((u) => u.id);
    const friendships = userIds.length > 0
      ? await prisma.friendship.findMany({
          where: {
            OR: [
              { userId, friendId: { in: userIds } },
              { userId: { in: userIds }, friendId: userId },
            ],
          },
          select: { id: true, userId: true, friendId: true, status: true },
        })
      : [];

    return users.map((user) => {
      const friendship = friendships.find(
        (f) => (f.userId === userId && f.friendId === user.id) ||
               (f.userId === user.id && f.friendId === userId)
      );

      return {
        ...user,
        isFriend: friendship?.status === 'ACCEPTED',
        hasPendingRequest: friendship?.status === 'PENDING',
        pendingRequestId: friendship?.status === 'PENDING' ? friendship.id : undefined,
        isSentByMe: friendship?.status === 'PENDING' && friendship.userId === userId,
      };
    });
  }

  /**
   * Check friendship status between two users
   */
  async getFriendshipStatus(userId: string, targetUserId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: targetUserId },
          { userId: targetUserId, friendId: userId },
        ],
      },
    });

    if (!friendship) {
      return { status: 'NONE' };
    }

    return {
      status: friendship.status,
      isRequester: friendship.userId === userId,
      friendshipId: friendship.id,
    };
  }

  /**
   * Helper: Get blocked user IDs
   */
  private async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'BLOCKED' },
          { friendId: userId, status: 'BLOCKED' },
        ],
      },
      select: { userId: true, friendId: true },
    });

    const ids = new Set<string>();
    blocks.forEach((b) => {
      if (b.userId !== userId) ids.add(b.userId);
      if (b.friendId !== userId) ids.add(b.friendId);
    });

    return Array.from(ids);
  }
}

export default new FriendService();
