/**
 * useRoomDialogs - Hook for room dialog/modal state management
 */
import { useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RoomData } from "../types";
import { roomsService } from "@/services/roomsService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import type { RootStackParamList } from "../../../../App";

type NavigationProp = StackNavigationProp<RootStackParamList, "Rooms">;

interface UseRoomDialogsReturn {
  // Join modal state
  joinModalVisible: boolean;
  joinModalMode: "id" | "password";
  setJoinModalVisible: (visible: boolean) => void;
  isJoining: boolean;

  // Room details dialog state
  selectedRoom: RoomData | null;
  detailsDialogVisible: boolean;
  setDetailsDialogVisible: (visible: boolean) => void;

  // Handlers
  handleRoomPress: (room: RoomData) => void;
  handleDetailsJoin: () => void;
  handleJoinById: () => void;
  handleJoinSubmit: (value: string) => void;
  handleCloseJoinModal: () => void;
  handleCloseDetailsDialog: () => void;
}

/**
 * Hook for managing room dialog state
 */
export function useRoomDialogs(): UseRoomDialogsReturn {
  const navigation = useNavigation<NavigationProp>();
  const toast = useToast();

  // Join modal state
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinModalMode, setJoinModalMode] = useState<"id" | "password">("id");
  const [isJoining, setIsJoining] = useState(false);
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);

  // Room details dialog state
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);

  // Handle room card press - navigate to JoinRoomScreen
  const handleRoomPress = useCallback((room: RoomData) => {
    navigation.navigate("JoinRoom", { room });
  }, [navigation]);

  // Handle join from details dialog
  const handleDetailsJoin = useCallback(() => {
    if (!selectedRoom) return;
    const room = selectedRoom;
    setDetailsDialogVisible(false);

    if (room.type === "private") {
      // Show password modal after dialog closes
      setTimeout(() => {
        setJoinModalMode("password");
        setJoinModalVisible(true);
      }, 350);
    } else {
      // Navigate directly to room
      setTimeout(() => {
        navigation.navigate("RoomDetails", { roomId: room.id });
      }, 350);
    }
  }, [selectedRoom, navigation]);

  // Handle join by ID button press
  const handleJoinById = useCallback(() => {
    setJoinModalMode("id");
    setSelectedRoom(null);
    setPendingRoomCode(null);
    setJoinModalVisible(true);
  }, []);

  // Handle join modal submission
  const handleJoinSubmit = useCallback(
    async (value: string) => {
      if (!value.trim()) return;

      setIsJoining(true);

      try {
        if (joinModalMode === "id") {
          // Try to find room by code first (more common use case)
          const codeResponse = await roomsService.getRoomByCode(value.trim().toUpperCase());

          if (codeResponse.success && codeResponse.data) {
            const room = codeResponse.data;

            // Check if room is joinable
            if (room.status === "CLOSED" || room.status === "FINISHED") {
              toast.error("This room is no longer available");
              setIsJoining(false);
              return;
            }

            if (room.currentPlayers >= room.maxPlayers) {
              toast.error("This room is full");
              setIsJoining(false);
              return;
            }

            // If private room, show password modal
            if (!room.isPublic) {
              setPendingRoomCode(room.code);
              setJoinModalMode("password");
              setIsJoining(false);
              return;
            }

            // Join public room
            const joinResponse = await roomsService.joinRoomByCode(room.code);
            if (joinResponse.success) {
              setJoinModalVisible(false);
              navigation.navigate("RoomDetails", { roomId: room.id });
            } else {
              toast.error("Failed to join room. Please try again.");
            }
          } else {
            toast.error("Room not found. Check the code and try again.");
          }
        } else if (joinModalMode === "password") {
          // Joining private room with password
          const roomCode = pendingRoomCode || selectedRoom?.id;
          if (!roomCode) {
            toast.error("Room information missing. Please try again.");
            setIsJoining(false);
            return;
          }

          const joinResponse = await roomsService.joinRoomByCode(
            pendingRoomCode || selectedRoom?.id || "",
            value.trim()
          );

          if (joinResponse.success && joinResponse.data) {
            setJoinModalVisible(false);
            navigation.navigate("RoomDetails", { roomId: joinResponse.data.room.id });
          } else {
            toast.error("Incorrect password. Please try again.");
          }
        }
      } catch (error) {
        const message = getErrorMessage(error);
        if (message.includes("not found")) {
          toast.error("Room not found. Check the code and try again.");
        } else if (message.includes("password") || message.includes("incorrect")) {
          toast.error("Incorrect password. Please try again.");
        } else if (message.includes("full")) {
          toast.error("This room is full.");
        } else if (message.includes("already")) {
          // Already a member, just navigate
          setJoinModalVisible(false);
          if (pendingRoomCode) {
            const room = await roomsService.getRoomByCode(pendingRoomCode);
            if (room.success && room.data) {
              navigation.navigate("RoomDetails", { roomId: room.data.id });
            }
          }
          return;
        } else {
          toast.error(message);
        }
      } finally {
        setIsJoining(false);
      }
    },
    [joinModalMode, selectedRoom, navigation, pendingRoomCode, toast]
  );

  // Close handlers
  const handleCloseJoinModal = useCallback(() => {
    setJoinModalVisible(false);
    setPendingRoomCode(null);
  }, []);

  const handleCloseDetailsDialog = useCallback(() => {
    setDetailsDialogVisible(false);
  }, []);

  return {
    joinModalVisible,
    joinModalMode,
    setJoinModalVisible,
    isJoining,
    selectedRoom,
    detailsDialogVisible,
    setDetailsDialogVisible,
    handleRoomPress,
    handleDetailsJoin,
    handleJoinById,
    handleJoinSubmit,
    handleCloseJoinModal,
    handleCloseDetailsDialog,
  };
}
