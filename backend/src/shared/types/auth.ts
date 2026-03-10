/**
 * Authentication DTOs
 */

import { Role } from '@prisma/client';

export interface RegisterDto {
  email?: string;
  password: string;
  username?: string;
}

export interface RegisterWithPhoneDto {
  phone: string;
  password: string;
  verificationCode: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginWithPhoneDto {
  phone: string;
  password: string;
}

export interface LoginWithGameIdDto {
  gameId: number;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: TokenPair;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  gameId: number;
  role: Role;
  phone: string | null;
  phoneVerified: boolean;
  createdAt: Date;
  stats?: {
    totalGames: number;
    totalWins: number;
    totalPoints: number;
  };
}

export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface OAuthLoginDto {
  token: string;
}
