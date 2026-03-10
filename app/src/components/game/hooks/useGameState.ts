/**
 * useGameState - Game state management (socket-driven, no mock data)
 */
import { useState, useEffect } from "react";
import { BackHandler } from "react-native";
import type { Player, ChatMessage, GamePhase, GameState, PlayerResult, RoomSettings } from "../types";
import { DEFAULT_ROOM_SETTINGS } from "../types";
import { useAuth } from "@/hooks";

interface UseGameStateOptions {
  initialSettings?: RoomSettings;
  isHost?: boolean;
  onBackPress?: () => void;
}

/**
 * Hook for managing game state — all values are driven by socket events
 */
export function useGameState(config: UseGameStateOptions = {}) {
  const { initialSettings = DEFAULT_ROOM_SETTINGS, isHost: initialIsHost = false, onBackPress } = config;
  const { user } = useAuth();

  // Room settings
  const [roomSettings] = useState<RoomSettings>(initialSettings);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionText, setQuestionText] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [questionType, setQuestionType] = useState("SINGLE");

  // Timer state (driven by server game:timerTick)
  const [timeLeft, setTimeLeft] = useState(0);

  // Game phase — starts at "waiting"
  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting");

  // Player answer state
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [usedBets, setUsedBets] = useState<number[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);

  // Results state
  const [correctAnswer, setCorrectAnswer] = useState<number[] | null>(null);
  const [questionResults, setQuestionResults] = useState<PlayerResult[] | null>(null);
  const [playersAnswered, setPlayersAnswered] = useState<string[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);

  // Host state
  const [isHost] = useState(initialIsHost);

  // Pack hint
  const [textHint, setTextHint] = useState<string | null>(null);

  // Final results
  const [winner, setWinner] = useState<GameState["winner"]>(null);
  const [finalScores, setFinalScores] = useState<GameState["finalScores"]>([]);

  // Leave dialog state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Players and messages
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Real user ID
  const currentUserId = user?.id ?? "";

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (onBackPress) {
        onBackPress();
      } else {
        setShowLeaveDialog(true);
      }
      return true;
    });

    return () => backHandler.remove();
  }, [onBackPress]);

  // Bet cards based on maxBet setting
  const betCards = Array.from({ length: roomSettings.maxBet }, (_, i) => i + 1);

  return {
    // Room settings
    roomSettings,

    // Question state
    currentQuestion,
    setCurrentQuestion,
    totalQuestions,
    setTotalQuestions,
    questionText,
    setQuestionText,
    questionId,
    setQuestionId,
    options,
    setOptions,
    questionType,
    setQuestionType,

    // Timer state
    timeLeft,
    setTimeLeft,

    // Game phase
    gamePhase,
    setGamePhase,

    // Player answer state
    selectedAnswer,
    setSelectedAnswer,
    selectedBet,
    setSelectedBet,
    usedBets,
    setUsedBets,
    hasSubmitted,
    setHasSubmitted,
    playerScore,
    setPlayerScore,

    // Results state
    correctAnswer,
    setCorrectAnswer,
    questionResults,
    setQuestionResults,
    playersAnswered,
    setPlayersAnswered,
    totalPlayers,
    setTotalPlayers,

    // Host state
    isHost,

    // Pack hint
    textHint,
    setTextHint,

    // Final results
    winner,
    setWinner,
    finalScores,
    setFinalScores,

    // Leave dialog
    showLeaveDialog,
    setShowLeaveDialog,

    // Players and messages
    players,
    setPlayers,
    messages,
    setMessages,

    // Current user
    currentUserId,

    // Computed values
    betCards,
  };
}
