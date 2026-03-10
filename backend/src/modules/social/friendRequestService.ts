/**
 * Friend Request Service
 * Business logic for friend request operations (send, accept, decline, cancel)
 */

import { prisma } from '../../config/database';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../../shared/utils/errors';
import notificationService from './notificationService';
import { sendNotificationToUser, sendNotificationUpdate, emitFriendshipAccepted } from '../../socket';

export class FriendRequestService {
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

    // Resolve the FRIEND_REQUEST notification for the acceptor
    const resolved = await notificationService.resolveByContext(userId, request.userId, 'FRIEND_REQUEST', 'accepted');
    if (resolved) {
      sendNotificationUpdate(userId, { id: resolved.id, actionTaken: 'accepted' });
    }

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

    // Resolve the FRIEND_REQUEST notification for the decliner
    const resolved = await notificationService.resolveByContext(userId, request.userId, 'FRIEND_REQUEST', 'declined');
    if (resolved) {
      sendNotificationUpdate(userId, { id: resolved.id, actionTaken: 'declined' });
    }

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
}

export default new FriendRequestService();
