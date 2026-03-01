/**
 * Game component exports
 */

// Types
export type {
  Player,
  ChatMessage,
  RoomSettings,
  GamePhase,
  GameState,
  GameStateActions,
  PlayerResult,
} from "./types";
export { DEFAULT_ROOM_SETTINGS } from "./types";

// UI Components
export { TimerDisplay, BetCard } from "./GameComponents";
export { GameHeader } from "./GameHeader";
export { SubmitButton, WaitingIndicator } from "./BottomActions";

// Phase Components
export {
  AnsweringPhase,
  LobbyPhase,
  WaitingPhase,
  ResultsPhase,
} from "./phases";

// Hooks
export { useGameState, useGameHandlers, useGameSocket } from "./hooks";

// Results components
export { Confetti, WinnerCard } from "./ResultsStatsCard";
export type { Winner } from "./ResultsStatsCard";
export { Podium, LeaderboardRow, getInitials, getMedalColor, getRankSuffix } from "./ResultsLeaderboard";
export type { PlayerScore } from "./ResultsLeaderboard";
