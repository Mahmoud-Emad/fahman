/**
 * Game Socket Handler Unit Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockQuestion = {
  id: 'q-1',
  text: 'What is H2O?',
  options: ['Water', 'Oxygen', 'Hydrogen', 'Helium'],
  correctAnswers: [0],
  questionType: 'SINGLE',
  mediaUrl: null,
  mediaType: null,
  timeLimit: 20,
  points: 100,
  orderIndex: 0,
};

const mockQuestion2 = {
  id: 'q-2',
  text: 'What planet is closest to the sun?',
  options: ['Mercury', 'Venus', 'Earth', 'Mars'],
  correctAnswers: [0],
  questionType: 'SINGLE',
  mediaUrl: null,
  mediaType: null,
  timeLimit: 20,
  points: 150,
  orderIndex: 1,
};

const mockRoom = {
  id: 'room-1',
  status: 'PLAYING',
  currentQuestionIndex: 0,
  selectedPack: {
    id: 'pack-1',
    title: 'Science Trivia',
    questions: [mockQuestion, mockQuestion2],
  },
  members: [
    {
      userId: 'user-1',
      isActive: true,
      score: 100,
      user: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
      answers: [{ questionId: 'q-1', isCorrect: true, pointsEarned: 100 }],
    },
    {
      userId: 'user-2',
      isActive: true,
      score: 50,
      user: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: null },
      answers: [{ questionId: 'q-1', isCorrect: false, pointsEarned: -25 }],
    },
  ],
};

const mockFinishedRoom = {
  id: 'room-1',
  members: [
    {
      userId: 'user-1',
      isActive: true,
      score: 350,
      user: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
    },
    {
      userId: 'user-2',
      isActive: true,
      score: 200,
      user: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: null },
    },
  ],
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRoomFindUnique = mock(() => Promise.resolve(mockRoom));
const mockSubmitAnswer = mock(() => Promise.resolve({ isCorrect: true, pointsEarned: 100 }));
const mockNextQuestion = mock(() =>
  Promise.resolve({
    finished: false,
    question: mockQuestion2,
    questionNumber: 2,
    totalQuestions: 2,
  })
);

mock.module('../../config/database', () => ({
  prisma: {
    room: {
      findUnique: mockRoomFindUnique,
    },
  },
}));

mock.module('../../services/gameService', () => ({
  default: {
    submitAnswer: mockSubmitAnswer,
    nextQuestion: mockNextQuestion,
  },
}));

mock.module('../../utils/logger', () => ({
  default: {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
  },
}));

// Import after mocking
import {
  registerGameHandlers,
  broadcastGameStarted,
  cleanupGameRoom,
} from '../../socket/handlers/gameHandlers';

// ---------------------------------------------------------------------------
// Socket/IO mock helpers
// ---------------------------------------------------------------------------

function createMockSocket(userId = 'user-1', username = 'alice') {
  const handlers = new Map<string, Function>();
  const emitted: Array<{ event: string; data: any }> = [];

  return {
    userId,
    username,
    roomIds: new Set<string>(),
    on: mock((event: string, handler: Function) => {
      handlers.set(event, handler);
    }),
    emit: mock((event: string, data: any) => {
      emitted.push({ event, data });
    }),
    to: mock(() => ({
      emit: mock(() => {}),
    })),
    _handlers: handlers,
    _emitted: emitted,
    _trigger: async (event: string, data: any) => {
      const handler = handlers.get(event);
      if (handler) await handler(data);
    },
  };
}

function createMockIO() {
  const toEmitted: Array<{ room: string; event: string; data: any }> = [];

  return {
    to: mock((roomId: string) => ({
      emit: mock((event: string, data: any) => {
        toEmitted.push({ room: roomId, event, data });
      }),
    })),
    _toEmitted: toEmitted,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Game Socket Handlers', () => {
  let socket: ReturnType<typeof createMockSocket>;
  let io: ReturnType<typeof createMockIO>;

  beforeEach(() => {
    socket = createMockSocket();
    io = createMockIO();
    mockRoomFindUnique.mockReset();
    mockSubmitAnswer.mockReset();
    mockNextQuestion.mockReset();
    mockRoomFindUnique.mockResolvedValue(mockRoom as any);
    mockSubmitAnswer.mockResolvedValue({ isCorrect: true, pointsEarned: 100 } as any);
    mockNextQuestion.mockResolvedValue({
      finished: false,
      question: mockQuestion2,
      questionNumber: 2,
      totalQuestions: 2,
    } as any);
    // Clean up any lingering timers
    cleanupGameRoom('room-1');
  });

  describe('registerGameHandlers', () => {
    it('should register game:answer and game:next handlers', () => {
      registerGameHandlers(io as any, socket as any);

      expect(socket.on).toHaveBeenCalledTimes(2);
      expect(socket._handlers.has('game:answer')).toBe(true);
      expect(socket._handlers.has('game:next')).toBe(true);
    });
  });

  // =========================================================================
  // game:answer
  // =========================================================================
  describe('game:answer', () => {
    beforeEach(() => {
      registerGameHandlers(io as any, socket as any);
    });

    it('should submit the answer via gameService', async () => {
      await socket._trigger('game:answer', {
        roomId: 'room-1',
        answer: 0,
        betAmount: 5,
        timeRemaining: 15,
      });

      expect(mockSubmitAnswer).toHaveBeenCalledWith('room-1', 'user-1', {
        answer: 0,
        betAmount: 5,
        timeRemaining: 15,
      });
    });

    it('should broadcast game:playerAnswered to the room', async () => {
      await socket._trigger('game:answer', {
        roomId: 'room-1',
        answer: 0,
        betAmount: 5,
        timeRemaining: 15,
      });

      const broadcast = io._toEmitted.find((e) => e.event === 'game:playerAnswered');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.playerId).toBe('user-1');
    });

    it('should emit error when answer submission fails', async () => {
      mockSubmitAnswer.mockRejectedValue(new Error('Already answered'));

      await socket._trigger('game:answer', {
        roomId: 'room-1',
        answer: 0,
        betAmount: 5,
        timeRemaining: 15,
      });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Already answered');
    });

    it('should handle array answers for multiple choice questions', async () => {
      await socket._trigger('game:answer', {
        roomId: 'room-1',
        answer: [0, 2],
        betAmount: 3,
        timeRemaining: 10,
      });

      expect(mockSubmitAnswer).toHaveBeenCalledWith('room-1', 'user-1', {
        answer: [0, 2],
        betAmount: 3,
        timeRemaining: 10,
      });
    });
  });

  // =========================================================================
  // game:next
  // =========================================================================
  describe('game:next', () => {
    beforeEach(() => {
      registerGameHandlers(io as any, socket as any);
    });

    it('should call nextQuestion on gameService', async () => {
      await socket._trigger('game:next', { roomId: 'room-1' });

      expect(mockNextQuestion).toHaveBeenCalledWith('room-1', 'user-1');
    });

    it('should broadcast game:question when there is a next question', async () => {
      await socket._trigger('game:next', { roomId: 'room-1' });

      const broadcast = io._toEmitted.find((e) => e.event === 'game:question');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.questionNumber).toBe(2);
      expect(broadcast!.data.totalQuestions).toBe(2);
      expect(broadcast!.data.question.id).toBe('q-2');
      expect(broadcast!.data.question.text).toBe('What planet is closest to the sun?');
    });

    it('should broadcast game:finished when the game is over', async () => {
      mockNextQuestion.mockResolvedValue({ finished: true } as any);
      mockRoomFindUnique.mockResolvedValue(mockFinishedRoom as any);

      await socket._trigger('game:next', { roomId: 'room-1' });

      const broadcast = io._toEmitted.find((e) => e.event === 'game:finished');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.winner).toBeDefined();
      expect(broadcast!.data.winner!.id).toBe('user-1');
      expect(broadcast!.data.winner!.score).toBe(350);
      expect(broadcast!.data.finalScores).toHaveLength(2);
      expect(broadcast!.data.finalScores[0].rank).toBe(1);
      expect(broadcast!.data.finalScores[1].rank).toBe(2);
    });

    it('should emit error when nextQuestion fails', async () => {
      mockNextQuestion.mockRejectedValue(new Error('Not the host'));

      await socket._trigger('game:next', { roomId: 'room-1' });

      const errorEmit = socket._emitted.find((e) => e.event === 'error');
      expect(errorEmit).toBeDefined();
      expect(errorEmit!.data.message).toBe('Not the host');
    });

    it('should handle null room gracefully when broadcasting finished', async () => {
      mockNextQuestion.mockResolvedValue({ finished: true } as any);
      mockRoomFindUnique.mockResolvedValue(null);

      // Should not throw
      await socket._trigger('game:next', { roomId: 'room-1' });

      const broadcast = io._toEmitted.find((e) => e.event === 'game:finished');
      expect(broadcast).toBeUndefined();
    });
  });

  // =========================================================================
  // broadcastGameStarted
  // =========================================================================
  describe('broadcastGameStarted', () => {
    it('should emit game:started with pack info', async () => {
      await broadcastGameStarted(io as any, 'room-1');

      const broadcast = io._toEmitted.find((e) => e.event === 'game:started');
      expect(broadcast).toBeDefined();
      expect(broadcast!.data.roomId).toBe('room-1');
      expect(broadcast!.data.totalQuestions).toBe(2);
      expect(broadcast!.data.packTitle).toBe('Science Trivia');
    });

    it('should do nothing when room is not found', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await broadcastGameStarted(io as any, 'room-missing');

      expect(io._toEmitted).toHaveLength(0);
    });

    it('should do nothing when room has no selected pack', async () => {
      mockRoomFindUnique.mockResolvedValue({ id: 'room-1', selectedPack: null } as any);

      await broadcastGameStarted(io as any, 'room-1');

      expect(io._toEmitted).toHaveLength(0);
    });
  });

  // =========================================================================
  // cleanupGameRoom
  // =========================================================================
  describe('cleanupGameRoom', () => {
    it('should not throw when cleaning up room with no timer', () => {
      expect(() => cleanupGameRoom('room-nonexistent')).not.toThrow();
    });
  });
});
