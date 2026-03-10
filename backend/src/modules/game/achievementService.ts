/**
 * Achievement Service
 * Handles achievement queries for the API layer.
 */

import { prisma } from '../../config/database';

export interface AchievementResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string | null;
  category: string;
  unlocked: boolean;
  achievedAt: Date | null;
}

export class AchievementService {
  /**
   * Get all achievements with unlock status for a user.
   * Returns all defined achievements, marking which ones the user has earned.
   */
  static async getUserAchievements(userId: string): Promise<AchievementResponse[]> {
    const achievements = await prisma.achievement.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        userAchievements: {
          where: { userId },
          select: { achievedAt: true },
        },
      },
    });

    return achievements.map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      description: a.description,
      logo: a.logo,
      category: a.category,
      unlocked: a.userAchievements.length > 0,
      achievedAt: a.userAchievements[0]?.achievedAt ?? null,
    }));
  }

  /**
   * Get achievement summary for profile display
   */
  static async getAchievementSummary(userId: string): Promise<{ unlocked: number; total: number }> {
    const [unlocked, total] = await Promise.all([
      prisma.userAchievement.count({ where: { userId } }),
      prisma.achievement.count(),
    ]);
    return { unlocked, total };
  }
}
