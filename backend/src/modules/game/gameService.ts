/**
 * Game Service
 * Business logic for game lifecycle: state, answer submission, and question progression
 */

import { prisma } from '../../config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/utils/errors';

interface SubmitAnswerParams {
  answer: number | number[]; // Answer index(es)
  betAmount: number;
  timeRemaining: number; // Seconds remaining when answered
}

interface GameState {
  roomId: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: {
    id: string;
    text: string;
    options: unknown;
    questionType: string;
    mediaUrl: string | null;
    mediaType: string | null;
    timeLimit: number;
    points: number;
  } | null;
  players: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
    hasAnswered: boolean;
  }[];
  startedAt: Date | null;
}

export class GameService {
  /**
   * Get current game state
   */
  async getGameState(roomId: string, userId: string): Promise<GameState> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        selectedPack: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                text: true,
                options: true,
                questionType: true,
                mediaUrl: true,
                mediaType: true,
                timeLimit: true,
                points: true,
                orderIndex: true,
                // Don't include correctAnswers - that's revealed after answering
              },
            },
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
            answers: {
              select: { questionId: true },
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

    const questions = room.selectedPack?.questions || [];
    const currentQuestion = questions[room.currentQuestionIndex] || null;

    // Check which players have answered the current question
    const playersWithAnswerStatus = room.members.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      displayName: m.user.displayName,
      avatar: m.user.avatar,
      score: m.score,
      hasAnswered: currentQuestion
        ? m.answers.some((a) => a.questionId === currentQuestion.id)
        : false,
    }));

    return {
      roomId: room.id,
      status: room.status,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: questions.length,
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            text: currentQuestion.text,
            options: currentQuestion.options,
            questionType: currentQuestion.questionType,
            mediaUrl: currentQuestion.mediaUrl,
            mediaType: currentQuestion.mediaType,
            timeLimit: currentQuestion.timeLimit,
            points: currentQuestion.points,
          }
        : null,
      players: playersWithAnswerStatus,
      startedAt: room.startedAt,
    };
  }

  /**
   * Submit an answer for the current question
   */
  async submitAnswer(
    roomId: string,
    userId: string,
    params: SubmitAnswerParams
  ) {
    const { answer, betAmount, timeRemaining } = params;

    // Get room with current question
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        selectedPack: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        members: {
          where: { userId, isActive: true },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.status !== 'PLAYING') {
      throw new ValidationError('Game is not in progress');
    }

    const member = room.members[0];
    if (!member) {
      throw new ForbiddenError('You are not in this room');
    }

    const questions = room.selectedPack?.questions || [];
    const currentQuestion = questions[room.currentQuestionIndex];

    if (!currentQuestion) {
      throw new ValidationError('No current question');
    }

    // Check if already answered this question
    const existingAnswer = member.answers.find(
      (a) => a.questionId === currentQuestion.id
    );
    if (existingAnswer) {
      throw new ValidationError('You have already answered this question');
    }

    // Validate bet amount (positive integer)
    if (betAmount < 0 || !Number.isInteger(betAmount)) {
      throw new ValidationError('Invalid bet amount');
    }

    // Calculate if answer is correct
    const correctAnswers = currentQuestion.correctAnswers as number[];
    const isCorrect = this.checkAnswer(answer, correctAnswers, currentQuestion.questionType);

    // Calculate points earned
    const timeLimit = currentQuestion.timeLimit;
    const timeTaken = Math.max(0, timeLimit - timeRemaining);
    const pointsEarned = this.calculatePoints(
      isCorrect,
      betAmount,
      currentQuestion.points,
      timeTaken,
      timeLimit
    );

    // Create player answer and update score in transaction
    const [_playerAnswer] = await prisma.$transaction([
      prisma.playerAnswer.create({
        data: {
          roomMemberId: member.id,
          questionId: currentQuestion.id,
          answer: Array.isArray(answer) ? answer : [answer],
          betAmount,
          isCorrect,
          pointsEarned,
          timeToAnswer: timeTaken * 1000, // Convert to milliseconds
        },
      }),
      prisma.roomMember.update({
        where: { id: member.id },
        data: {
          score: { increment: pointsEarned },
        },
      }),
    ]);

    return {
      isCorrect,
      pointsEarned,
      correctAnswer: correctAnswers,
      newScore: member.score + pointsEarned,
    };
  }

  /**
   * Check if the submitted answer is correct
   */
  private checkAnswer(
    submitted: number | number[],
    correct: number[],
    questionType: string
  ): boolean {
    const submittedArray = Array.isArray(submitted) ? submitted : [submitted];

    if (questionType === 'MULTIPLE') {
      // For multiple choice, all correct answers must be selected
      if (submittedArray.length !== correct.length) return false;
      return correct.every((c) => submittedArray.includes(c));
    } else {
      // For single choice and true/false
      return submittedArray.length === 1 && correct.includes(submittedArray[0]);
    }
  }

  /**
   * Calculate points based on correctness, bet, base points, and speed
   */
  private calculatePoints(
    isCorrect: boolean,
    betAmount: number,
    basePoints: number,
    timeTaken: number,
    timeLimit: number
  ): number {
    if (!isCorrect) {
      // Wrong answer: lose bet amount
      return -betAmount;
    }

    // Correct answer: base points + bet bonus + speed bonus
    // Speed multiplier: 1.0 to 2.0 based on how fast they answered
    const speedRatio = Math.max(0, 1 - timeTaken / timeLimit);
    const speedMultiplier = 1 + speedRatio; // 1.0 to 2.0

    // Calculate total points
    const points = Math.round((basePoints + betAmount) * speedMultiplier);
    return points;
  }

  /**
   * Move to next question (creator only)
   */
  async nextQuestion(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        selectedPack: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.creatorId !== userId) {
      throw new ForbiddenError('Only the room creator can advance questions');
    }

    if (room.status !== 'PLAYING') {
      throw new ValidationError('Game is not in progress');
    }

    const questions = room.selectedPack?.questions || [];
    const nextIndex = room.currentQuestionIndex + 1;

    // Check if there are more questions
    if (nextIndex >= questions.length) {
      // Game finished - update room status
      await this.finishGame(roomId);
      return { finished: true, nextQuestion: null };
    }

    // Update to next question
    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { currentQuestionIndex: nextIndex },
      include: {
        selectedPack: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    const nextQuestion = updatedRoom.selectedPack?.questions[nextIndex];

    return {
      finished: false,
      questionNumber: nextIndex + 1,
      totalQuestions: questions.length,
      question: nextQuestion
        ? {
            id: nextQuestion.id,
            text: nextQuestion.text,
            options: nextQuestion.options,
            questionType: nextQuestion.questionType,
            mediaUrl: nextQuestion.mediaUrl,
            mediaType: nextQuestion.mediaType,
            timeLimit: nextQuestion.timeLimit,
            points: nextQuestion.points,
          }
        : null,
    };
  }

  /**
   * Finish the game and record results
   */
  private async finishGame(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { isActive: true },
          orderBy: { score: 'desc' },
        },
        selectedPack: true,
      },
    });

    if (!room) return;

    const winner = room.members[0];

    // Create game session record and update room status
    await prisma.$transaction([
      prisma.gameSession.create({
        data: {
          roomId,
          packId: room.selectedPackId!,
          winnerId: winner?.userId || null,
          startedAt: room.startedAt || new Date(),
          endedAt: new Date(),
          totalQuestions: room.currentQuestionIndex + 1,
        },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: {
          status: 'FINISHED',
          finishedAt: new Date(),
        },
      }),
      // Increment times played for the pack
      prisma.pack.update({
        where: { id: room.selectedPackId! },
        data: { timesPlayed: { increment: 1 } },
      }),
    ]);
  }
}

export default new GameService();
