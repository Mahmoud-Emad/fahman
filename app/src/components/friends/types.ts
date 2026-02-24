/**
 * Friends feature type definitions
 */

/**
 * Friend status
 */
export type FriendStatus = "online" | "offline" | "in_game";

/**
 * Friend data
 */
export interface Friend {
  id: string;
  name: string;
  username: string;
  initials: string;
  avatar?: string;
  status: FriendStatus;
  lastSeen?: Date;
  currentGame?: string;
  stats?: {
    gamesPlayed: number;
    wins: number;
  };
}

/**
 * Friend request data
 */
export interface FriendRequest {
  id: string;
  from: {
    id: string;
    name: string;
    username: string;
    initials: string;
    avatar?: string;
  };
  timestamp: Date;
}

/**
 * Friend action types
 */
export type FriendAction = "message" | "invite" | "remove" | "block";
