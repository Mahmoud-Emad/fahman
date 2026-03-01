/**
 * Game type definitions
 */
import type { Player, ChatMessage } from "@/components/lobby/types";
import { GAME_TIMING, BETTING } from "@/constants";

// Re-export Player and ChatMessage for convenience
export type { Player, ChatMessage };

/**
 * Player result from server after question grading
 */
export interface PlayerResult {
  playerId: string;
  username: string;
  isCorrect: boolean;
  pointsEarned: number;
  newScore: number;
}

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
  questionId: string;
  options: string[];
  questionType: string;

  // Timer state
  timeLeft: number;

  // Phase
  gamePhase: GamePhase;

  // Player answer state
  selectedAnswer: number | null;
  selectedBet: number | null;
  usedBets: number[];
  hasSubmitted: boolean;
  playerScore: number;

  // Results state
  correctAnswer: number[] | null;
  questionResults: PlayerResult[] | null;
  playersAnswered: string[];
  totalPlayers: number;

  // Room state
  isHost: boolean;
  roomSettings: RoomSettings;

  // Final results
  winner: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
  } | null;
  finalScores: {
    playerId: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
    rank: number;
  }[];
}

/**
 * Game state actions for handlers
 */
export interface GameStateActions {
  setSelectedAnswer: (answer: number | null) => void;
  setSelectedBet: (bet: number | null) => void;
  setGamePhase: (phase: GamePhase) => void;
  setTimeLeft: (time: number) => void;
  setHasSubmitted: (submitted: boolean) => void;
  setPlayerScore: (score: number) => void;
  setUsedBets: (updater: (prev: number[]) => number[]) => void;
  setCurrentQuestion: (question: number) => void;
  setTotalQuestions: (total: number) => void;
  setQuestionText: (text: string) => void;
  setQuestionId: (id: string) => void;
  setOptions: (options: string[]) => void;
  setQuestionType: (type: string) => void;
  setCorrectAnswer: (answer: number[] | null) => void;
  setQuestionResults: (results: PlayerResult[] | null) => void;
  setPlayersAnswered: (updater: (prev: string[]) => string[]) => void;
  setTotalPlayers: (total: number) => void;
  setPlayers: (updater: (prev: Player[]) => Player[]) => void;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setWinner: (winner: GameState["winner"]) => void;
  setFinalScores: (scores: GameState["finalScores"]) => void;
}

/**
 * Default room settings
 */
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxBet: BETTING.DEFAULT_MAX_BET,
  timerDuration: GAME_TIMING.DEFAULT_TIMER_DURATION,
};
