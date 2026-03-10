/**
 * Game Socket Event Handlers
 */

import { Server } from 'socket.io';
import { prisma } from '../../config/database';
import gameService from '../../modules/game/gameService';
import {
  AuthenticatedSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  QuestionData,
  QuestionResultsData,
  GameFinishedData,
  PlayerScore,
} from '../types';
import logger from '../../shared/utils/logger';

// Track active game timers
const gameTimers: Map<string, NodeJS.Timeout> = new Map();

export function registerGameHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: AuthenticatedSocket
): void {
  /**
   * Submit answer via WebSocket
   */
  socket.on('game:answer', async ({ roomId, answer, betAmount, timeRemaining }) => {
    try {
      const result = await gameService.submitAnswer(roomId, socket.userId, {
        answer,
        betAmount,
        timeRemaining,
      });

      // Notify all players that this player answered
      io.to(roomId).emit('game:playerAnswered', {
        roomId,
        playerId: socket.userId,
      });

      // Check if all players have answered
      const allAnswered = await checkAllAnswered(roomId);
      if (allAnswered) {
        // Clear timer and show results
        clearGameTimer(roomId);
        await broadcastQuestionResults(io, roomId);
      }

      logger.info(`${socket.username} answered in room ${roomId}: correct=${result.isCorrect}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit answer';
      logger.error(`Error submitting answer: ${msg}`);
      socket.emit('error', { message: msg });
    }
  });

  /**
   * Move to next question (creator only)
   */
  socket.on('game:next', async ({ roomId }) => {
    try {
      const result = await gameService.nextQuestion(roomId, socket.userId);

      if (result.finished) {
        // Game finished - broadcast final results
        await broadcastGameFinished(io, roomId);
      } else if (result.question) {
        // Broadcast next question
        const room = await prisma.room.findUnique({
          where: { id: roomId },
          include: {
            selectedPack: {
              include: {
                questions: { orderBy: { orderIndex: 'asc' } },
              },
            },
          },
        });

        if (room) {
          const questionData: QuestionData = {
            roomId,
            questionNumber: result.questionNumber!,
            totalQuestions: result.totalQuestions!,
            question: {
              id: result.question.id,
              text: result.question.text,
              options: result.question.options as string[],
              questionType: result.question.questionType,
              mediaUrl: result.question.mediaUrl,
              mediaType: result.question.mediaType,
              timeLimit: result.question.timeLimit,
              points: result.question.points,
            },
          };

          io.to(roomId).emit('game:question', questionData);

          // Start timer for this question
          startQuestionTimer(io, roomId, result.question.timeLimit);
        }
      }

      logger.info(`Game next in room ${roomId}: finished=${result.finished}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to move to next question';
      logger.error(`Error moving to next question: ${msg}`);
      socket.emit('error', { message: msg });
    }
  });
}

/**
 * Start a game and broadcast to all players
 */
export async function broadcastGameStarted(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): Promise<void> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      selectedPack: {
        include: {
          questions: { orderBy: { orderIndex: 'asc' } },
        },
      },
    },
  });

  if (!room || !room.selectedPack) return;

  // Emit game started
  io.to(roomId).emit('game:started', {
    roomId,
    totalQuestions: room.selectedPack.questions.length,
    packTitle: room.selectedPack.title,
    textHint: room.selectedPack.textHint || null,
  });

  // Send first question
  const firstQuestion = room.selectedPack.questions[0];
  if (firstQuestion) {
    const questionData: QuestionData = {
      roomId,
      questionNumber: 1,
      totalQuestions: room.selectedPack.questions.length,
      question: {
        id: firstQuestion.id,
        text: firstQuestion.text,
        options: firstQuestion.options as string[],
        questionType: firstQuestion.questionType,
        mediaUrl: firstQuestion.mediaUrl,
        mediaType: firstQuestion.mediaType,
        timeLimit: firstQuestion.timeLimit,
        points: firstQuestion.points,
      },
    };

    // Small delay before sending question
    setTimeout(() => {
      io.to(roomId).emit('game:question', questionData);
      startQuestionTimer(io, roomId, firstQuestion.timeLimit);
    }, 2000);
  }
}

/**
 * Start countdown timer for a question
 */
function startQuestionTimer(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  timeLimit: number
): void {
  // Clear any existing timer
  clearGameTimer(roomId);

  let timeLeft = timeLimit;

  const timer = setInterval(async () => {
    timeLeft--;

    if (timeLeft >= 0) {
      // Broadcast timer tick every second
      io.to(roomId).emit('game:timerTick', { roomId, timeLeft });
    }

    if (timeLeft <= 0) {
      // Time's up - show results
      clearGameTimer(roomId);
      await broadcastQuestionResults(io, roomId);
    }
  }, 1000);

  gameTimers.set(roomId, timer);
}

/**
 * Clear game timer
 */
function clearGameTimer(roomId: string): void {
  const timer = gameTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    gameTimers.delete(roomId);
  }
}

/**
 * Check if all active players have answered the current question
 */
async function checkAllAnswered(roomId: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      selectedPack: {
        include: {
          questions: { orderBy: { orderIndex: 'asc' } },
        },
      },
      members: {
        where: { isActive: true },
        include: {
          answers: true,
        },
      },
    },
  });

  if (!room || !room.selectedPack) return false;

  const currentQuestion = room.selectedPack.questions[room.currentQuestionIndex];
  if (!currentQuestion) return false;

  // Count players who answered this question
  const answeredCount = room.members.filter((m) =>
    m.answers.some((a) => a.questionId === currentQuestion.id)
  ).length;

  return answeredCount >= room.members.length;
}

/**
 * Broadcast question results to all players
 */
async function broadcastQuestionResults(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): Promise<void> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      selectedPack: {
        include: {
          questions: { orderBy: { orderIndex: 'asc' } },
        },
      },
      members: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, username: true },
          },
          answers: true,
        },
        orderBy: { score: 'desc' },
      },
    },
  });

  if (!room || !room.selectedPack) return;

  const currentQuestion = room.selectedPack.questions[room.currentQuestionIndex];
  if (!currentQuestion) return;

  // Build results
  const playerResults = room.members.map((m) => {
    const answer = m.answers.find((a) => a.questionId === currentQuestion.id);
    return {
      playerId: m.user.id,
      username: m.user.username,
      isCorrect: answer?.isCorrect || false,
      pointsEarned: answer?.pointsEarned || 0,
      newScore: m.score,
    };
  });

  const resultsData: QuestionResultsData = {
    roomId,
    questionId: currentQuestion.id,
    correctAnswer: currentQuestion.correctAnswers as number[],
    playerResults,
  };

  io.to(roomId).emit('game:questionResults', resultsData);

  // Also broadcast updated scores
  broadcastScoreUpdate(io, roomId, room.members);
}

/**
 * Broadcast score update
 */
function broadcastScoreUpdate(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  members: any[]
): void {
  const scores: PlayerScore[] = members
    .sort((a, b) => b.score - a.score)
    .map((m, index) => ({
      playerId: m.user.id,
      username: m.user.username,
      displayName: m.user.displayName,
      avatar: m.user.avatar,
      score: m.score,
      rank: index + 1,
    }));

  io.to(roomId).emit('game:scoreUpdate', { roomId, scores });
}

/**
 * Broadcast game finished
 */
async function broadcastGameFinished(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): Promise<void> {
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

  if (!room) return;

  const winner = room.members[0];
  const finalScores: PlayerScore[] = room.members.map((m, index) => ({
    playerId: m.user.id,
    username: m.user.username,
    displayName: m.user.displayName,
    avatar: m.user.avatar,
    score: m.score,
    rank: index + 1,
  }));

  const finishedData: GameFinishedData = {
    roomId,
    winner: winner
      ? {
          id: winner.user.id,
          username: winner.user.username,
          displayName: winner.user.displayName,
          avatar: winner.user.avatar,
          score: winner.score,
        }
      : null,
    finalScores,
  };

  io.to(roomId).emit('game:finished', finishedData);

  // Clear any remaining timer
  clearGameTimer(roomId);
}

/**
 * Clean up when room is closed
 */
export function cleanupGameRoom(roomId: string): void {
  clearGameTimer(roomId);
}
