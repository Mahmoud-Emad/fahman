/**
 * Game type definitions
 */
import type { Player, ChatMessage } from "@/components/lobby/types";
import { GAME_TIMING, BETTING, QUESTIONS } from "@/constants";

// Re-export Player and ChatMessage for convenience
export type { Player, ChatMessage };

/**
 * Room settings configuration
 */
export interface RoomSettings {
  maxBet: number; // 1-20
  timerDuration: number; // seconds
}

/**
 * Game phase types
 */
export type GamePhase = "waiting" | "answering" | "lobby" | "results";

/**
 * Game state for the room
 */
export interface GameState {
  // Question state
  currentQuestion: number;
  totalQuestions: number;
  questionText: string;

  // Timer state
  timeLeft: number;
  isTimerActive: boolean;

  // Phase
  gamePhase: GamePhase;

  // Player answer state
  answer: string;
  selectedBet: number | null;
  usedBets: number[];
  hasSubmitted: boolean;
  playerScore: number;

  // Room state
  isHost: boolean;
  roomSettings: RoomSettings;
}

/**
 * Game state actions for handlers
 */
export interface GameStateActions {
  setAnswer: (answer: string) => void;
  setSelectedBet: (bet: number | null) => void;
  setGamePhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  setIsTimerActive: (active: boolean) => void;
  setHasSubmitted: (submitted: boolean) => void;
  setPlayerScore: (score: number) => void;
  setUsedBets: (updater: (prev: number[]) => number[]) => void;
  setCurrentQuestion: (updater: (prev: number) => number) => void;
  setQuestionText: (text: string) => void;
  setPlayers: (updater: (prev: Player[]) => Player[]) => void;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
}

/**
 * Default room settings
 */
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxBet: BETTING.DEFAULT_MAX_BET,
  timerDuration: GAME_TIMING.DEFAULT_TIMER_DURATION,
};

/**
 * Default game state
 */
export const createInitialGameState = (settings: RoomSettings = DEFAULT_ROOM_SETTINGS): GameState => ({
  currentQuestion: 1,
  totalQuestions: QUESTIONS.DEFAULT_TOTAL,
  questionText: "What duck says?",
  timeLeft: settings.timerDuration,
  isTimerActive: true,
  gamePhase: "answering",
  answer: "",
  selectedBet: null,
  usedBets: [],
  hasSubmitted: false,
  playerScore: 0,
  isHost: false,
  roomSettings: settings,
});
