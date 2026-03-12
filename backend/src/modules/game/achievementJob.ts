/**
 * Achievement Job
 * Daily batch job that evaluates all users against achievement conditions
 * and grants new achievements. Fully idempotent — safe to re-run.
 */

import { prisma } from '@config/database';
import logger from '@shared/utils/logger';
import { evaluateCondition } from './achievementEngine';
import { batchUserStats } from './achievementStatsQuery';

const BATCH_SIZE = 500;

interface JobResult {
  processed: number;
  granted: number;
  durationMs: number;
}

/**
 * Process all active users in batches:
 * 1. Compute stats (single SQL per batch)
 * 2. Evaluate all achievement conditions
 * 3. Bulk-insert new achievements (skipDuplicates for idempotency)
 */
export async function runAchievementJob(): Promise<JobResult> {
  const startTime = Date.now();
  logger.info('Achievement job started');

  const achievements = await prisma.achievement.findMany();
  if (achievements.length === 0) {
    logger.warn('No achievements defined — skipping job');
    return { processed: 0, granted: 0, durationMs: Date.now() - startTime };
  }

  let totalProcessed = 0;
  let totalGranted = 0;
  let cursor: string | undefined;

  while (true) {
    const users = await prisma.user.findMany({
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      ...(cursor ? { cursor: { id: cursor } } : {}),
      where: { isActive: true },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (users.length === 0) break;

    const userIds = users.map((u) => u.id);
    cursor = users[users.length - 1].id;

    // 1. Batch-fetch stats
    const statsMap = await batchUserStats(userIds);

    // 2. Fetch existing achievements for this batch
    const existing = await prisma.userAchievement.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, achievementId: true },
    });

    const existingSet = new Set(
      existing.map((ea) => `${ea.userId}:${ea.achievementId}`)
    );

    // 3. Evaluate conditions and collect new grants
    const newGrants: Array<{ userId: string; achievementId: string }> = [];

    for (const userId of userIds) {
      const stats = statsMap.get(userId);
      if (!stats) continue;

      for (const achievement of achievements) {
        if (existingSet.has(`${userId}:${achievement.id}`)) continue;

        if (evaluateCondition(achievement.conditions as Parameters<typeof evaluateCondition>[0], stats)) {
          newGrants.push({ userId, achievementId: achievement.id });
        }
      }
    }

    // 4. Bulk insert — composite PK prevents duplicates
    if (newGrants.length > 0) {
      const result = await prisma.userAchievement.createMany({
        data: newGrants,
        skipDuplicates: true,
      });
      totalGranted += result.count;
    }

    totalProcessed += users.length;

    if (totalProcessed % 5000 === 0) {
      logger.info(`Achievement job progress: ${totalProcessed} users processed, ${totalGranted} granted`);
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info(`Achievement job completed: ${totalProcessed} users, ${totalGranted} new achievements, ${durationMs}ms`);

  return { processed: totalProcessed, granted: totalGranted, durationMs };
}
