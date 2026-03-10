/**
 * JWT Token Utility Functions
 * Handles JWT token generation and verification
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types/index';
import { UnauthorizedError } from './errors';
import { config } from '../../config/env';

/**
 * Generate an access token for a user
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
}

/**
 * Verify an access token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
    }
    throw new UnauthorizedError('Token verification failed');
  }
}

/**
 * Verify a refresh token (uses separate secret)
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid refresh token');
      }
    }
    throw new UnauthorizedError('Refresh token verification failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
