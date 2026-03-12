/**
 * useRoomLobby - All state, socket subscriptions, REST fetches, and handlers
 * for the RoomLobbyScreen.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { Player, ChatMessage } from "@/components/lobby";
import type { InviteUser } from "@/components/lists";
import type { RootStackParamList } from "../../App";
import { friendsService } from "@/services/friendsService";
import { roomsService } from "@/services/roomsService";
import { messageService } from "@/services/messageService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import { UI_TIMING } from "@/constants";
import { useRoomPresence } from "@/hooks/useRoomPresence";
import { socketService, type RoomMemberInfo, type ChatMessage as SocketChatMessage } from "@/services/socketService";
import { useAuth, useSound } from "@/hooks";
import { transformUrl } from "@/utils/transformUrl";

type RoomLobbyNavigationProp = StackNavigationProp<RootStackParamList, "RoomLobby">;
type RoomLobbyRouteProp = RouteProp<RootStackParamList, "RoomLobby">;

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function useRoomLobby() {
  const navigation = useNavigation<RoomLobbyNavigationProp>();
  const route = useRoute<RoomLobbyRouteProp>();
  const toast = useToast();
  const { user } = useAuth();
  const { playMessageSound } = useSound();

  const { pack, config, isHost: routeIsHost, room } = route.params;
  const currentUserId = user?.id ?? "";
  const [isHost, setIsHost] = useState(routeIsHost ?? false);
  const [hostId, setHostId] = useState(routeIsHost ? currentUserId : "");
  const [maxPlayers, setMaxPlayers] = useState(config.maxPlayers);
  const [roomTitle, setRoomTitle] = useState(config.title || pack.title);
  const [roomDescription, setRoomDescription] = useState(config.description || "");
  const [packTitle, setPackTitle] = useState(pack.title);
  const [packDescription, setPackDescription] = useState("");
  const [packImageUrl, setPackImageUrl] = useState(pack.logoUri || "");
  const [packQuestionsCount, setPackQuestionsCount] = useState(pack.questionsCount);
  const [packCategory, setPackCategory] = useState("");

  const [roomCode, setRoomCode] = useState(room?.code ?? "");
  const roomId = room?.id ?? "";
  const hasLeftRoom = useRef(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Refs to avoid stale closures in socket handlers
  const chatModalVisibleRef = useRef(chatModalVisible);
  const isHostRef = useRef(isHost);
  const playerCountRef = useRef(players.length);

  // Modal visibility
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [userSelectVisible, setUserSelectVisible] = useState(false);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Keep refs in sync with state
  useEffect(() => { chatModalVisibleRef.current = chatModalVisible; }, [chatModalVisible]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { playerCountRef.current = players.length; }, [players.length]);

  // Invite
  const [inviteUsers, setInviteUsers] = useState<InviteUser[]>([]);
  const [inviteUsersLoading, setInviteUsersLoading] = useState(false);
  const [removeFriendTarget, setRemoveFriendTarget] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);

  // ============================================
  // REST API fallback — initial room data
  // ============================================
  useEffect(() => {
    if (!roomId) return;

    roomsService.getRoom(roomId).then((res) => {
      if (!res.success || !res.data) return;
      const roomData = res.data;

      if (!roomCode && roomData.code) {
        setRoomCode(roomData.code);
      }
      if (roomData.maxPlayers) setMaxPlayers(roomData.maxPlayers);
      if (roomData.title) setRoomTitle(roomData.title);
      if (roomData.description) setRoomDescription(roomData.description);
      if (roomData.selectedPack) {
        setPackTitle(roomData.selectedPack.title);
        if (roomData.selectedPack.description) setPackDescription(roomData.selectedPack.description);
        if (roomData.selectedPack.imageUrl) {
          setPackImageUrl(transformUrl(roomData.selectedPack.imageUrl) || roomData.selectedPack.imageUrl);
        }
        if (roomData.selectedPack.category) setPackCategory(roomData.selectedPack.category);
        if (roomData.selectedPack._count?.questions != null) {
          setPackQuestionsCount(roomData.selectedPack._count.questions);
        }
      }

      if (roomData.creator?.id) {
        setHostId(roomData.creator.id);
        if (roomData.creator.id === currentUserId) setIsHost(true);
      }
      if (!roomData.creator?.id && roomData.members) {
        const creator = roomData.members.find((m) => m.role === "CREATOR");
        if (creator) {
          setHostId(creator.user.id);
          if (creator.user.id === currentUserId) setIsHost(true);
        }
      }

      if (roomData.members) {
        setPlayers((prev) => {
          if (prev.length > 0) return prev;
          if (!roomData.members) return prev;
          return roomData.members.map((m) => ({
            id: m.user.id,
            name: m.user.displayName || m.user.username,
            initials: getInitials(m.user.displayName || m.user.username),
            avatar: m.user.avatar || undefined,
            score: m.score,
            hasAnswered: false,
          }));
        });
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally depends only on roomId: one-time fetch when room is identified.
  }, [roomId]);

  // ============================================
  // Room presence (socket: join, leave, close, kick)
  // ============================================
  useRoomPresence({
    roomId,
    enabled: !!roomId,
    onRoomJoined: (members: RoomMemberInfo[]) => {
      const creator = members.find((m) => m.role === "CREATOR");
      if (creator) {
        setHostId(creator.id);
        if (creator.id === currentUserId) setIsHost(true);
      }
      setPlayers(
        members.map((m) => ({
          id: m.id,
          name: m.displayName || m.username,
          initials: getInitials(m.displayName || m.username),
          avatar: m.avatar || undefined,
          score: m.score,
          hasAnswered: false,
        }))
      );
    },
    onPlayerJoined: (player: RoomMemberInfo) => {
      toast.success(`${player.displayName || player.username} joined!`);
      setPlayers((prev) => {
        if (prev.some((p) => p.id === player.id)) return prev;
        return [
          ...prev,
          {
            id: player.id,
            name: player.displayName || player.username,
            initials: getInitials(player.displayName || player.username),
            avatar: player.avatar || undefined,
            score: player.score,
            hasAnswered: false,
          },
        ];
      });
    },
    onPlayerLeft: (playerId: string) => {
      setPlayers((prev) => {
        const player = prev.find((p) => p.id === playerId);
        if (player) {
          setTimeout(() => toast.info(`${player.name} left`), 0);
        }
        return prev.filter((p) => p.id !== playerId);
      });
    },
    onRoomClosed: (reason: string) => {
      if (hasLeftRoom.current) return;
      hasLeftRoom.current = true;
      toast.error(`Room closed: ${reason}`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    },
    onKicked: (reason: string) => {
      if (hasLeftRoom.current) return;
      hasLeftRoom.current = true;
      toast.error(`You were kicked: ${reason}`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    },
  });

  // ============================================
  // Socket: chat messages
  // ============================================
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = socketService.onChatMessage((data: SocketChatMessage) => {
      if (data.roomId === roomId && data.senderId !== currentUserId) {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderInitials: getInitials(data.senderName),
            message: data.text,
            timestamp: data.timestamp,
            type: data.type === "SYSTEM" ? "system" : "user",
          },
        ]);
        if (!chatModalVisibleRef.current) {
          setUnreadChatCount((prev) => prev + 1);
          playMessageSound();
        }
      }
    });

    return unsubscribe;
  }, [roomId, currentUserId, playMessageSound]);

  // ============================================
  // Socket: game started
  // ============================================
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = socketService.onGameStarted((data) => {
      if (data.roomId === roomId) {
        navigation.replace("RoomDetails", { roomId, isHost: isHostRef.current });
      }
    });

    return unsubscribe;
  }, [roomId, navigation, roomCode, pack, isHost]);

  // ============================================
  // Intercept back button → show leave dialog
  // ============================================
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (e.data.action.type !== "GO_BACK") return;
      e.preventDefault();
      setShowLeaveDialog(true);
    });

    return unsubscribe;
  }, [navigation]);

  // ============================================
  // Handlers
  // ============================================

  const fetchFriendsForInvite = useCallback(async () => {
    setInviteUsersLoading(true);
    try {
      const response = await friendsService.getFriends();
      if (response.success && response.data) {
        setInviteUsers(
          response.data.map((f) => ({
            id: f.id,
            name: f.displayName || f.username,
            initials: getInitials(f.displayName || f.username),
            avatar: f.avatar || undefined,
            isOnline: false,
            isFriend: true,
          }))
        );
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setInviteUsersLoading(false);
    }
  }, [toast]);

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim() || !roomId) return;

    socketService.sendChatMessage(roomId, text.trim());

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: currentUserId,
        senderName: "You",
        senderInitials: user?.displayName
          ? getInitials(user.displayName)
          : getInitials(user?.username || "User"),
        message: text.trim(),
        timestamp: new Date(),
        type: "user",
      },
    ]);
  }, [roomId, currentUserId, user?.displayName, user?.username]);

  const handleOpenChat = useCallback(() => {
    setChatModalVisible(true);
    setUnreadChatCount(0);
  }, []);

  const handleInviteFromPlayersModal = useCallback(() => {
    setPlayersModalVisible(false);
    setTimeout(() => setShareModalVisible(true), UI_TIMING.MODAL_TRANSITION_DELAY);
  }, []);

  const handleInAppShare = useCallback(() => {
    setShareModalVisible(false);
    setTimeout(() => {
      setUserSelectVisible(true);
      fetchFriendsForInvite();
    }, UI_TIMING.MODAL_TRANSITION_DELAY);
  }, [fetchFriendsForInvite]);

  const handleSendInvites = useCallback(async (userIds: string[]) => {
    const invitedUsers = inviteUsers.filter((u) => userIds.includes(u.id));
    const names = invitedUsers.map((u) => u.name).join(", ");

    try {
      const response = await messageService.sendRoomInvite({
        recipientIds: userIds,
        roomCode,
        roomTitle: pack.title,
      });

      if (response.success) {
        toast.success(`Invited ${invitedUsers.length} ${invitedUsers.length === 1 ? "friend" : "friends"}!`);
        setUserSelectVisible(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            senderId: "system",
            senderName: "System",
            senderInitials: "SY",
            message: `Private invitations sent to ${names}. They'll receive a message with a Join button.`,
            timestamp: new Date(),
            type: "system",
            systemVariant: "success",
          },
        ]);
      } else {
        toast.error(response.message || "Failed to send invites");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [inviteUsers, roomCode, pack.title, toast]);

  const handleStartGame = useCallback(async () => {
    if (playerCountRef.current < 2) {
      toast.error("Need at least 2 players to start the game");
      return;
    }

    if (!roomId) {
      toast.error("Room ID not available");
      return;
    }

    setIsStarting(true);
    try {
      const response = await roomsService.startGame(roomId);
      if (!response.success) {
        throw new Error(response.message || "Failed to start game");
      }
      toast.success("Game starting! Get ready...");
    } catch {
      toast.error("Failed to start game. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }, [roomId, toast]);

  const handleLeaveRoom = useCallback(async () => {
    if (hasLeftRoom.current) return;
    hasLeftRoom.current = true;
    setShowLeaveDialog(false);
    if (roomId) {
      try {
        await roomsService.leaveRoom(roomId);
      } catch {
        // Leave silently - navigation proceeds regardless
      }
    }
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  }, [roomId, navigation]);

  const handlePlayerAction = useCallback(async (action: string, playerId: string) => {
    if (action === "view_profile") {
      navigation.navigate("UserProfile", { userId: playerId });
      return;
    }

    if (action === "add_friend") {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      if ((player as Player & { isFriend?: boolean }).isFriend) {
        setRemoveFriendTarget({ playerId, playerName: player.name });
        return;
      }

      try {
        const response = await friendsService.sendFriendRequest(playerId);
        if (response.success) {
          toast.success("Friend request sent!");
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === playerId ? { ...p, friendRequestSent: true } : p
            )
          );
        } else {
          toast.error(response.message || "Failed to send request");
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
      return;
    }
  }, [navigation, players, toast]);

  const confirmRemoveFriend = useCallback(async () => {
    if (!removeFriendTarget) return;
    try {
      const response = await friendsService.removeFriend(removeFriendTarget.playerId);
      if (response.success) {
        toast.success("Friend removed");
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === removeFriendTarget.playerId ? { ...p, isFriend: false } : p
          )
        );
      } else {
        toast.error(response.message || "Failed to remove friend");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRemoveFriendTarget(null);
    }
  }, [removeFriendTarget, toast]);

  // ============================================
  // Computed values
  // ============================================

  const minPlayersToStart = 2;
  const canStart = useMemo(() => players.length >= minPlayersToStart, [players.length]);

  const avatarGroupData = useMemo(
    () => players.map((p) => ({ uri: p.avatar, initials: p.initials })),
    [players]
  );

  const lastMessagePreview = useMemo(() => {
    if (messages.length === 0) return "Say hi to your fellow players!";
    const last = messages[messages.length - 1];
    return `${last.senderName}: ${last.message}`;
  }, [messages]);

  return {
    // Route params
    pack,
    config,

    // Room info
    roomId,
    roomCode,
    roomTitle,
    roomDescription,
    maxPlayers,
    packTitle,
    packDescription,
    packImageUrl,
    packQuestionsCount,
    packCategory,

    // Players
    players,
    currentUserId,
    isHost,
    hostId,
    canStart,
    minPlayersToStart,
    avatarGroupData,

    // Chat
    messages,
    unreadChatCount,
    lastMessagePreview,

    // Modal visibility
    shareModalVisible,
    setShareModalVisible,
    userSelectVisible,
    setUserSelectVisible,
    playersModalVisible,
    setPlayersModalVisible,
    chatModalVisible,
    setChatModalVisible,
    showLeaveDialog,
    setShowLeaveDialog,

    // Game start
    isStarting,

    // Invite
    inviteUsers,
    inviteUsersLoading,

    // Friend removal dialog
    removeFriendTarget,
    setRemoveFriendTarget,

    // Handlers
    handleOpenChat,
    handleSendMessage,
    handleInviteFromPlayersModal,
    handleInAppShare,
    handleSendInvites,
    handleStartGame,
    handleLeaveRoom,
    handlePlayerAction,
    confirmRemoveFriend,
  };
}
