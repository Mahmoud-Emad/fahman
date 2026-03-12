/**
 * useGameHandlers - Game action handlers wired to socket emissions
 */
import { useCallback, useState, type MutableRefObject } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { Player, ChatMessage, GamePhase, RoomSettings } from "../types";
import type { RootStackParamList } from "../../../../App";
import { socketService } from "@/services/socketService";
import { roomsService } from "@/services/roomsService";
import { friendsService } from "@/services/friendsService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";

type NavigationProp = StackNavigationProp<RootStackParamList, "RoomDetails">;

interface UseGameHandlersOptions {
  // Room ID for socket emissions
  roomId: string;

  // State values
  selectedAnswer: string;
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

  // Guard ref to prevent double navigation on leave
  hasLeftRoom: MutableRefObject<boolean>;

  // Messaging callbacks (optional)
  onOpenNotifications?: () => void;
  onOpenChatsList?: () => void;
  onOpenFriendsList?: () => void;
}

/**
 * Hook for game action handlers — emits to socket instead of local state
 */
export function useGameHandlers(options: UseGameHandlersOptions) {
  const navigation = useNavigation<NavigationProp>();
  const toast = useToast();
  const [removeFriendConfirm, setRemoveFriendConfirm] = useState<{
    visible: boolean;
    playerId: string | null;
  }>({ visible: false, playerId: null });

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
    hasLeftRoom,
    onOpenNotifications,
    onOpenChatsList,
    onOpenFriendsList,
  } = options;

  // Handle answer submission — emit to server
  const handleSubmitAnswer = useCallback(() => {
    if (!selectedAnswer.trim() || selectedBet === null || hasSubmitted) return;

    socketService.submitAnswer(roomId, selectedAnswer.trim(), selectedBet);
    setHasSubmitted(true);

    // Track used bet
    setUsedBets((prev) => [...prev, selectedBet]);
  }, [roomId, selectedAnswer, selectedBet, hasSubmitted, setHasSubmitted, setUsedBets]);

  // Handle next question — host emits to server
  const handleNextQuestion = useCallback(() => {
    socketService.nextQuestion(roomId);
  }, [roomId]);

  // Handle sending chat message — emit to socket + add locally
  const handleSendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;

      // Emit to socket for real-time broadcast
      socketService.sendChatMessage(roomId, message.trim());

      // Add to local state immediately for instant feedback
      const newMessage: ChatMessage = {
        id: String(Date.now()),
        senderId: currentUserId,
        senderName: "You",
        senderInitials: "YO",
        message: message.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, newMessage]);
    },
    [roomId, currentUserId, setMessages]
  );

  // Handle player actions (from menu)
  const handlePlayerAction = useCallback(
    async (action: string, playerId: string) => {
      if (action === "view_profile") {
        navigation.navigate("UserProfile", { userId: playerId });
        return;
      }

      if (action === "add_friend") {
        // Read current friend status from player state
        let isFriend = false;
        setPlayers((prev) => {
          isFriend = !!prev.find((p) => p.id === playerId)?.isFriend;
          return prev;
        });

        if (isFriend) {
          setRemoveFriendConfirm({ visible: true, playerId });
          return;
        }

        // Send friend request
        try {
          const response = await friendsService.sendFriendRequest(playerId);
          if (response.success) {
            toast.success("Friend request sent!");
            setPlayers((prev) =>
              prev.map((p) => (p.id === playerId ? { ...p, friendRequestSent: true } : p))
            );
          } else {
            toast.error(response.message || "Failed to send request");
          }
        } catch (error) {
          toast.error(getErrorMessage(error));
        }
        return;
      }

      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id !== playerId) return p;
          switch (action) {
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
    [setPlayers, navigation, toast]
  );

  // Confirm remove friend — called from dialog
  const confirmRemoveFriend = useCallback(async () => {
    if (!removeFriendConfirm.playerId) return;
    const playerId = removeFriendConfirm.playerId;
    try {
      const response = await friendsService.removeFriend(playerId);
      if (response.success) {
        toast.success("Friend removed");
        setPlayers((prev) =>
          prev.map((p) => (p.id === playerId ? { ...p, isFriend: false } : p))
        );
      } else {
        toast.error(response.message || "Failed to remove friend");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemoveFriendConfirm({ visible: false, playerId: null });
    }
  }, [removeFriendConfirm.playerId, setPlayers, toast]);

  // Cancel remove friend — dismiss dialog
  const cancelRemoveFriend = useCallback(() => {
    setRemoveFriendConfirm({ visible: false, playerId: null });
  }, []);

  // Handle leave room — call REST API then navigate home
  const handleLeaveRoom = useCallback(async () => {
    if (hasLeftRoom.current) return;
    hasLeftRoom.current = true;
    setShowLeaveDialog(false);
    try {
      await roomsService.leaveRoom(roomId);
    } catch {
      // Leave silently — navigation proceeds regardless
    }
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  }, [roomId, navigation, setShowLeaveDialog, hasLeftRoom]);

  // Handle bottom nav tab press
  const handleBottomTabPress = useCallback(
    (tabId: string) => {
      if (tabId === "rooms") {
        navigation.navigate("Rooms");
      } else if (tabId === "friends") {
        onOpenFriendsList?.();
      } else if (tabId === "chats") {
        onOpenChatsList?.();
      } else if (tabId === "notifications") {
        onOpenNotifications?.();
      } else if (tabId === "profile") {
        navigation.navigate("Profile");
      }
    },
    [onOpenFriendsList, onOpenChatsList, onOpenNotifications, navigation]
  );

  return {
    handleSubmitAnswer,
    handleNextQuestion,
    handleSendMessage,
    handlePlayerAction,
    handleLeaveRoom,
    handleBottomTabPress,
    removeFriendConfirm,
    confirmRemoveFriend,
    cancelRemoveFriend,
  };
}
