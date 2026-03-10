/**
 * Game Service Unit Tests
 */

import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { GameService } from '../../modules/game/gameService';
import {
  testUsers,
  testRooms,
  testPacks,
  testQuestions,
  testRoomMembers,
} from '../utils/testSetup';

// Create a test instance of GameService to access private methods
class TestableGameService extends GameService {
  // Expose private methods for testing
  public testCheckAnswer(
    submitted: number | number[],
    correct: number[],
    questionType: string
  ): boolean {
    return (this as any).checkAnswer(submitted, correct, questionType);
  }

  public testCalculatePoints(
    isCorrect: boolean,
    betAmount: number,
    basePoints: number,
    timeTaken: number,
    timeLimit: number
  ): number {
    return (this as any).calculatePoints(
      isCorrect,
      betAmount,
      basePoints,
      timeTaken,
      timeLimit
    );
  }
}

describe('GameService', () => {
  let gameService: TestableGameService;

  beforeEach(() => {
    gameService = new TestableGameService();
  });

  describe('checkAnswer', () => {
    describe('SINGLE choice questions', () => {
      it('should return true for correct single answer', () => {
        const result = gameService.testCheckAnswer(1, [1], 'SINGLE');
        expect(result).toBe(true);
      });

      it('should return false for incorrect single answer', () => {
        const result = gameService.testCheckAnswer(0, [1], 'SINGLE');
        expect(result).toBe(false);
      });

      it('should handle array input for single choice', () => {
        const result = gameService.testCheckAnswer([1], [1], 'SINGLE');
        expect(result).toBe(true);
      });

      it('should return false if multiple answers submitted for single choice', () => {
        const result = gameService.testCheckAnswer([0, 1], [1], 'SINGLE');
        expect(result).toBe(false);
      });
    });

    describe('TRUE_FALSE questions', () => {
      it('should return true for correct true/false answer', () => {
        const result = gameService.testCheckAnswer(0, [0], 'TRUE_FALSE');
        expect(result).toBe(true);
      });

      it('should return false for incorrect true/false answer', () => {
        const result = gameService.testCheckAnswer(1, [0], 'TRUE_FALSE');
        expect(result).toBe(false);
      });
    });

    describe('MULTIPLE choice questions', () => {
      it('should return true when all correct answers are selected', () => {
        const result = gameService.testCheckAnswer([0, 2], [0, 2], 'MULTIPLE');
        expect(result).toBe(true);
      });

      it('should return true regardless of order', () => {
        const result = gameService.testCheckAnswer([2, 0], [0, 2], 'MULTIPLE');
        expect(result).toBe(true);
      });

      it('should return false when missing some correct answers', () => {
        const result = gameService.testCheckAnswer([0], [0, 2], 'MULTIPLE');
        expect(result).toBe(false);
      });

      it('should return false when extra incorrect answers included', () => {
        const result = gameService.testCheckAnswer([0, 1, 2], [0, 2], 'MULTIPLE');
        expect(result).toBe(false);
      });

      it('should return false when wrong answers selected', () => {
        const result = gameService.testCheckAnswer([1, 3], [0, 2], 'MULTIPLE');
        expect(result).toBe(false);
      });
    });
  });

  describe('calculatePoints', () => {
    describe('incorrect answers', () => {
      it('should return negative bet amount for wrong answer', () => {
        const result = gameService.testCalculatePoints(false, 50, 100, 15, 30);
        expect(result).toBe(-50);
      });

      it('should return 0 for wrong answer with 0 bet', () => {
        const result = gameService.testCalculatePoints(false, 0, 100, 15, 30);
        expect(result === 0).toBe(true); // -0 == 0 mathematically
      });

      it('should ignore time taken for wrong answers', () => {
        const fastResult = gameService.testCalculatePoints(false, 100, 100, 1, 30);
        const slowResult = gameService.testCalculatePoints(false, 100, 100, 29, 30);
        expect(fastResult).toBe(-100);
        expect(slowResult).toBe(-100);
      });
    });

    describe('correct answers', () => {
      it('should calculate base points with speed bonus for instant answer', () => {
        // timeLimit = 30, timeTaken = 0 → speedRatio = 1 → multiplier = 2
        const result = gameService.testCalculatePoints(true, 0, 100, 0, 30);
        expect(result).toBe(200); // 100 * 2
      });

      it('should calculate base points with no speed bonus for last-second answer', () => {
        // timeLimit = 30, timeTaken = 30 → speedRatio = 0 → multiplier = 1
        const result = gameService.testCalculatePoints(true, 0, 100, 30, 30);
        expect(result).toBe(100); // 100 * 1
      });

      it('should calculate points with bet amount and speed bonus', () => {
        // timeLimit = 30, timeTaken = 15 → speedRatio = 0.5 → multiplier = 1.5
        const result = gameService.testCalculatePoints(true, 50, 100, 15, 30);
        expect(result).toBe(225); // (100 + 50) * 1.5 = 225
      });

      it('should handle edge case with very fast answers', () => {
        // Answered in 1 second out of 30
        const result = gameService.testCalculatePoints(true, 100, 100, 1, 30);
        // speedRatio = (30-1)/30 = 0.967 → multiplier = 1.967
        expect(result).toBeGreaterThan(350); // Should be around 393
        expect(result).toBeLessThan(400);
      });

      it('should handle different time limits', () => {
        // 15-second time limit, answered in 5 seconds
        const result = gameService.testCalculatePoints(true, 0, 100, 5, 15);
        // speedRatio = (15-5)/15 = 0.667 → multiplier = 1.667
        expect(result).toBeGreaterThan(160);
        expect(result).toBeLessThan(170);
      });

      it('should round to integer', () => {
        const result = gameService.testCalculatePoints(true, 33, 100, 10, 30);
        expect(Number.isInteger(result)).toBe(true);
      });

      it('should not give negative multiplier for overtime answers', () => {
        // timeTaken > timeLimit (shouldn't happen but test edge case)
        const result = gameService.testCalculatePoints(true, 0, 100, 35, 30);
        // speedRatio should be clamped to 0 → multiplier = 1
        expect(result).toBe(100);
      });
    });

    describe('scoring scenarios', () => {
      it('should reward fast correct answers more than slow ones', () => {
        const fastAnswer = gameService.testCalculatePoints(true, 50, 100, 5, 30);
        const slowAnswer = gameService.testCalculatePoints(true, 50, 100, 25, 30);
        expect(fastAnswer).toBeGreaterThan(slowAnswer);
      });

      it('should make higher bets on correct answers worth more', () => {
        const lowBet = gameService.testCalculatePoints(true, 10, 100, 15, 30);
        const highBet = gameService.testCalculatePoints(true, 100, 100, 15, 30);
        expect(highBet).toBeGreaterThan(lowBet);
      });

      it('should make higher bets on wrong answers cost more', () => {
        const lowBet = gameService.testCalculatePoints(false, 10, 100, 15, 30);
        const highBet = gameService.testCalculatePoints(false, 100, 100, 15, 30);
        expect(highBet).toBeLessThan(lowBet); // -100 < -10
      });
    });
  });

  describe('scoring formula verification', () => {
    it('should match documented formula: (basePoints + betAmount) × speedMultiplier', () => {
      // Test case: basePoints=100, bet=50, timeTaken=15, timeLimit=30
      // Expected: speedMultiplier = 1 + (1 - 15/30) = 1.5
      // Points = (100 + 50) × 1.5 = 225
      const result = gameService.testCalculatePoints(true, 50, 100, 15, 30);
      expect(result).toBe(225);
    });

    it('should match documented formula for wrong answers: -betAmount', () => {
      const result = gameService.testCalculatePoints(false, 75, 100, 15, 30);
      expect(result).toBe(-75);
    });
  });
});

describe('GameService Integration Scenarios', () => {
  let gameService: TestableGameService;

  beforeEach(() => {
    gameService = new TestableGameService();
  });

  describe('realistic game scenarios', () => {
    it('should handle a player who answers all questions correctly with max speed', () => {
      // Simulate 5 questions, all correct with instant answers
      let totalScore = 0;
      const questionsPoints = [100, 100, 150, 100, 200];
      const bets = [0, 50, 100, 25, 75];

      for (let i = 0; i < 5; i++) {
        const points = gameService.testCalculatePoints(
          true,
          bets[i],
          questionsPoints[i],
          0, // instant answer
          30
        );
        totalScore += points;
      }

      // All should have 2x multiplier
      // (100+0)*2 + (100+50)*2 + (150+100)*2 + (100+25)*2 + (200+75)*2
      // = 200 + 300 + 500 + 250 + 550 = 1800
      expect(totalScore).toBe(1800);
    });

    it('should handle a player who answers all questions wrong', () => {
      let totalScore = 0;
      const bets = [50, 75, 100, 25, 0];

      for (const bet of bets) {
        const points = gameService.testCalculatePoints(false, bet, 100, 15, 30);
        totalScore += points;
      }

      // Total loss = -(50 + 75 + 100 + 25 + 0) = -250
      expect(totalScore).toBe(-250);
    });

    it('should handle mixed correct/wrong answers', () => {
      let totalScore = 0;
      const answers = [
        { correct: true, bet: 50, basePoints: 100, time: 10 },
        { correct: false, bet: 100, basePoints: 100, time: 5 },
        { correct: true, bet: 75, basePoints: 150, time: 15 },
        { correct: false, bet: 25, basePoints: 100, time: 20 },
        { correct: true, bet: 0, basePoints: 200, time: 1 },
      ];

      for (const ans of answers) {
        const points = gameService.testCalculatePoints(
          ans.correct,
          ans.bet,
          ans.basePoints,
          ans.time,
          30
        );
        totalScore += points;
      }

      // This should result in a positive score overall
      expect(totalScore).toBeGreaterThan(0);
    });
  });
});
