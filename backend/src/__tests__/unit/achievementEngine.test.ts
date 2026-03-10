/**
 * Achievement Engine Tests
 * Tests the rule-based condition evaluator in isolation (no DB).
 */

import { describe, it, expect } from 'bun:test';
import { evaluateCondition, type UserStats } from '../../modules/game/achievementEngine';

const baseStats: UserStats = {
  rooms_joined: 0,
  rooms_created: 0,
  packs_created: 0,
  friends: 0,
  wins: 0,
  current_streak: 0,
};

function withStats(overrides: Partial<UserStats>): UserStats {
  return { ...baseStats, ...overrides };
}

describe('evaluateCondition', () => {
  describe('leaf conditions', () => {
    it('should evaluate gte correctly', () => {
      const condition = { rooms_joined: { gte: 50 } };
      expect(evaluateCondition(condition, withStats({ rooms_joined: 49 }))).toBe(false);
      expect(evaluateCondition(condition, withStats({ rooms_joined: 50 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ rooms_joined: 100 }))).toBe(true);
    });

    it('should evaluate gt correctly', () => {
      const condition = { wins: { gt: 10 } };
      expect(evaluateCondition(condition, withStats({ wins: 10 }))).toBe(false);
      expect(evaluateCondition(condition, withStats({ wins: 11 }))).toBe(true);
    });

    it('should evaluate lte correctly', () => {
      const condition = { friends: { lte: 5 } };
      expect(evaluateCondition(condition, withStats({ friends: 5 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ friends: 6 }))).toBe(false);
    });

    it('should evaluate lt correctly', () => {
      const condition = { packs_created: { lt: 3 } };
      expect(evaluateCondition(condition, withStats({ packs_created: 2 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ packs_created: 3 }))).toBe(false);
    });

    it('should evaluate eq correctly', () => {
      const condition = { current_streak: { eq: 100 } };
      expect(evaluateCondition(condition, withStats({ current_streak: 99 }))).toBe(false);
      expect(evaluateCondition(condition, withStats({ current_streak: 100 }))).toBe(true);
    });

    it('should handle multiple operators on the same stat', () => {
      const condition = { wins: { gte: 10, lte: 50 } };
      expect(evaluateCondition(condition, withStats({ wins: 9 }))).toBe(false);
      expect(evaluateCondition(condition, withStats({ wins: 10 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ wins: 50 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ wins: 51 }))).toBe(false);
    });

    it('should return false for unknown stat key', () => {
      const condition = { unknown_stat: { gte: 1 } } as any;
      expect(evaluateCondition(condition, baseStats)).toBe(false);
    });
  });

  describe('compound conditions', () => {
    it('should evaluate AND — all must pass', () => {
      const condition = {
        AND: [
          { friends: { gte: 50 } },
          { rooms_joined: { gte: 100 } },
          { wins: { gte: 100 } },
        ],
      };

      // All met
      expect(evaluateCondition(condition, withStats({ friends: 50, rooms_joined: 100, wins: 100 }))).toBe(true);
      // One not met
      expect(evaluateCondition(condition, withStats({ friends: 50, rooms_joined: 99, wins: 100 }))).toBe(false);
      // None met
      expect(evaluateCondition(condition, baseStats)).toBe(false);
    });

    it('should evaluate OR — at least one must pass', () => {
      const condition = {
        OR: [
          { wins: { gte: 100 } },
          { friends: { gte: 50 } },
        ],
      };

      expect(evaluateCondition(condition, withStats({ wins: 100 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ friends: 50 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ wins: 100, friends: 50 }))).toBe(true);
      expect(evaluateCondition(condition, baseStats)).toBe(false);
    });

    it('should handle nested compound conditions', () => {
      const condition = {
        OR: [
          { AND: [{ wins: { gte: 10 } }, { friends: { gte: 5 } }] },
          { current_streak: { gte: 100 } },
        ],
      };

      expect(evaluateCondition(condition, withStats({ wins: 10, friends: 5 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ current_streak: 100 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ wins: 10, friends: 4 }))).toBe(false);
    });
  });

  describe('real achievement conditions', () => {
    it('La3eeb: rooms_joined >= 50', () => {
      const condition = { rooms_joined: { gte: 50 } };
      expect(evaluateCondition(condition, withStats({ rooms_joined: 50 }))).toBe(true);
    });

    it('Mo2alef: packs_created >= 1', () => {
      const condition = { packs_created: { gte: 1 } };
      expect(evaluateCondition(condition, withStats({ packs_created: 1 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ packs_created: 0 }))).toBe(false);
    });

    it('Fahman: compound achievement', () => {
      const condition = {
        AND: [
          { friends: { gte: 50 } },
          { rooms_joined: { gte: 100 } },
          { wins: { gte: 100 } },
        ],
      };

      expect(evaluateCondition(condition, withStats({ friends: 50, rooms_joined: 100, wins: 100 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ friends: 49, rooms_joined: 100, wins: 100 }))).toBe(false);
    });

    it('Laz2a: current_streak >= 100', () => {
      const condition = { current_streak: { gte: 100 } };
      expect(evaluateCondition(condition, withStats({ current_streak: 100 }))).toBe(true);
      expect(evaluateCondition(condition, withStats({ current_streak: 99 }))).toBe(false);
    });
  });
});
