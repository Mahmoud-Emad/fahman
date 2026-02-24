/**
 * useGameHandlers - Game action handlers
 */
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { Player, ChatMessage, GamePhase, RoomSettings } from "../types";
import type { RootStackParamList } from "../../../../App";

type NavigationProp = StackNavigationProp<RootStackParamList, "RoomDetails">;

interface UseGameHandlersOptions {
  // State values
  answer: string;
  selectedBet: number | null;
  hasSubmitted: boolean;
  currentQuestion: number;
  totalQuestions: number;
  roomSettings: RoomSettings;
  currentUserId: string;

  // State setters
  setHasSubmitted: (value: boolean) => void;
  setGamePhase: (phase: GamePhase) => void;
  setPlayers: (updater: (prev: Player[]) => Player[]) => void;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  setShowLeaveDialog: (value: boolean) => void;
  setUsedBets: (updater: (prev: number[]) => number[]) => void;
  setCurrentQuestion: (updater: (prev: number) => number) => void;
  setQuestionText: (text: string) => void;
  setTimeLeft: (time: number) => void;
  setIsTimerActive: (active: boolean) => void;
  setAnswer: (answer: string) => void;
  setSelectedBet: (bet: number | null) => void;

  // Messaging callbacks (optional)
  onOpenNotifications?: () => void;
  onOpenChatsList?: () => void;
}

/**
 * Hook for game action handlers
 */
export function useGameHandlers(options: UseGameHandlersOptions) {
  const navigation = useNavigation<NavigationProp>();
  const {
    answer,
    selectedBet,
    hasSubmitted,
    currentQuestion,
    totalQuestions,
    roomSettings,
    currentUserId,
    setHasSubmitted,
    setGamePhase,
    setPlayers,
    setMessages,
    setShowLeaveDialog,
    setUsedBets,
    setCurrentQuestion,
    setQuestionText,
    setTimeLeft,
    setIsTimerActive,
    setAnswer,
    setSelectedBet,
    onOpenNotifications,
    onOpenChatsList,
  } = options;

  // Handle answer submission
  const handleSubmitAnswer = useCallback(() => {
    if (!answer.trim() || selectedBet === null || hasSubmitted) return;

    setHasSubmitted(true);
    setGamePhase("lobby");
    console.log("Submitted:", { answer, bet: selectedBet });
  }, [answer, selectedBet, hasSubmitted, setHasSubmitted, setGamePhase]);

  // Handle marking player answer (host only)
  const handleMarkPlayer = useCallback(
    (playerId: string, isCorrect: boolean) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerId
            ? { ...p, isCorrect, score: isCorrect ? p.score + 5 : p.score - 5 }
            : p
        )
      );
    },
    [setPlayers]
  );

  // Handle sending chat message
  const handleSendMessage = useCallback(
    (message: string) => {
      const newMessage: ChatMessage = {
        id: String(Date.now()),
        senderId: currentUserId,
        senderName: "You",
        senderInitials: "YO",
        message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [currentUserId, setMessages]
  );

  // Handle player actions (from menu)
  const handlePlayerAction = useCallback(
    (action: string, playerId: string) => {
      // Handle view_profile action - navigate to user profile
      if (action === "view_profile") {
        navigation.navigate("UserProfile", { userId: playerId });
        return;
      }

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          switch (action) {
            case "add_friend":
              if (p.isFriend) {
                return { ...p, isFriend: false };
              }
              return { ...p, friendRequestSent: true };
            case "mute":
              return { ...p, isMuted: !p.isMuted };
            case "block":
              return { ...p, isBlocked: !p.isBlocked };
            case "hit":
              console.log("Hit player:", playerId);
              return p;
            case "message":
              console.log("Message player:", playerId);
              return p;
            default:
              return p;
          }
        })
      );
    },
    [setPlayers, navigation]
  );

  // Handle leave room
  const handleLeaveRoom = useCallback(() => {
    setShowLeaveDialog(false);
    navigation.goBack();
  }, [navigation, setShowLeaveDialog]);

  // Handle bottom nav tab press
  const handleBottomTabPress = useCallback(
    (tabId: string) => {
      if (tabId === "leave") {
        setShowLeaveDialog(true);
      } else if (tabId === "chats") {
        onOpenChatsList?.();
      } else if (tabId === "notifications") {
        onOpenNotifications?.();
      } else if (tabId === "profile") {
        navigation.navigate("Profile");
      }
    },
    [setShowLeaveDialog, onOpenChatsList, onOpenNotifications, navigation]
  );

  // Handle next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestion >= totalQuestions) {
      setGamePhase("results");
      return;
    }

    if (selectedBet !== null) {
      setUsedBets((prev) => [...prev, selectedBet]);
    }

    setCurrentQuestion((prev) => prev + 1);
    setQuestionText("Next question goes here...");
    setTimeLeft(roomSettings.timerDuration);
    setIsTimerActive(true);
    setGamePhase("answering");
    setAnswer("");
    setSelectedBet(null);
    setHasSubmitted(false);
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, hasAnswered: false, answer: undefined, isCorrect: undefined }))
    );
    setMessages([]);
  }, [
    currentQuestion,
    totalQuestions,
    selectedBet,
    roomSettings.timerDuration,
    setGamePhase,
    setUsedBets,
    setCurrentQuestion,
    setQuestionText,
    setTimeLeft,
    setIsTimerActive,
    setAnswer,
    setSelectedBet,
    setHasSubmitted,
    setPlayers,
    setMessages,
  ]);

  return {
    handleSubmitAnswer,
    handleMarkPlayer,
    handleSendMessage,
    handlePlayerAction,
    handleLeaveRoom,
    handleBottomTabPress,
    handleNextQuestion,
  };
}
