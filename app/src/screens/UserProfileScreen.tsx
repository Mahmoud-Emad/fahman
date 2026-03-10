/**
 * UserProfileScreen - View another user's profile
 * Shows user info, stats, achievements, and actions (add friend, message, etc.)
 */
import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, Animated, StyleSheet, ActivityIndicator, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { userService, type UserStats, type RecentGame, type Achievement, type PublicUserProfile } from "@/services/userService";
import { friendsService } from "@/services/friendsService";
import { socketService } from "@/services/socketService";
import { useAuth, useToast } from "@/contexts";
import { transformUrl } from "@/utils/transformUrl";
import { colors } from "@/themes";
import { UserProfileHeader } from "@/components/profile/UserProfileHeader";
import { UserProfileContent } from "@/components/profile/UserProfileContent";
import { LeaveConfirmDialog } from "@/components/common";
import type { RootStackParamList } from "../../App";

// Animation constants
const SCROLL_DISTANCE = 120;
const HEADER_EXPANDED_HEIGHT = 340;
const HEADER_COLLAPSED_HEIGHT = 56;

function transformImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return transformUrl(url) || null;
}

function formatJoinDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, "UserProfile">;

/**
 * UserProfileScreen component
 */
export function UserProfileScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<UserProfileScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const toast = useToast();

  const { userId } = route.params;

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  useEffect(() => {
    const unsubOnline = socketService.onFriendOnline(({ userId: onlineId }) => {
      if (onlineId === userId) setIsOnline(true);
    });
    const unsubOffline = socketService.onFriendOffline(({ userId: offlineId }) => {
      if (offlineId === userId) setIsOnline(false);
    });
    return () => { unsubOnline(); unsubOffline(); };
  }, [userId]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollYJS = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollYJS.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await userService.getPublicProfile(userId);
        if (response.success && response.data) {
          setProfile({ ...response.data, avatar: transformImageUrl(response.data.avatar) });
          setIsOnline(response.data.isOnline);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load user profile");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchStatsData = async () => {
      setStatsLoading(true);
      try {
        const [statsResponse, gamesResponse, achievementsResponse] = await Promise.all([
          userService.getOtherUserStats(userId),
          userService.getOtherUserRecentGames(userId, 5),
          userService.getOtherUserAchievements(userId),
        ]);
        if (statsResponse.success && statsResponse.data) setUserStats(statsResponse.data);
        if (gamesResponse.success && gamesResponse.data) setRecentGames(gamesResponse.data);
        if (achievementsResponse.success && achievementsResponse.data) setAchievements(achievementsResponse.data);
      } catch (error: any) {
        toast.error(error.message || "Failed to load user stats");
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStatsData();
  }, [userId]);

  const handleAddFriend = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const response = await friendsService.sendFriendRequest(profile.id);
      if (response.success) {
        toast.success("Friend request sent!");
        setProfile((prev) =>
          prev ? { ...prev, pendingRequest: { id: response.data?.id || "", isSentByMe: true } } : null
        );
      } else {
        toast.error(response.message || "Failed to send request");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send friend request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profile?.pendingRequest) return;
    setActionLoading(true);
    try {
      const response = await friendsService.cancelFriendRequest(profile.pendingRequest.id);
      if (response.success) {
        toast.success("Request cancelled");
        setProfile((prev) => (prev ? { ...prev, pendingRequest: null } : null));
      } else {
        toast.error(response.message || "Failed to cancel request");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile?.pendingRequest) return;
    setActionLoading(true);
    try {
      const response = await friendsService.acceptFriendRequest(profile.pendingRequest.id);
      if (response.success) {
        toast.success("Friend request accepted!");
        setProfile((prev) => (prev ? { ...prev, isFriend: true, pendingRequest: null } : null));
      } else {
        toast.error(response.message || "Failed to accept request");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to accept request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const response = await friendsService.removeFriend(profile.id);
      if (response.success) {
        toast.success("Friend removed");
        setProfile((prev) => (prev ? { ...prev, isFriend: false } : null));
      } else {
        toast.error(response.message || "Failed to remove friend");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove friend");
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    if (!profile) return;
    try {
      const deepLink = `fahman://add-friend?gameId=${profile.gameId}`;
      const shareMessage = `Check out ${profile.displayName || profile.username}'s Fahman profile!\n\nGame ID: ${profile.gameId}\n\nTap to add them: ${deepLink}`;
      await Share.share({ message: shareMessage, title: `Add ${profile.displayName || profile.username} on Fahman!` });
    } catch (error: any) {
      toast.error(error.message || "Failed to share profile");
    }
  };

  const handleMessage = () => {
    if (!profile || !displayData) return;
    navigation.navigate("Home", {
      openChatWith: {
        id: profile.id,
        name: displayData.name,
        initials: displayData.initials,
        avatar: profile.avatar || undefined,
      },
    });
  };

  const displayData = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.displayName || profile.username,
      username: `@${profile.username}`,
      initials: getInitials(profile.displayName || profile.username),
      avatar: profile.avatar,
      bio: profile.bio || "",
      gameId: profile.gameId,
      isPremium: profile.isPremium,
      joinDate: formatJoinDate(profile.createdAt),
      stats: userStats
        ? { gamesPlayed: userStats.gamesPlayed, wins: userStats.wins, winRate: userStats.winRate, friends: profile.friendsCount, currentStreak: userStats.currentStreak, bestStreak: userStats.bestStreak }
        : { gamesPlayed: 0, wins: 0, winRate: 0, friends: profile.friendsCount, currentStreak: 0, bestStreak: 0 },
      achievements: achievements.map((a) => ({ id: a.id, name: a.name, icon: "trophy" as any, color: colors.gold, earned: a.unlocked })),
      recentGames: recentGames.map((g) => ({ id: g.id, packName: g.packTitle, result: g.result, score: g.score, date: new Date(g.playedAt).toLocaleDateString() })),
    };
  }, [profile, userStats, achievements, recentGames]);

  const expandedOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const collapsedOpacity = scrollY.interpolate({
    inputRange: [SCROLL_DISTANCE * 0.4, SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const expandedTranslateY = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [0, -30],
    extrapolate: "clamp",
  });
  const expandedScale = scrollY.interpolate({
    inputRange: [0, SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  const topBarHeight = insets.top + 56;

  if (profileLoading || !displayData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <UserProfileHeader
        displayData={displayData}
        profile={profile}
        isOnline={isOnline}
        insets={insets}
        headerHeight={headerHeight}
        expandedOpacity={expandedOpacity}
        collapsedOpacity={collapsedOpacity}
        expandedTranslateY={expandedTranslateY}
        expandedScale={expandedScale}
        actionLoading={actionLoading}
        onGoBack={() => navigation.goBack()}
        onMessage={handleMessage}
        onAddFriend={handleAddFriend}
        onCancelRequest={handleCancelRequest}
        onAcceptRequest={handleAcceptRequest}
        onRemoveFriend={() => setShowRemoveConfirm(true)}
        onShare={handleShare}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topBarHeight + HEADER_EXPANDED_HEIGHT - 20 },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: (event: any) => {
            scrollYJS.setValue(event.nativeEvent.contentOffset.y);
          },
        })}
      >
        <UserProfileContent displayData={displayData} statsLoading={statsLoading} />
      </Animated.ScrollView>

      <LeaveConfirmDialog
        visible={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => {
          setShowRemoveConfirm(false);
          handleRemoveFriend();
        }}
        title="Remove Friend?"
        message={`Are you sure you want to remove ${displayData.name} from your friends?`}
        confirmLabel="Remove"
        icon="person-remove"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
