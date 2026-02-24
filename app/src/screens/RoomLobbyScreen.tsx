/**
 * RoomLobbyScreen - Pre-game lobby for waiting and inviting players
 * Features: Room info, player list, chat, share room, start game (host)
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type ScrollView as ScrollViewType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Button, Icon } from "@/components/ui";
import {
  ShareRoomModal,
  UserSelectModal,
  LobbyPlayerList,
  LobbyChatPanel,
  type Player,
  type ChatMessage,
  type InviteUser,
} from "@/components/lobby";
import { LeaveConfirmDialog } from "@/components/common";
import { colors, withOpacity } from "@/themes";
import type { RootStackParamList } from "../../App";
import { friendsService } from "@/services/friendsService";
import { roomsService } from "@/services/roomsService";
import { messageService } from "@/services/messageService";
import { useToast } from "@/contexts";
import { useRoomPresence } from "@/hooks/useRoomPresence";
import { socketService, type RoomMemberInfo, type ChatMessage as SocketChatMessage } from "@/services/socketService";
import { useAuth } from "@/hooks";

type RoomLobbyNavigationProp = StackNavigationProp<RootStackParamList, "RoomLobby">;
type RoomLobbyRouteProp = RouteProp<RootStackParamList, "RoomLobby">;

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

/**
 * Room lobby screen
 */
export function RoomLobbyScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RoomLobbyNavigationProp>();
  const route = useRoute<RoomLobbyRouteProp>();
  const toast = useToast();
  const { user } = useAuth();

  const { pack, config, isHost: routeIsHost, room } = route.params;
  const isHost = routeIsHost ?? true;

  const roomCode = room?.code ?? "";
  const roomId = room?.id ?? "";
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<ScrollViewType>(null);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [userSelectVisible, setUserSelectVisible] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [inviteUsers, setInviteUsers] = useState<InviteUser[]>([]);
  const [inviteUsersLoading, setInviteUsersLoading] = useState(false);

  const currentUserId = user?.id ?? "host";

  useRoomPresence({
    roomId,
    enabled: !!roomId,
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
        if (player) toast.info(`${player.name} left`);
        return prev.filter((p) => p.id !== playerId);
      });
    },
    onRoomClosed: (reason: string) => {
      toast.error(`Room closed: ${reason}`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    },
    onKicked: (reason: string) => {
      toast.error(`You were kicked: ${reason}`);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    },
  });

  const fetchFriendsForInvite = async () => {
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
    } catch (error: any) {
      toast.error(error.message || "Failed to load friends");
    } finally {
      setInviteUsersLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0 && chatScrollRef.current) {
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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
      }
    });

    return unsubscribe;
  }, [roomId, currentUserId]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = socketService.onGameStarted((data) => {
      if (data.roomId === roomId) {
        navigation.replace("Gameplay", { roomId, roomCode, pack, isHost });
      }
    });

    return unsubscribe;
  }, [roomId, navigation, roomCode, pack, isHost]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !roomId) return;

    socketService.sendChatMessage(roomId, chatInput.trim());

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        senderId: currentUserId,
        senderName: "You",
        senderInitials: user?.displayName
          ? getInitials(user.displayName)
          : getInitials(user?.username || "User"),
        message: chatInput.trim(),
        timestamp: new Date(),
        type: "user",
      },
    ]);
    setChatInput("");
  };

  const handleInAppShare = () => {
    setShareModalVisible(false);
    setTimeout(() => {
      setUserSelectVisible(true);
      fetchFriendsForInvite();
    }, 300);
  };

  const handleSendInvites = async (userIds: string[]) => {
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
    } catch (error: any) {
      toast.error(error.message || "Failed to send invites");
    }
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: "system",
          senderName: "System",
          senderInitials: "SY",
          message: "Need at least 2 players to start the game",
          timestamp: new Date(),
          type: "system",
          systemVariant: "warning",
        },
      ]);
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

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: "system",
          senderName: "System",
          senderInitials: "SY",
          message: "Game starting! Get ready...",
          timestamp: new Date(),
          type: "system",
          systemVariant: "success",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: "system",
          senderName: "System",
          senderInitials: "SY",
          message: "Failed to start game. Please try again.",
          timestamp: new Date(),
          type: "system",
          systemVariant: "warning",
        },
      ]);
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    setShowLeaveDialog(false);
    if (roomId) {
      try {
        await roomsService.leaveRoom(roomId);
      } catch {
        // Leave silently - navigation proceeds regardless
      }
    }
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  const minPlayersToStart = 2;
  const canStart = players.length >= minPlayersToStart;

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-primary-500">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => setShowLeaveDialog(true)}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2 active:opacity-70"
          >
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <View className="flex-1 items-center">
            <Text variant="h3" className="font-bold" style={{ color: colors.white }}>
              Game Lobby
            </Text>
            <Text variant="caption" style={{ color: withOpacity(colors.white, 0.8) }}>
              {pack.title}
            </Text>
          </View>
          <Pressable
            onPress={() => setShareModalVisible(true)}
            className="w-10 h-10 rounded-full items-center justify-center -mr-2 active:opacity-70"
          >
            <Icon name="share-social" color={colors.white} size="lg" />
          </Pressable>
        </View>

        {/* Room Code Banner */}
        <View
          className="mx-4 mb-4 p-3 rounded-xl flex-row items-center justify-between"
          style={{ backgroundColor: withOpacity(colors.white, 0.15) }}
        >
          <View>
            <Text variant="caption" style={{ color: withOpacity(colors.white, 0.7) }}>
              Room Code
            </Text>
            <Text variant="h3" className="font-bold tracking-widest" style={{ color: colors.white }}>
              {roomCode}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Icon name="people" size="sm" color={colors.white} />
            <Text variant="body" className="ml-1 font-medium" style={{ color: colors.white }}>
              {players.length}/{config.maxPlayers}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LobbyPlayerList
            players={players}
            maxPlayers={config.maxPlayers}
            isHost={isHost}
            canStart={canStart}
            minPlayersToStart={minPlayersToStart}
            onInvite={() => setShareModalVisible(true)}
          />

          <LobbyChatPanel
            messages={messages}
            currentUserId={currentUserId}
            chatScrollRef={chatScrollRef}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendMessage={handleSendMessage}
          />
        </ScrollView>

        {/* Bottom Action */}
        <View
          className="px-4 pt-4 bg-surface border-t"
          style={{ borderTopColor: colors.border, paddingBottom: insets.bottom + 16 }}
        >
          {isHost ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isStarting}
              disabled={isStarting || !canStart}
              onPress={handleStartGame}
            >
              {canStart ? "Start Game" : `Waiting for players (${players.length}/${minPlayersToStart})`}
            </Button>
          ) : (
            <View
              className="flex-row items-center justify-center p-4 rounded-xl"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
            >
              <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: colors.primary[500] }} />
              <Text variant="body" className="font-medium" style={{ color: colors.primary[500] }}>
                Waiting for host to start the game...
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <ShareRoomModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onInAppShare={handleInAppShare}
        roomCode={roomCode}
        packName={pack.title}
        password={config.isPasswordProtected ? config.password : undefined}
      />

      <UserSelectModal
        visible={userSelectVisible}
        onClose={() => setUserSelectVisible(false)}
        onSendInvites={handleSendInvites}
        users={inviteUsers}
        roomCode={roomCode}
        packName={pack.title}
        isLoading={inviteUsersLoading}
      />

      <LeaveConfirmDialog
        visible={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleLeaveRoom}
      />
    </View>
  );
}
