/**
 * Settings Service
 * Handles user settings operations
 */

import { prisma } from '@config/database';
import { AppError, ValidationError, UnauthorizedError } from '@shared/utils/errors';
import { comparePassword } from '@shared/utils/passwordUtils';

interface UserSettingsData {
  // Sound settings
  gameSound: boolean;
  userSound: boolean;
  notificationSound: boolean;
  appSound: boolean;

  // Privacy settings
  onlineStatus: boolean;
  roomVisibility: boolean;
  readReceipts: boolean;

  // Language
  language: string;
}

/**
 * Get user settings (creates default if not exists)
 */
export async function getUserSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
        gameSound: true,
        userSound: true,
        notificationSound: true,
        appSound: true,
        onlineStatus: true,
        roomVisibility: true,
        readReceipts: true,
        language: 'en',
      },
    });
  }

  return settings;
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string,
  settingsData: Partial<UserSettingsData>
) {
  // Check if settings exist
  const existingSettings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!existingSettings) {
    // Create if doesn't exist
    return await prisma.userSettings.create({
      data: {
        userId,
        ...settingsData,
      },
    });
  }

  // Update existing settings
  return await prisma.userSettings.update({
    where: { userId },
    data: settingsData,
  });
}

/**
 * Reset user settings to defaults
 */
export async function resetUserSettings(userId: string) {
  return await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      gameSound: true,
      userSound: true,
      notificationSound: true,
      appSound: true,
      onlineStatus: true,
      roomVisibility: true,
      readReceipts: true,
      language: 'en',
    },
    update: {
      gameSound: true,
      userSound: true,
      notificationSound: true,
      appSound: true,
      onlineStatus: true,
      roomVisibility: true,
      readReceipts: true,
      language: 'en',
    },
  });
}

/**
 * Delete user account and all related data.
 * Requires password confirmation for accounts that have a password set.
 */
export async function deleteUserAccount(userId: string, password?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Require password confirmation if the account has a password
  if (user.passwordHash) {
    if (!password) {
      throw new ValidationError('Password is required to delete your account');
    }
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Incorrect password');
    }
  }

  // Delete user (cascade will handle related data)
  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}
