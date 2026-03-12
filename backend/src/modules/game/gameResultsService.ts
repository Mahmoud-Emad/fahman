/**
 * Game Results Service
 * Business logic for game results, leaderboard, and question scoring
 */

import { prisma } from '@config/database';
import { NotFoundError, ForbiddenError } from '@shared/utils/errors';

export class GameResultsService {
  /**
   * Get game results/leaderboard
   */
  async getResults(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        selectedPack: {
          select: { id: true, title: true, category: true },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
            answers: {
              include: {
                question: {
                  select: { id: true, text: true, points: true },
                },
              },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if user is in the room
    const member = room.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenError('You are not in this room');
    }

    const results = room.members.map((m, index) => ({
      rank: index + 1,
      user: m.user,
      score: m.score,
      correctAnswers: m.answers.filter((a) => a.isCorrect).length,
      totalAnswers: m.answers.length,
      answers: m.answers.map((a) => ({
        questionId: a.questionId,
        questionText: a.question.text,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
        betAmount: a.betAmount,
        timeToAnswer: a.timeToAnswer,
      })),
    }));

    return {
      roomId: room.id,
      status: room.status,
      pack: room.selectedPack,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
      winner: results[0]?.user || null,
      results,
    };
  }

  /**
   * Get current leaderboard (scores only)
   */
  async getLeaderboard(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if user is in the room
    const member = room.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenError('You are not in this room');
    }

    return {
      roomId: room.id,
      status: room.status,
      players: room.members.map((m, index) => ({
        rank: index + 1,
        user: m.user,
        score: m.score,
        isYou: m.userId === userId,
      })),
    };
  }

  /**
   * Get question results (after everyone answered or time ran out)
   */
  async getQuestionResults(roomId: string, questionId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
            answers: {
              where: { questionId },
            },
          },
          orderBy: { score: 'desc' },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if user is in the room
    const member = room.members.find((m) => m.userId === userId);
    if (!member) {
      throw new ForbiddenError('You are not in this room');
    }

    // Get the question with correct answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        text: true,
        options: true,
        correctAnswers: true,
        points: true,
      },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    const playerResults = room.members.map((m) => {
      const answer = m.answers[0];
      return {
        user: m.user,
        answered: !!answer,
        isCorrect: answer?.isCorrect || false,
        pointsEarned: answer?.pointsEarned || 0,
        betAmount: answer?.betAmount || 0,
        timeToAnswer: answer?.timeToAnswer || null,
        currentScore: m.score,
      };
    });

    return {
      question: {
        id: question.id,
        text: question.text,
        options: question.options,
        correctAnswers: question.correctAnswers,
      },
      playerResults,
    };
  }
}

export default new GameResultsService();
