/**
 * Friends Service
 * API methods for friend management
 */

import { api, ApiResponse } from './api';

export interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  gameId: number;
  isOnline?: boolean;
}

export interface FriendWithStatus extends Friend {
  status: 'ACCEPTED';
  friendshipId: string;
}

export interface FriendRequest {
  id: string;
  status: 'PENDING';
  requestedAt: string;
  user: Friend;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  requestedAt: string;
  respondedAt: string | null;
}

export interface UserSearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  gameId: number;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
  pendingRequestId?: string;
  isSentByMe?: boolean;
}

class FriendsService {
  /**
   * Get list of friends
   */
  async getFriends(): Promise<ApiResponse<FriendWithStatus[]>> {
    return api.get<FriendWithStatus[]>('/friends');
  }

  /**
   * Get pending friend requests (received)
   */
  async getFriendRequests(): Promise<ApiResponse<FriendRequest[]>> {
    return api.get<FriendRequest[]>('/friends/requests');
  }

  /**
   * Get sent friend requests
   */
  async getSentRequests(): Promise<ApiResponse<FriendRequest[]>> {
    return api.get<FriendRequest[]>('/friends/requests/sent');
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(userId: string): Promise<ApiResponse<Friendship>> {
    return api.post<Friendship>('/friends/request', { userId });
  }

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string): Promise<ApiResponse<Friendship>> {
    return api.post<Friendship>(`/friends/request/${requestId}/accept`);
  }

  /**
   * Decline a friend request
   */
  async declineFriendRequest(requestId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/friends/request/${requestId}/decline`);
  }

  /**
   * Remove a friend
   */
  async removeFriend(friendshipId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/friends/${friendshipId}`);
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/friends/${userId}/block`);
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/friends/${userId}/unblock`);
  }

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(): Promise<ApiResponse<Friend[]>> {
    return api.get<Friend[]>('/friends/blocked');
  }

  /**
   * Get friendship status with another user
   */
  async getFriendshipStatus(userId: string): Promise<ApiResponse<{ status: Friendship['status'] | null; friendshipId?: string }>> {
    return api.get<{ status: Friendship['status'] | null; friendshipId?: string }>(`/friends/status/${userId}`);
  }

  /**
   * Send friend request by username or game ID
   */
  async sendFriendRequestByIdentifier(identifier: string): Promise<ApiResponse<Friendship>> {
    return api.post<Friendship>('/friends/request/find', { identifier });
  }

  /**
   * Cancel a sent friend request
   */
  async cancelFriendRequest(requestId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/friends/request/${requestId}/cancel`);
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<ApiResponse<UserSearchResult[]>> {
    return api.get<UserSearchResult[]>(`/users/search?q=${encodeURIComponent(query)}`);
  }
}

export const friendsService = new FriendsService();
