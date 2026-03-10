/**
 * Streak Service
 * Handles daily streak tracking based on app opens
 */

import { prisma } from '../../config/database';

export class StreakService {
  /**
   * Update user's streak when they open the app
   * Called on login or app open
   */
  static async updateStreak(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastStreakUpdate: true,
        currentStreak: true,
        bestStreak: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // If this is the first streak update
    if (!user.lastStreakUpdate) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: 1,
          bestStreak: Math.max(1, user.bestStreak),
          lastStreakUpdate: now,
          lastLogin: now,
        },
        select: {
          currentStreak: true,
          bestStreak: true,
        },
      });

      return updated;
    }

    const lastUpdate = new Date(user.lastStreakUpdate);
    const lastUpdateDate = new Date(
      lastUpdate.getFullYear(),
      lastUpdate.getMonth(),
      lastUpdate.getDate()
    );

    // Calculate days difference
    const daysDiff = Math.floor(
      (today.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newCurrentStreak = user.currentStreak;
    let newBestStreak = user.bestStreak;

    if (daysDiff === 0) {
      // Same day - no change to streak
      // Just update lastLogin
      await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: now },
      });

      return {
        currentStreak: user.currentStreak,
        bestStreak: user.bestStreak,
      };
    } else if (daysDiff === 1) {
      // Next consecutive day - increment streak
      newCurrentStreak = user.currentStreak + 1;
      newBestStreak = Math.max(newCurrentStreak, user.bestStreak);
    } else {
      // Streak broken - reset to 1
      newCurrentStreak = 1;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        lastStreakUpdate: now,
        lastLogin: now,
      },
      select: {
        currentStreak: true,
        bestStreak: true,
      },
    });

    return updated;
  }

  /**
   * Get user's current streak info
   */
  static async getStreak(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        bestStreak: true,
      },
    });

    if (!user) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    return {
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
    };
  }
}
