/**
 * Friend Controller
 * HTTP request handlers for friendship operations
 */

import { Response, NextFunction } from 'express';
import friendService from './friendService';
import friendRequestService from './friendRequestService';
import { successResponse } from '../../shared/utils/responseFormatter';
import { AuthRequest } from '../../shared/types/index';

/**
 * Get user's friends
 */
export async function getFriends(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const friends = await friendService.getFriends(req.user.id);
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
    const requests = await friendService.getPendingRequests(req.user.id);
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
    const requests = await friendService.getSentRequests(req.user.id);
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
    const result = await friendRequestService.sendFriendRequest(req.user.id, userId);
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
    const result = await friendRequestService.sendFriendRequestByIdentifier(req.user.id, identifier);
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
    const result = await friendRequestService.acceptFriendRequest(req.user.id, req.params.id);
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
    const result = await friendRequestService.declineFriendRequest(req.user.id, req.params.id);
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
    const result = await friendRequestService.cancelFriendRequest(req.user.id, req.params.id);
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
    const result = await friendService.removeFriend(req.user.id, req.params.id);
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
    const result = await friendService.blockUser(req.user.id, req.params.id);
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
    const result = await friendService.unblockUser(req.user.id, req.params.id);
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
    const users = await friendService.getBlockedUsers(req.user.id);
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
      req.user.id,
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
    const status = await friendService.getFriendshipStatus(req.user.id, req.params.id);
    res.json(successResponse(status));
  } catch (error) {
    next(error);
  }
}
