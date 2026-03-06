/**
 * RoomLobbyScreen - Pre-game lobby for waiting and inviting players
 * Features: Room info, player list, chat, share room, start game (host)
 */
import React, { useState, useEffect } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Button, Icon, AvatarGroup, Badge } from "@/components/ui";
import {
  ShareRoomModal,
  UserSelectModal,
  PlayersModal,
  LobbyChatModal,
  LobbyHeader,
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
import { useAuth, useSound } from "@/hooks";

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
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [userSelectVisible, setUserSelectVisible] = useState(false);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const [inviteUsers, setInviteUsers] = useState<InviteUser[]>([]);
  const [inviteUsersLoading, setInviteUsersLoading] = useState(false);
  const [removeFriendTarget, setRemoveFriendTarget] = useState<{
    playerId: string;
    playerName: string;
  } | null>(null);

  // REST API fallback — fetch initial room members (guarantees data even if socket is slow)
  useEffect(() => {
    if (!roomId) return;

    roomsService.getRoom(roomId).then((res) => {
      if (!res.success || !res.data) return;
      const roomData = res.data;

      // Fill in room code if missing (e.g. navigated from "already in room" fallback)
      if (!roomCode && roomData.code) {
        setRoomCode(roomData.code);
      }

      // Authoritative room data from the database
      if (roomData.maxPlayers) {
        setMaxPlayers(roomData.maxPlayers);
      }
      if (roomData.title) {
        setRoomTitle(roomData.title);
      }
      if (roomData.description) {
        setRoomDescription(roomData.description);
      }
      if (roomData.selectedPack) {
        setPackTitle(roomData.selectedPack.title);
        if (roomData.selectedPack.description) {
          setPackDescription(roomData.selectedPack.description);
        }
        if (roomData.selectedPack.imageUrl) {
          setPackImageUrl(roomData.selectedPack.imageUrl);
        }
        if (roomData.selectedPack.category) {
          setPackCategory(roomData.selectedPack.category);
        }
        if (roomData.selectedPack._count?.questions != null) {
          setPackQuestionsCount(roomData.selectedPack._count.questions);
        }
      }

      // Auto-detect host from creator or member role
      if (roomData.creator?.id) {
        setHostId(roomData.creator.id);
        if (roomData.creator.id === currentUserId) {
          setIsHost(true);
        }
      }
      if (!roomData.creator?.id && roomData.members) {
        const creator = roomData.members.find((m) => m.role === "CREATOR");
        if (creator) {
          setHostId(creator.user.id);
          if (creator.user.id === currentUserId) {
            setIsHost(true);
          }
        }
      }

      if (roomData.members) {
        setPlayers((prev) => {
          if (prev.length > 0) return prev;
          return roomData.members!.map((m) => ({
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
  }, [roomId]);

  useRoomPresence({
    roomId,
    enabled: !!roomId,
    onRoomJoined: (members: RoomMemberInfo[]) => {
      // Auto-detect host from member roles
      const creator = members.find((m) => m.role === "CREATOR");
      if (creator) {
        setHostId(creator.id);
        if (creator.id === currentUserId) {
          setIsHost(true);
        }
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
        // Increment unread count and play sound when chat modal is not open
        if (!chatModalVisible) {
          setUnreadChatCount((prev) => prev + 1);
          playMessageSound();
        }
      }
    });

    return unsubscribe;
  }, [roomId, currentUserId, chatModalVisible, playMessageSound]);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = socketService.onGameStarted((data) => {
      if (data.roomId === roomId) {
        navigation.replace("RoomDetails", { roomId, isHost });
      }
    });

    return unsubscribe;
  }, [roomId, navigation, roomCode, pack, isHost]);

  // Intercept hardware back button and swipe gesture to show leave dialog
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Block GO_BACK (hardware back button)
      // Allow RESET, REPLACE, NAVIGATE (programmatic navigation)
      if (e.data.action.type !== "GO_BACK") return;

      e.preventDefault();
      setShowLeaveDialog(true);
    });

    return unsubscribe;
  }, [navigation]);

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

  const handleOpenChat = () => {
    setChatModalVisible(true);
    setUnreadChatCount(0);
  };

  const handleInviteFromPlayersModal = () => {
    setPlayersModalVisible(false);
    setTimeout(() => setShareModalVisible(true), 300);
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

  const handlePlayerAction = async (action: string, playerId: string) => {
    if (action === "view_profile") {
      navigation.navigate("UserProfile", { userId: playerId });
      return;
    }

    if (action === "add_friend") {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;

      // Check if player is already a friend (the action ID is "add_friend" for both add/remove)
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
      } catch (error: any) {
        toast.error(error.message || "Failed to send friend request");
      }
      return;
    }
  };

  const confirmRemoveFriend = async () => {
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
    } catch (error: any) {
      toast.error(error.message || "Failed to remove friend");
    } finally {
      setRemoveFriendTarget(null);
    }
  };

  const minPlayersToStart = 2;
  const canStart = players.length >= minPlayersToStart;

  return (
    <View className="flex-1 bg-surface-secondary">
      <LobbyHeader
        roomTitle={roomTitle}
        roomDescription={roomDescription}
        roomCode={roomCode}
        playerCount={players.length}
        maxPlayers={maxPlayers}
        packTitle={packTitle}
        packDescription={packDescription}
        packImageUrl={packImageUrl}
        packQuestionsCount={packQuestionsCount}
        packCategory={packCategory}
        onBack={() => setShowLeaveDialog(true)}
        onShare={() => setShareModalVisible(true)}
      />

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Players Card */}
        <Pressable
          onPress={() => setPlayersModalVisible(true)}
          className="rounded-xl p-4 mb-3 active:opacity-90"
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Icon name="people" size="sm" color={colors.primary[500]} />
              <Text variant="body" className="font-semibold ml-2">
                Players
              </Text>
            </View>
            <Badge variant={canStart ? "success" : "warning"} size="sm">
              {players.length}/{minPlayersToStart} min
            </Badge>
          </View>

          <View className="flex-row items-center justify-between">
            {players.length > 0 ? (
              <AvatarGroup
                avatars={players.map((p) => ({
                  uri: p.avatar,
                  initials: p.initials,
                }))}
                max={6}
                size="sm"
              />
            ) : (
              <Text variant="caption" color="muted">
                Waiting for players to join...
              </Text>
            )}
            <View className="flex-row items-center">
              <Text variant="caption" color="secondary" className="mr-1">
                View all
              </Text>
              <Icon name="chevron-forward" customSize={14} color={colors.neutral[400]} />
            </View>
          </View>
        </Pressable>

        {/* Chat Card */}
        <Pressable
          onPress={handleOpenChat}
          className="rounded-xl p-4 mb-3 active:opacity-90"
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="relative">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
                >
                  <Icon name="chatbubble-ellipses" size="md" color={colors.primary[500]} />
                </View>
                {unreadChatCount > 0 && (
                  <View
                    className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full items-center justify-center px-1"
                    style={{ backgroundColor: colors.error }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colors.white }}>
                      {unreadChatCount > 99 ? "99+" : unreadChatCount}
                    </Text>
                  </View>
                )}
              </View>
              <View className="ml-3">
                <Text variant="body" className="font-semibold">
                  Room Chat
                </Text>
                <Text variant="caption" color="muted" numberOfLines={1}>
                  {messages.length > 0
                    ? `${messages[messages.length - 1].senderName}: ${messages[messages.length - 1].message}`
                    : "Say hi to your fellow players!"}
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" customSize={16} color={colors.neutral[400]} />
          </View>
        </Pressable>

        {/* Invite Button */}
        <Pressable
          onPress={() => setShareModalVisible(true)}
          className="rounded-xl p-4 mb-3 flex-row items-center justify-center active:opacity-70"
          style={{
            backgroundColor: withOpacity(colors.primary[500], 0.08),
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: withOpacity(colors.primary[500], 0.3),
          }}
        >
          <Icon name="person-add" size="md" color={colors.primary[500]} />
          <Text
            variant="body"
            className="ml-2 font-medium"
            style={{ color: colors.primary[500] }}
          >
            Invite Players
          </Text>
        </Pressable>
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

      {/* Players Modal */}
      <PlayersModal
        visible={playersModalVisible}
        onClose={() => setPlayersModalVisible(false)}
        players={players}
        currentUserId={currentUserId}
        hostId={hostId}
        onPlayerAction={handlePlayerAction}
        onInvite={handleInviteFromPlayersModal}
      />

      {/* Chat Modal */}
      <LobbyChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        messages={messages}
        currentUserId={currentUserId}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendMessage={handleSendMessage}
      />

      <ShareRoomModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onInAppShare={handleInAppShare}
        roomCode={roomCode}
        packName={packTitle}
        password={config.isPasswordProtected ? config.password : undefined}
      />

      <UserSelectModal
        visible={userSelectVisible}
        onClose={() => setUserSelectVisible(false)}
        onSendInvites={handleSendInvites}
        users={inviteUsers}
        roomCode={roomCode}
        packName={packTitle}
        isLoading={inviteUsersLoading}
      />

      <LeaveConfirmDialog
        visible={showLeaveDialog}
        onClose={() => setShowLeaveDialog(false)}
        onConfirm={handleLeaveRoom}
        {...(isHost && players.length > 1 && {
          title: "End Room for All?",
          message: "Ending the room will remove all players and close the room. This cannot be undone.",
        })}
      />

      <LeaveConfirmDialog
        visible={!!removeFriendTarget}
        onClose={() => setRemoveFriendTarget(null)}
        onConfirm={confirmRemoveFriend}
        title="Remove Friend?"
        message={`Are you sure you want to remove ${removeFriendTarget?.playerName ?? "this player"} from your friends?`}
        confirmLabel="Remove"
        icon="person-remove"
      />
    </View>
  );
}
