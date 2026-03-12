/**
 * User Stats Service
 * Aggregates user statistics from game gameSessions and player answers
 */

import { prisma } from '@config/database';
import { AchievementService } from '../game/achievementService';

export class UserStatsService {
  /**
   * Get aggregated user statistics
   */
  static async getUserStats(userId: string) {
    const [gamesPlayed, wins, totalPointsData, topScores, user, friendsCount] = await Promise.all([
      // Count total games played by user (rooms with completed game sessions)
      prisma.roomMember.count({
        where: {
          userId,
          room: {
            gameSessions: {
              some: {},
            },
          },
        },
      }),

      // Count games won
      prisma.gameSession.count({
        where: { winnerId: userId },
      }),

      // Sum total points across all games
      prisma.roomMember.aggregate({
        where: { userId },
        _sum: { score: true },
      }),

      // Get top 3 scores
      prisma.roomMember.findMany({
        where: { userId },
        orderBy: { score: 'desc' },
        take: 3,
        select: {
          score: true,
          room: {
            select: {
              title: true,
            },
          },
        },
      }),

      // Get user streak data
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          currentStreak: true,
          bestStreak: true,
        },
      }),

      // Count accepted friends
      prisma.friendship.count({
        where: {
          OR: [
            { userId, status: 'ACCEPTED' },
            { friendId: userId, status: 'ACCEPTED' },
          ],
        },
      }),
    ]);

    const totalPoints = totalPointsData._sum.score || 0;
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;

    return {
      gamesPlayed,
      wins,
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
      totalPoints,
      friendsCount,
      topScores: topScores.map((s) => ({
        score: s.score,
        roomTitle: s.room?.title ?? 'Deleted Room',
      })),
      currentStreak: user?.currentStreak || 0,
      bestStreak: user?.bestStreak || 0,
    };
  }

  /**
   * Get recent games for user
   */
  static async getRecentGames(userId: string, limit = 10) {
    const recentMembers = await prisma.roomMember.findMany({
      where: {
        userId,
        room: {
          gameSessions: {
            some: {},
          },
        },
      },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            code: true,
            selectedPack: {
              select: {
                title: true,
              },
            },
            gameSessions: {
              orderBy: { endedAt: 'desc' },
              take: 1,
              select: {
                id: true,
                winnerId: true,
                endedAt: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: limit,
    });

    return recentMembers
      .filter((member) => member.room != null)
      .map((member) => {
        const session = member.room.gameSessions[0];
        const isWinner = session?.winnerId === userId;

        return {
          id: member.room.id,
          roomTitle: member.room.title,
          roomCode: member.room.code,
          packTitle: member.room.selectedPack?.title || 'Unknown Pack',
          result: isWinner ? 'won' : 'lost',
          score: member.score,
          playedAt: session?.endedAt?.toISOString() || member.joinedAt.toISOString(),
        };
      });
  }

  /**
   * Get user achievements with unlock status
   */
  static async getUserAchievements(userId: string) {
    return AchievementService.getUserAchievements(userId);
  }
}
