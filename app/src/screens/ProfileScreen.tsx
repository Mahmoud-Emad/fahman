/**
 * ProfileScreen - User profile with stats, achievements, and activity
 * Modern FANG-style design with smooth collapsible header animation
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { View, Pressable, Share, Animated, StyleSheet, RefreshControl } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Text, Icon, Avatar, Dialog, Skeleton } from "@/components/ui";
import { BottomNavBar } from "@/components/navigation";
import { NotificationsModal, ChatsListModal, ChatDetailsModal } from "@/components/messaging";
import { FriendsListModal, AddFriendModal, CreateGameDialog } from "@/components/friends";
import {
  EditProfileModal, PhoneManagementModal, AvatarSelectionModal,
  type UserPackData, ProfileStatsSection, ProfileAchievementsSection,
  ProfilePacksSection, ProfileGamesSection, type UserRoomData,
} from "@/components/profile";
import { useMessaging, useFriends } from "@/hooks";
import { useAuth, useToast } from "@/contexts";
import { packsService, type Pack } from "@/services/packsService";
import { userService, type UserStats, type RecentGame, type Achievement } from "@/services/userService";
import { roomsService, type Room } from "@/services/roomsService";
import { transformUrl } from "@/utils/transformUrl";
import { colors, withOpacity } from "@/themes";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";

// Animation constants
const SCROLL_DISTANCE = 120;
const HEADER_EXPANDED_HEIGHT = 320;
const HEADER_COLLAPSED_HEIGHT = 56;

function transformImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return transformUrl(url) || null;
}

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const EMPTY_STATS = { gamesPlayed: 0, wins: 0, winRate: 0, friends: 0, currentStreak: 0, bestStreak: 0 };

/**
 * Skeleton placeholder for the profile scrollable content
 */
function ProfileContentSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
      {/* Account Info Card Skeleton */}
      <View style={skeletonStyles.card}>
        {/* Game ID row */}
        <View style={skeletonStyles.row}>
          <Skeleton.Circle size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton.Box width={80} height={12} />
            <Skeleton.Box width={120} height={16} style={{ marginTop: 6 }} />
          </View>
          <Skeleton.Box width={32} height={32} borderRadius={16} />
        </View>
        <View style={skeletonStyles.divider} />
        {/* Email row */}
        <View style={skeletonStyles.row}>
          <Skeleton.Circle size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton.Box width={60} height={12} />
            <Skeleton.Box width={160} height={16} style={{ marginTop: 6 }} />
          </View>
        </View>
        <View style={skeletonStyles.divider} />
        {/* Phone row */}
        <View style={skeletonStyles.row}>
          <Skeleton.Circle size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton.Box width={70} height={12} />
            <Skeleton.Box width={140} height={16} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>

      {/* Stats Grid Skeleton */}
      <View style={skeletonStyles.card}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={skeletonStyles.statCell}>
              <Skeleton.Circle size={28} />
              <Skeleton.Box width={40} height={10} style={{ marginTop: 8 }} />
              <Skeleton.Box width={24} height={18} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Streak Card Skeleton */}
      <View style={skeletonStyles.card}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Skeleton.Box width={48} height={48} borderRadius={14} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton.Box width={120} height={16} />
            <Skeleton.Box width={80} height={12} style={{ marginTop: 6 }} />
          </View>
          <Skeleton.Box width={32} height={32} borderRadius={8} />
        </View>
      </View>

      {/* Achievements Section Skeleton */}
      <View style={{ marginTop: 24 }}>
        <View style={skeletonStyles.sectionHeader}>
          <Skeleton.Box width={120} height={18} />
          <Skeleton.Box width={60} height={14} />
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ alignItems: "center" }}>
              <Skeleton.Circle size={52} />
              <Skeleton.Box width={48} height={10} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Packs Section Skeleton */}
      <View style={{ marginTop: 24 }}>
        <View style={skeletonStyles.sectionHeader}>
          <Skeleton.Box width={100} height={18} />
          <Skeleton.Box width={70} height={14} />
        </View>
        {[1, 2].map((i) => (
          <View key={i} style={[skeletonStyles.card, { marginTop: 8 }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Skeleton.Box width={56} height={56} borderRadius={12} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton.Box width={140} height={16} />
                <Skeleton.Box width={100} height={12} style={{ marginTop: 6 }} />
              </View>
              <Skeleton.Box width={28} height={28} borderRadius={14} />
            </View>
          </View>
        ))}
      </View>

      {/* Games Section Skeleton */}
      <View style={{ marginTop: 24 }}>
        <View style={skeletonStyles.sectionHeader}>
          <Skeleton.Box width={120} height={18} />
          <Skeleton.Box width={60} height={14} />
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[skeletonStyles.card, { marginTop: 8 }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Skeleton.Box width={44} height={44} borderRadius={10} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Skeleton.Box width={130} height={14} />
                <Skeleton.Box width={80} height={12} style={{ marginTop: 6 }} />
              </View>
              <Skeleton.Box width={48} height={20} borderRadius={10} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 4,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
});

/**
 * ProfileScreen component
 */
export function ProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user: authUser, updateProfile, refreshUser } = useAuth();
  const toast = useToast();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [deletePackDialog, setDeletePackDialog] = useState<{ visible: boolean; pack: UserPackData | null }>({ visible: false, pack: null });
  const [deleteRoomDialog, setDeleteRoomDialog] = useState<{ visible: boolean; room: Room | null }>({ visible: false, room: null });

  const [userPacks, setUserPacks] = useState<UserPackData[]>([]);
  const [packsLoading, setPacksLoading] = useState(true);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYJS = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollYJS.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: "clamp",
  });

  const messaging = useMessaging();
  const friendsHook = useFriends();

  useEffect(() => {
    if (friendsHook.pendingChatFriend) {
      const friend = friendsHook.pendingChatFriend;
      friendsHook.clearPendingChatFriend();
      messaging.openDirectChat({ id: friend.id, name: friend.name, initials: friend.initials, avatar: friend.avatar });
    }
  }, [friendsHook.pendingChatFriend]);

  const fetchUserPacks = useCallback(async () => {
    setPacksLoading(true);
    try {
      const response = await packsService.getMyPacks();
      if (response.success && response.data) {
        setUserPacks(response.data.map((pack: Pack) => ({
          id: pack.id, title: pack.title, description: pack.description,
          imageUrl: transformImageUrl(pack.imageUrl),
          questionsCount: pack._count?.questions || 0, timesPlayed: pack.timesPlayed,
          visibility: pack.visibility, isPublished: pack.isPublished, createdAt: pack.createdAt,
        })));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load packs");
    } finally {
      setPacksLoading(false);
    }
  }, []);

  const fetchUserRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const response = await roomsService.getMyRooms();
      if (response.success && response.data) {
        setUserRooms(response.data.map((room: any) => ({
          ...room,
          selectedPack: room.selectedPack
            ? { ...room.selectedPack, imageUrl: transformImageUrl(room.selectedPack.imageUrl) }
            : null,
        })));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load rooms");
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    fetchUserPacks();
    fetchUserRooms();
  }, [fetchUserPacks, fetchUserRooms]));

  const fetchStatsData = useCallback(async () => {
    try {
      const [statsResponse, gamesResponse, achievementsResponse] = await Promise.all([
        userService.getUserStats(),
        userService.getRecentGames(5),
        userService.getUserAchievements(),
      ]);
      if (statsResponse.success && statsResponse.data) setUserStats(statsResponse.data);
      if (gamesResponse.success && gamesResponse.data) setRecentGames(gamesResponse.data);
      if (achievementsResponse.success && achievementsResponse.data) setAchievements(achievementsResponse.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load profile stats");
    }
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;
    setStatsLoading(true);
    fetchStatsData().finally(() => setStatsLoading(false));
  }, [authUser?.id, fetchStatsData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshUser(),
      fetchUserPacks(),
      fetchUserRooms(),
      fetchStatsData(),
    ]);
    setRefreshing(false);
  }, [refreshUser, fetchUserPacks, fetchUserRooms, fetchStatsData]);

  const handlePackPress = (pack: UserPackData) => navigation.navigate("PackCreation", { packId: pack.id });
  const handlePackEdit = (pack: UserPackData) => navigation.navigate("PackCreation", { packId: pack.id });
  const handleCreatePack = () => navigation.navigate("PackCreation", {});
  const handlePackDelete = (pack: UserPackData) => setDeletePackDialog({ visible: true, pack });

  const confirmPackDelete = async () => {
    if (!deletePackDialog.pack) return;
    try {
      const response = await packsService.deletePack(deletePackDialog.pack.id);
      if (response.success) {
        toast.success("Pack deleted successfully");
        setUserPacks((prev) => prev.filter((p) => p.id !== deletePackDialog.pack!.id));
      } else {
        toast.error(response.message || "Failed to delete pack");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete pack");
    } finally {
      setDeletePackDialog({ visible: false, pack: null });
    }
  };

  const handleRoomPress = (room: UserRoomData) => {
    navigation.navigate("RoomLobby", {
      isHost: true,
      pack: { id: room.selectedPack?.id || "", title: room.selectedPack?.title || "Unknown Pack", category: "General", difficulty: "MEDIUM" } as any,
      config: { maxPlayers: room.maxPlayers, questionsCount: 10, timerDuration: 20, maxBet: 10, isPrivate: !room.isPublic } as any,
      room: room as any,
    });
  };

  const handleRoomDelete = (room: UserRoomData) => setDeleteRoomDialog({ visible: true, room: room as unknown as Room });

  const confirmRoomDelete = async () => {
    if (!deleteRoomDialog.room) return;
    try {
      const response = await roomsService.deleteRoom(deleteRoomDialog.room.id);
      if (response.success) {
        toast.success("Room deleted successfully");
        setUserRooms((prev) => prev.filter((r) => r.id !== deleteRoomDialog.room!.id));
      } else {
        toast.error(response.message || "Failed to delete room");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete room");
    } finally {
      setDeleteRoomDialog({ visible: false, room: null });
    }
  };

  const displayData = useMemo(() => ({
    name: authUser?.displayName || "User",
    username: `@${authUser?.username || "user"}`,
    initials: getInitials(authUser?.displayName),
    avatar: authUser?.avatar || null,
    bio: authUser?.bio || "",
    gameId: authUser?.gameId || 0,
    email: authUser?.email || null,
    phoneNumber: authUser?.phoneNumber || null,
    phoneVerified: authUser?.phoneVerified || false,
    isPremium: authUser?.role === "ADMIN" || authUser?.role === "MODERATOR",
    joinDate: authUser?.createdAt ? formatJoinDate(authUser.createdAt) : "Unknown",
    stats: userStats
      ? { gamesPlayed: userStats.gamesPlayed, wins: userStats.wins, winRate: userStats.winRate, friends: friendsHook.friends.length, currentStreak: userStats.currentStreak, bestStreak: userStats.bestStreak }
      : { ...EMPTY_STATS, friends: friendsHook.friends.length },
    achievements: achievements.map(a => ({ id: a.id, name: a.name, icon: "trophy" as any, color: colors.gold, earned: a.unlocked })),
    recentGames: recentGames.map(g => ({ id: g.id, packName: g.packTitle, result: g.result, score: g.score, date: new Date(g.playedAt).toLocaleDateString() })),
  }), [authUser, userStats, achievements, recentGames, friendsHook.friends]);

  const isInitialLoading = statsLoading && packsLoading && roomsLoading;

  const expandedOpacity = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE * 0.6], outputRange: [1, 0], extrapolate: "clamp" });
  const collapsedOpacity = scrollY.interpolate({ inputRange: [SCROLL_DISTANCE * 0.4, SCROLL_DISTANCE], outputRange: [0, 1], extrapolate: "clamp" });
  const expandedTranslateY = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [0, -30], extrapolate: "clamp" });
  const expandedScale = scrollY.interpolate({ inputRange: [0, SCROLL_DISTANCE], outputRange: [1, 0.9], extrapolate: "clamp" });

  const handleShare = async () => {
    try {
      const deepLink = `fahman://add-friend?gameId=${displayData.gameId}`;
      const shareMessage = `Check out my Fahman profile!\n\n🎮 Game ID: ${displayData.gameId}\n\n👥 Tap to add me: ${deepLink}\n\nJoin me on Fahman!`;
      await Share.share({ message: shareMessage, title: "Add me on Fahman!" });
    } catch (error: any) {
      toast.error(error.message || "Failed to share profile");
    }
  };

  const handleSaveProfile = async (data: { displayName: string; bio: string }) => {
    try {
      await updateProfile({ displayName: data.displayName, bio: data.bio });
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    try {
      await updateProfile({ avatar: avatarUrl });
    } catch (error: any) {
      toast.error(error.message || "Failed to update avatar");
    }
  };

  const handleCopyGameId = async () => {
    try {
      await Clipboard.setStringAsync(displayData.gameId.toString());
      toast.success("Game ID copied to clipboard!");
    } catch (error: any) {
      toast.error(error.message || "Failed to copy Game ID");
    }
  };

  const handleTabPress = (tabId: string) => {
    if (tabId === "home") navigation.navigate("Home" as never);
    else if (tabId === "friends") friendsHook.openFriendsList();
    else if (tabId === "chats") messaging.openChatsList();
    else if (tabId === "notifications") messaging.openNotifications();
  };

  const topBarHeight = insets.top + 56;

  return (
    <View style={styles.container}>
      {/* Animated Header Background */}
      <Animated.View style={[styles.headerBackground, { height: Animated.add(headerHeight, insets.top), paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <Animated.View style={[styles.collapsedContent, { opacity: collapsedOpacity }]}>
            <Avatar initials={displayData.initials} uri={displayData.avatar || undefined} size="sm" bgColor="bg-white" textColor="text-primary-500" />
            <View style={styles.collapsedText}>
              <Text variant="body" className="font-semibold" style={{ color: colors.white }}>{displayData.name}</Text>
              <Text variant="caption" style={{ color: withOpacity(colors.white, 0.8) }}>{displayData.username}</Text>
            </View>
          </Animated.View>
          <Pressable onPress={() => navigation.navigate("Settings" as never)} style={styles.iconButton}>
            <Icon name="settings-outline" color={colors.white} size="lg" />
          </Pressable>
        </View>

        <Animated.View style={[styles.expandedContent, { opacity: expandedOpacity, transform: [{ translateY: expandedTranslateY }, { scale: expandedScale }] }]}>
          <Pressable onPress={() => setAvatarModalVisible(true)} style={styles.avatarContainer}>
            <Avatar initials={displayData.initials} uri={displayData.avatar || undefined} size="xl" bgColor="bg-white" textColor="text-primary-500" />
            <View style={[styles.onlineIndicator, { borderColor: colors.primary[500] }]} />
            {displayData.isPremium && <View style={styles.premiumBadge}><Icon name="diamond" size="xs" color={colors.white} /></View>}
            <View style={styles.avatarEditIcon}><Icon name="camera" customSize={14} color={colors.white} /></View>
          </Pressable>

          <Text variant="h2" style={styles.userName}>{displayData.name}</Text>
          <Text variant="body" style={styles.userHandle}>{displayData.username}</Text>
          <View style={styles.gameIdBadge}>
            <Icon name="game-controller" size="xs" color={colors.white} />
            <Text variant="caption" className="font-semibold ml-1" style={{ color: colors.white }}>ID: {displayData.gameId}</Text>
          </View>
          {displayData.bio ? <Text variant="body-sm" center style={styles.userBio}>{displayData.bio}</Text> : null}

          <View style={styles.actionButtons}>
            <Pressable onPress={() => setEditModalVisible(true)} style={styles.editButton}>
              <Text variant="body-sm" className="font-medium" style={{ color: colors.white }}>Edit Profile</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={styles.shareButton}>
              <Icon name="share-social" size="xs" color={colors.primary[500]} />
              <Text variant="body-sm" className="font-medium" style={{ color: colors.primary[500], marginLeft: 6 }}>Share</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topBarHeight + HEADER_EXPANDED_HEIGHT - 20 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
            progressViewOffset={topBarHeight + HEADER_EXPANDED_HEIGHT - 20}
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: (event: any) => { scrollYJS.setValue(event.nativeEvent.contentOffset.y); },
        })}
      >
        {isInitialLoading ? (
          <ProfileContentSkeleton />
        ) : (
          <>
            <ProfileStatsSection
              gameId={displayData.gameId}
              email={displayData.email}
              phoneNumber={displayData.phoneNumber}
              phoneVerified={displayData.phoneVerified}
              stats={displayData.stats}
              onPhoneManagement={() => setPhoneModalVisible(true)}
              onCopyGameId={handleCopyGameId}
            />
            <ProfileAchievementsSection achievements={displayData.achievements} statsLoading={statsLoading} />
            <ProfilePacksSection
              userPacks={userPacks} packsLoading={packsLoading}
              userRooms={userRooms} roomsLoading={roomsLoading}
              onPackPress={handlePackPress} onPackEdit={handlePackEdit}
              onPackDelete={handlePackDelete} onCreatePack={handleCreatePack}
              onRoomPress={handleRoomPress} onRoomDelete={handleRoomDelete}
            />
            <ProfileGamesSection recentGames={displayData.recentGames} statsLoading={statsLoading} joinDate={displayData.joinDate} />
          </>
        )}
      </Animated.ScrollView>

      <BottomNavBar centerTab={{ id: "home", label: "Home", icon: "home-outline", activeIcon: "home" }} activeTab="profile" onTabPress={handleTabPress} badges={{ notifications: messaging.unreadNotificationCount, chats: messaging.unreadMessageCount }} />

      {/* Modals */}
      <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} user={{ displayName: displayData.name, bio: displayData.bio, avatar: displayData.avatar }} onSave={handleSaveProfile} />
      <PhoneManagementModal visible={phoneModalVisible} onClose={() => setPhoneModalVisible(false)} phoneNumber={displayData.phoneNumber} phoneVerified={displayData.phoneVerified} onPhoneUpdated={refreshUser} />
      <AvatarSelectionModal visible={avatarModalVisible} onClose={() => setAvatarModalVisible(false)} onSelect={handleAvatarSelect} currentAvatar={displayData.avatar} userCoins={authUser?.coins ?? 0} />

      <NotificationsModal visible={messaging.notificationsVisible} onClose={() => messaging.setNotificationsVisible(false)} notifications={messaging.notifications} onNotificationPress={messaging.handleNotificationPress} onNotificationAction={messaging.handleNotificationAction} onMarkAllRead={messaging.handleMarkAllNotificationsRead} onDelete={messaging.handleDeleteNotification} onClearAll={messaging.handleClearReadNotifications} isLoading={messaging.notificationsLoading} />
      <ChatsListModal visible={messaging.chatsListVisible} onClose={() => messaging.setChatsListVisible(false)} conversations={messaging.conversations} onConversationPress={messaging.handleConversationPress} isLoading={messaging.chatsLoading} />
      <ChatDetailsModal visible={messaging.chatDetailsVisible} onClose={() => messaging.setChatDetailsVisible(false)} conversation={messaging.activeConversation} messages={messaging.activeMessages} onSendMessage={messaging.handleSendDirectMessage} onDeleteMessage={messaging.handleDeleteMessage} onJoinRoom={messaging.handleJoinRoomFromChat} currentUserId={messaging.currentUserId} onBack={messaging.handleChatDetailsBack} />

      <CreateGameDialog visible={!!friendsHook.playFriend} friend={friendsHook.playFriend} onClose={() => friendsHook.setPlayFriend(null)} />
      <FriendsListModal visible={friendsHook.friendsListVisible} onClose={() => friendsHook.setFriendsListVisible(false)} friends={friendsHook.friends} friendRequests={friendsHook.friendRequests} sentRequests={friendsHook.sentRequests} onFriendPress={friendsHook.handleFriendPress} onMessageFriend={friendsHook.handleMessageFriend} onInviteFriend={friendsHook.handleInviteFriend} onAcceptRequest={friendsHook.handleAcceptFriendRequest} onDeclineRequest={friendsHook.handleDeclineFriendRequest} onCancelRequest={friendsHook.handleCancelFriendRequest} onAddFriend={friendsHook.handleAddFriend} isLoading={friendsHook.friendsLoading} />
      <AddFriendModal visible={friendsHook.addFriendVisible} onClose={() => friendsHook.setAddFriendVisible(false)} onCloseAll={friendsHook.closeAllModals} onFriendAdded={friendsHook.handleFriendAdded} />

      <Dialog visible={deletePackDialog.visible} onClose={() => setDeletePackDialog({ visible: false, pack: null })} title="Delete Pack" message={`Are you sure you want to delete "${deletePackDialog.pack?.title}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" confirmVariant="danger" onConfirm={confirmPackDelete} onCancel={() => setDeletePackDialog({ visible: false, pack: null })} />
      <Dialog visible={deleteRoomDialog.visible} onClose={() => setDeleteRoomDialog({ visible: false, room: null })} title="Delete Room" message={`Are you sure you want to delete room "${deleteRoomDialog.room?.title}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" confirmVariant="danger" onConfirm={confirmRoomDelete} onCancel={() => setDeleteRoomDialog({ visible: false, room: null })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[100] },
  headerBackground: {
    position: "absolute", top: 0, left: 0, right: 0,
    backgroundColor: colors.primary[500],
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    zIndex: 10, overflow: "hidden",
  },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, height: 56 },
  iconButton: { padding: 8, borderRadius: 20 },
  collapsedContent: { flex: 1, flexDirection: "row", alignItems: "center", marginHorizontal: 8 },
  collapsedText: { marginLeft: 12 },
  expandedContent: { alignItems: "center", paddingHorizontal: 24 },
  avatarContainer: { position: "relative" },
  onlineIndicator: { position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.success, borderWidth: 3 },
  premiumBadge: { position: "absolute", top: -4, right: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  avatarEditIcon: { position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary[500], alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  userName: { color: colors.white, marginTop: 12 },
  userHandle: { color: withOpacity(colors.white, 0.8), marginTop: 2 },
  gameIdBadge: { flexDirection: "row", alignItems: "center", marginTop: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: withOpacity(colors.white, 0.2) },
  userBio: { color: withOpacity(colors.white, 0.7), marginTop: 8, paddingHorizontal: 20 },
  actionButtons: { flexDirection: "row", marginTop: 16 },
  editButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: withOpacity(colors.white, 0.2), marginRight: 8 },
  shareButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.white },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 70 },
});
