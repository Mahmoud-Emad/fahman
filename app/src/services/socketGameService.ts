/**
 * Socket Game Service — game:answer, game:next, game flow events
 */

import type { Socket } from 'socket.io-client';
import type {
  SocketAccessor,
  SocketListeners,
  GameStartedHandler,
  QuestionHandler,
  PlayerAnsweredHandler,
  QuestionResultsHandler,
  TimerTickHandler,
  GameFinishedHandler,
  ScoreUpdateHandler,
} from './socketTypes';

/**
 * Register socket.on handlers for game events
 */
export function setupGameHandlers(socket: Socket, listeners: SocketListeners): void {
  socket.on('game:started', (data) => {
    listeners.gameStarted.forEach((handler) => handler(data));
  });

  socket.on('game:question', (data) => {
    listeners.question.forEach((handler) => handler(data));
  });

  socket.on('game:playerAnswered', (data) => {
    listeners.playerAnswered.forEach((handler) => handler(data));
  });

  socket.on('game:questionResults', (data) => {
    listeners.questionResults.forEach((handler) => handler(data));
  });

  socket.on('game:timerTick', (data) => {
    listeners.timerTick.forEach((handler) => handler(data));
  });

  socket.on('game:finished', (data) => {
    listeners.gameFinished.forEach((handler) => handler(data));
  });

  socket.on('game:scoreUpdate', (data) => {
    listeners.scoreUpdate.forEach((handler) => handler(data));
  });
}

// ============================================
// Client → Server emitters
// ============================================

export function submitAnswer(
  accessor: SocketAccessor,
  roomId: string,
  answer: string,
  betAmount: number,
): void {
  accessor.getSocket()?.emit('game:answer', { roomId, answer, betAmount });
}

export function nextQuestion(accessor: SocketAccessor, roomId: string): void {
  accessor.getSocket()?.emit('game:next', { roomId });
}

// ============================================
// Subscription helpers
// ============================================

export function onGameStarted(accessor: SocketAccessor, handler: GameStartedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.gameStarted.add(handler);
  return () => { listeners.gameStarted.delete(handler); };
}

export function onQuestion(accessor: SocketAccessor, handler: QuestionHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.question.add(handler);
  return () => { listeners.question.delete(handler); };
}

export function onPlayerAnswered(accessor: SocketAccessor, handler: PlayerAnsweredHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.playerAnswered.add(handler);
  return () => { listeners.playerAnswered.delete(handler); };
}

export function onQuestionResults(accessor: SocketAccessor, handler: QuestionResultsHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.questionResults.add(handler);
  return () => { listeners.questionResults.delete(handler); };
}

export function onTimerTick(accessor: SocketAccessor, handler: TimerTickHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.timerTick.add(handler);
  return () => { listeners.timerTick.delete(handler); };
}

export function onGameFinished(accessor: SocketAccessor, handler: GameFinishedHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.gameFinished.add(handler);
  return () => { listeners.gameFinished.delete(handler); };
}

export function onScoreUpdate(accessor: SocketAccessor, handler: ScoreUpdateHandler): () => void {
  const listeners = accessor.getListeners();
  listeners.scoreUpdate.add(handler);
  return () => { listeners.scoreUpdate.delete(handler); };
}
