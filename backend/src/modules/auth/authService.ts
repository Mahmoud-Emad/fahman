/**
 * Auth Service
 * Shared helper functions for authentication controllers
 */

import { randomInt, randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { prisma } from '@config/database';
import { getRedis } from '@config/redis';
import { generateAccessToken, generateRefreshToken } from '@shared/utils/tokenUtils';
import { successResponse } from '@shared/utils/responseFormatter';
import logger from '@shared/utils/logger';

const REFRESH_TOKEN_TTL = 2592000; // 30 days in seconds

/**
 * List of bird names for username generation
 */
const BIRD_NAMES = [
  'owl', 'eagle', 'hawk', 'falcon', 'raven', 'crow', 'sparrow', 'robin',
  'dove', 'pigeon', 'swan', 'duck', 'goose', 'heron', 'crane', 'stork',
  'flamingo', 'pelican', 'penguin', 'puffin', 'parrot', 'macaw', 'toucan',
  'woodpecker', 'kingfisher', 'hummingbird', 'cardinal', 'bluejay', 'finch',
  'canary', 'phoenix', 'thunderbird', 'griffin', 'peacock', 'condor',
];

/**
 * Generate a unique username from display name and game ID
 * Format: {firstName}_{birdName}{lastTwoDigits}
 * Example: "john_owl45" for "John Doe" with gameId 100045
 */
export async function generateUniqueUsername(displayName: string, gameId: number): Promise<string> {
  const firstName = displayName
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const lastTwoDigits = (gameId % 100).toString().padStart(2, '0');

  // Track tried bird names so we never check the same one twice
  const tried = new Set<string>();
  const remaining = [...BIRD_NAMES];

  while (remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    const birdName = remaining.splice(idx, 1)[0];
    tried.add(birdName);

    const username = `${firstName}_${birdName}${lastTwoDigits}`;
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) {
      return username;
    }
  }

  // Fallback: append a UUID slice to virtually eliminate collisions
  for (let i = 0; i < 10; i++) {
    const suffix = randomUUID().slice(0, 8);
    const birdName = BIRD_NAMES[i % BIRD_NAMES.length];
    const username = `${firstName}_${birdName}${lastTwoDigits}_${suffix}`;
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) {
      return username;
    }
  }

  throw new Error('Failed to generate unique username');
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return randomInt(100000, 1000000).toString();
}

/**
 * Standard user response fields
 */
export function getUserResponse(user: User) {
  return {
    id: user.id,
    gameId: user.gameId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    email: user.email,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    avatar: user.avatar,
    role: user.role,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    coins: user.coins,
  };
}

/**
 * Generate tokens, store refresh token jti in Redis, and return auth response
 */
export async function createAuthResponse(user: User, message: string, isNewUser: boolean = false) {
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const { token: refreshToken, jti } = generateRefreshToken({ userId: user.id, role: user.role });

  // Store refresh token jti in Redis for revocation checks
  try {
    const redis = getRedis();
    await redis.set(`refresh:token:${user.id}:${jti}`, 'valid', 'EX', REFRESH_TOKEN_TTL);
  } catch (error) {
    logger.error('Failed to store refresh token in Redis:', error);
  }

  return successResponse(
    {
      user: getUserResponse(user),
      tokens: { accessToken, refreshToken },
      isNewUser,
    },
    message
  );
}
