/**
 * Achievement Stats Query
 * Batch-fetches user statistics in a single SQL query for achievement evaluation.
 */

import { prisma } from '@config/database';
import type { UserStats } from './achievementEngine';

interface StatsRow {
  user_id: string;
  rooms_joined: bigint;
  rooms_created: bigint;
  packs_created: bigint;
  friends: bigint;
  wins: bigint;
  current_streak: number;
}

/**
 * Fetch stats for a batch of user IDs in a single query.
 * Returns a Map<userId, UserStats>.
 */
export async function batchUserStats(userIds: string[]): Promise<Map<string, UserStats>> {
  if (userIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<StatsRow[]>`
    SELECT
      u.id AS user_id,
      COALESCE(rm.cnt, 0)   AS rooms_joined,
      COALESCE(cr.cnt, 0)   AS rooms_created,
      COALESCE(pk.cnt, 0)   AS packs_created,
      COALESCE(fr.cnt, 0)   AS friends,
      COALESCE(gs.cnt, 0)   AS wins,
      u.current_streak
    FROM users u
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS cnt FROM room_members WHERE user_id = u.id
    ) rm ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS cnt FROM rooms WHERE creator_id = u.id
    ) cr ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS cnt FROM packs WHERE creator_id = u.id
    ) pk ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS cnt FROM friendships
      WHERE (user_id = u.id OR friend_id = u.id) AND status = 'ACCEPTED'
    ) fr ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS cnt FROM game_sessions WHERE winner_id = u.id
    ) gs ON true
    WHERE u.id = ANY(${userIds})
  `;

  const map = new Map<string, UserStats>();
  for (const row of rows) {
    map.set(row.user_id, {
      rooms_joined: Number(row.rooms_joined),
      rooms_created: Number(row.rooms_created),
      packs_created: Number(row.packs_created),
      friends: Number(row.friends),
      wins: Number(row.wins),
      current_streak: row.current_streak,
    });
  }
  return map;
}
