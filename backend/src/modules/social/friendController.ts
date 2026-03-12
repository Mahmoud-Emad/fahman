/**
 * Friend Controller
 * HTTP request handlers for friendship operations
 */

import { Response, NextFunction } from 'express';
import friendService from './friendService';
import friendRequestService from './friendRequestService';
import { successResponse } from '@shared/utils/responseFormatter';
import { AuthRequest } from '@shared/types/index';
import { getAuthUser } from '@shared/middleware/getAuthUser';
import { getSocketRegistry } from '@/socket';

/**
 * Get user's friends
 */
export async function getFriends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friends = await friendService.getFriends(getAuthUser(req).id);
    res.json(successResponse(friends));
  } catch (error) {
    next(error);
  }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requests = await friendService.getPendingRequests(getAuthUser(req).id);
    res.json(successResponse(requests));
  } catch (error) {
    next(error);
  }
}

/**
 * Get sent friend requests
 */
export async function getSentRequests(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const requests = await friendService.getSentRequests(getAuthUser(req).id);
    res.json(successResponse(requests));
  } catch (error) {
    next(error);
  }
}

/**
 * Send friend request by user ID
 */
export async function sendFriendRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.body;
    const result = await friendRequestService.sendFriendRequest(getAuthUser(req).id, userId);
    if (result.notification) {
      getSocketRegistry()?.sendNotificationToUser(userId, result.notification);
    }
    res.status(201).json(successResponse(result, 'Friend request sent'));
  } catch (error) {
    next(error);
  }
}

/**
 * Send friend request by username or game ID
 */
export async function sendFriendRequestByIdentifier(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { identifier } = req.body;
    const result = await friendRequestService.sendFriendRequestByIdentifier(getAuthUser(req).id, identifier);
    if (result.notification) {
      // result has `request` when it's a new request, or `requesterId` when auto-accepted
      const targetId = 'request' in result ? result.request.friendId : ('requesterId' in result ? result.requesterId : null);
      if (targetId) {
        getSocketRegistry()?.sendNotificationToUser(targetId, result.notification);
      }
    }
    res.status(201).json(successResponse(result, 'Friend request sent'));
  } catch (error) {
    next(error);
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await friendRequestService.acceptFriendRequest(getAuthUser(req).id, req.params.id);
    const registry = getSocketRegistry();
    if (registry) {
      if (result.resolved) {
        registry.sendNotificationUpdate(getAuthUser(req).id, { id: result.resolved.id, actionTaken: 'accepted' });
      }
      if (result.notification && result.requesterId) {
        registry.sendNotificationToUser(result.requesterId, result.notification);
      }
      if (result.requesterId) {
        registry.emitFriendshipAccepted(result.requesterId, getAuthUser(req).id);
      }
    }
    res.json(successResponse(result, 'Friend request accepted'));
  } catch (error) {
    next(error);
  }
}

/**
 * Decline friend request
 */
export async function declineFriendRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await friendRequestService.declineFriendRequest(getAuthUser(req).id, req.params.id);
    if (result.resolved) {
      getSocketRegistry()?.sendNotificationUpdate(getAuthUser(req).id, { id: result.resolved.id, actionTaken: 'declined' });
    }
    res.json(successResponse(result, 'Friend request declined'));
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel sent friend request
 */
export async function cancelFriendRequest(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await friendRequestService.cancelFriendRequest(getAuthUser(req).id, req.params.id);
    res.json(successResponse(result, 'Friend request cancelled'));
  } catch (error) {
    next(error);
  }
}

/**
 * Remove friend (unfriend)
 */
export async function removeFriend(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await friendService.removeFriend(getAuthUser(req).id, req.params.id);
    res.json(successResponse(result, 'Friend removed'));
  } catch (error) {
    next(error);
  }
}

/**
 * Block user
 */
export async function blockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await friendService.blockUser(getAuthUser(req).id, req.params.id);
    res.json(successResponse(result, 'User blocked'));
  } catch (error) {
    next(error);
  }
}

/**
 * Unblock user
 */
export async function unblockUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await friendService.unblockUser(getAuthUser(req).id, req.params.id);
    res.json(successResponse(result, 'User unblocked'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get blocked users
 */
export async function getBlockedUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await friendService.getBlockedUsers(getAuthUser(req).id);
    res.json(successResponse(users));
  } catch (error) {
    next(error);
  }
}

/**
 * Search users
 */
export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { q, limit } = req.query;
    const users = await friendService.searchUsers(
      getAuthUser(req).id,
      q as string,
      parseInt(limit as string) || 20
    );
    res.json(successResponse(users));
  } catch (error) {
    next(error);
  }
}

/**
 * Get friendship status with another user
 */
export async function getFriendshipStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const status = await friendService.getFriendshipStatus(getAuthUser(req).id, req.params.id);
    res.json(successResponse(status));
  } catch (error) {
    next(error);
  }
}
