/**
 * useGameHandlers - Game action handlers wired to socket emissions
 */
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { Player, ChatMessage, GamePhase, RoomSettings } from "../types";
import type { RootStackParamList } from "../../../../App";
import { socketService } from "@/services/socketService";

type NavigationProp = StackNavigationProp<RootStackParamList, "RoomDetails">;

interface UseGameHandlersOptions {
  // Room ID for socket emissions
  roomId: string;

  // State values
  selectedAnswer: number | null;
  selectedBet: number | null;
  hasSubmitted: boolean;
  timeLeft: number;
  roomSettings: RoomSettings;
  currentUserId: string;

  // State setters
  setHasSubmitted: (value: boolean) => void;
  setShowLeaveDialog: (value: boolean) => void;
  setUsedBets: (updater: (prev: number[]) => number[]) => void;
  setPlayers: (updater: (prev: Player[]) => Player[]) => void;
  setMessages: (updater: (prev: ChatMessage[]) => ChatMessage[]) => void;

  // Messaging callbacks (optional)
  onOpenNotifications?: () => void;
  onOpenChatsList?: () => void;
}

/**
 * Hook for game action handlers — emits to socket instead of local state
 */
export function useGameHandlers(options: UseGameHandlersOptions) {
  const navigation = useNavigation<NavigationProp>();
  const {
    roomId,
    selectedAnswer,
    selectedBet,
    hasSubmitted,
    timeLeft,
    currentUserId,
    setHasSubmitted,
    setShowLeaveDialog,
    setUsedBets,
    setPlayers,
    setMessages,
    onOpenNotifications,
    onOpenChatsList,
  } = options;

  // Handle answer submission — emit to server
  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer === null || selectedBet === null || hasSubmitted) return;

    socketService.submitAnswer(roomId, selectedAnswer, selectedBet, timeLeft);
    setHasSubmitted(true);

    // Track used bet
    setUsedBets((prev) => [...prev, selectedBet]);
  }, [roomId, selectedAnswer, selectedBet, hasSubmitted, timeLeft, setHasSubmitted, setUsedBets]);

  // Handle next question — host emits to server
  const handleNextQuestion = useCallback(() => {
    socketService.nextQuestion(roomId);
  }, [roomId]);

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

  return {
    handleSubmitAnswer,
    handleNextQuestion,
    handleSendMessage,
    handlePlayerAction,
    handleLeaveRoom,
    handleBottomTabPress,
  };
}
