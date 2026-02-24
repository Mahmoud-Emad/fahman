/**
 * useGameState - Consolidated game state management
 */
import { useState, useEffect } from "react";
import { BackHandler } from "react-native";
import type { Player, ChatMessage, GamePhase, RoomSettings } from "../types";
import { DEFAULT_ROOM_SETTINGS } from "../types";

interface UseGameStateOptions {
  initialSettings?: RoomSettings;
  onBackPress?: () => void;
}

/**
 * Hook for managing game state
 */
export function useGameState(options: UseGameStateOptions = {}) {
  const { initialSettings = DEFAULT_ROOM_SETTINGS, onBackPress } = options;

  // Room settings
  const [roomSettings] = useState<RoomSettings>(initialSettings);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions] = useState(20);
  const [questionText, setQuestionText] = useState("What duck says?");

  // Timer state
  const [timeLeft, setTimeLeft] = useState(roomSettings.timerDuration);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Game phase
  const [gamePhase, setGamePhase] = useState<GamePhase>("answering");

  // Player answer state
  const [answer, setAnswer] = useState("");
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [usedBets, setUsedBets] = useState<number[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);

  // Host state
  const [isHost] = useState(false);

  // Leave dialog state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Players and messages
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Current user ID (mock)
  const currentUserId = "current-user";

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

  // Timer countdown
  useEffect(() => {
    if (!isTimerActive || timeLeft <= 0 || gamePhase !== "answering") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          setGamePhase("lobby");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft, gamePhase]);

  // Generate bet cards based on maxBet setting
  const betCards = Array.from({ length: roomSettings.maxBet }, (_, i) => i + 1);

  return {
    // Room settings
    roomSettings,

    // Question state
    currentQuestion,
    setCurrentQuestion,
    totalQuestions,
    questionText,
    setQuestionText,

    // Timer state
    timeLeft,
    setTimeLeft,
    isTimerActive,
    setIsTimerActive,

    // Game phase
    gamePhase,
    setGamePhase,

    // Player answer state
    answer,
    setAnswer,
    selectedBet,
    setSelectedBet,
    usedBets,
    setUsedBets,
    hasSubmitted,
    setHasSubmitted,
    playerScore,
    setPlayerScore,

    // Host state
    isHost,

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
