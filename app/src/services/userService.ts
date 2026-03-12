/**
 * User Service
 * API methods for user profile and statistics
 */

import { api, ApiResponse } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface UserStats {
  gamesPlayed: number;
  wins: number;
  winRate: number;
  totalPoints: number;
  friendsCount: number;
  currentStreak: number;
  bestStreak: number;
  topScores?: Array<{
    score: number;
    roomTitle: string;
  }>;
}

export interface RecentGame {
  id: string;
  roomTitle: string;
  roomCode: string;
  packTitle: string;
  result: 'won' | 'lost';
  score: number;
  playedAt: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  category: string;
  unlocked: boolean;
  achievedAt: string | null;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  gameId: number;
  createdAt: string;
  isPremium: boolean;
  friendsCount: number;
  isFriend: boolean;
  isOnline: boolean;
  pendingRequest: {
    id: string;
    isSentByMe: boolean;
  } | null;
  isCurrentUser: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

class UserService {
  /**
   * Get current user statistics
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return api.get<UserStats>('/users/me/stats');
  }

  /**
   * Get recent games for current user
   */
  async getRecentGames(limit = 10): Promise<ApiResponse<RecentGame[]>> {
    return api.get<RecentGame[]>(`/users/me/games/recent?limit=${limit}`);
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(): Promise<ApiResponse<Achievement[]>> {
    return api.get<Achievement[]>('/users/me/achievements');
  }

  /**
   * Update daily login streak (called on app open)
   */
  async updateStreak(): Promise<ApiResponse<{ currentStreak: number; bestStreak: number }>> {
    return api.post<{ currentStreak: number; bestStreak: number }>('/users/me/streak');
  }

  /**
   * Get another user's public profile
   */
  async getPublicProfile(userId: string): Promise<ApiResponse<PublicUserProfile>> {
    return api.get<PublicUserProfile>(`/users/${userId}`);
  }

  /**
   * Get another user's statistics
   */
  async getOtherUserStats(userId: string): Promise<ApiResponse<UserStats>> {
    return api.get<UserStats>(`/users/${userId}/stats`);
  }

  /**
   * Get another user's recent games
   */
  async getOtherUserRecentGames(userId: string, limit = 10): Promise<ApiResponse<RecentGame[]>> {
    return api.get<RecentGame[]>(`/users/${userId}/games/recent?limit=${limit}`);
  }

  /**
   * Get another user's achievements
   */
  async getOtherUserAchievements(userId: string): Promise<ApiResponse<Achievement[]>> {
    return api.get<Achievement[]>(`/users/${userId}/achievements`);
  }
}

export const userService = new UserService();
