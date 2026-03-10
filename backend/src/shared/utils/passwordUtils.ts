/**
 * Password Utility Functions
 * Handles password hashing and verification using bcrypt
 */

import bcrypt from 'bcrypt';
import { config } from '../../config/env';

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, config.bcrypt.rounds);
    return hash;
  } catch (error) {
    throw new Error('Error hashing password');
  }
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
}
