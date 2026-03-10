/**
 * Auth Service
 * Shared helper functions for authentication controllers
 */

import { User } from '@prisma/client';
import { prisma } from '../../config/database';
import { generateAccessToken, generateRefreshToken } from '../../shared/utils/tokenUtils';
import { successResponse } from '../../shared/utils/responseFormatter';

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

  let attempts = 0;
  const maxAttempts = BIRD_NAMES.length;

  while (attempts < maxAttempts) {
    const birdName = BIRD_NAMES[Math.floor(Math.random() * BIRD_NAMES.length)];
    const username = `${firstName}_${birdName}${lastTwoDigits}`;

    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) {
      return username;
    }

    attempts++;
  }

  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const birdName = BIRD_NAMES[Math.floor(Math.random() * BIRD_NAMES.length)];
  return `${firstName}_${birdName}${lastTwoDigits}${randomSuffix}`;
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
 * Generate tokens and return auth response
 */
export function createAuthResponse(user: User, message: string, isNewUser: boolean = false) {
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  return successResponse(
    {
      user: getUserResponse(user),
      tokens: { accessToken, refreshToken },
      isNewUser,
    },
    message
  );
}
