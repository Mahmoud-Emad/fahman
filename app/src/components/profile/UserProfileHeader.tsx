/**
 * UserProfileHeader - Animated collapsing header for user profile
 * Shows avatar, name, action buttons with scroll-driven animations
 */
import React from "react";
import { View, Pressable, Animated, StyleSheet, ActivityIndicator } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";
import { Text, Icon, Avatar, type IconName } from "@/components/ui";
import { type PublicUserProfile } from "@/services/userService";
import { colors, withOpacity } from "@/themes";

export interface DisplayData {
  name: string;
  username: string;
  initials: string;
  avatar: string | null;
  bio: string;
  gameId: number;
  isPremium: boolean;
  joinDate: string;
  stats: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
    friends: number;
    currentStreak: number;
    bestStreak: number;
  };
  achievements: { id: string; name: string; icon: IconName; color: string; earned: boolean }[];
  recentGames: { id: string; packName: string; result: string; score: number; date: string }[];
}

interface UserProfileHeaderProps {
  displayData: DisplayData;
  profile: PublicUserProfile | null;
  isOnline: boolean;
  insets: EdgeInsets;
  headerHeight: Animated.AnimatedInterpolation<number>;
  expandedOpacity: Animated.AnimatedInterpolation<number>;
  collapsedOpacity: Animated.AnimatedInterpolation<number>;
  expandedTranslateY: Animated.AnimatedInterpolation<number>;
  expandedScale: Animated.AnimatedInterpolation<number>;
  actionLoading: boolean;
  onGoBack: () => void;
  onMessage: () => void;
  onAddFriend: () => void;
  onCancelRequest: () => void;
  onAcceptRequest: () => void;
  onRemoveFriend: () => void;
  onShare: () => void;
}

/**
 * Animated collapsing profile header component
 */
export function UserProfileHeader({
  displayData,
  profile,
  isOnline,
  insets,
  headerHeight,
  expandedOpacity,
  collapsedOpacity,
  expandedTranslateY,
  expandedScale,
  actionLoading,
  onGoBack,
  onMessage,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onRemoveFriend,
  onShare,
}: UserProfileHeaderProps) {
  const renderActionButton = () => {
    if (profile?.isCurrentUser) {
      return (
        <Pressable onPress={onGoBack} style={styles.primaryButton}>
          <Text variant="body-sm" className="font-medium" style={{ color: colors.white }}>
            View My Profile
          </Text>
        </Pressable>
      );
    }

    if (profile?.isFriend) {
      return (
        <View style={styles.actionButtons}>
          <Pressable onPress={onMessage} style={styles.primaryButton}>
            <Icon name="chatbubble" size="xs" color={colors.white} />
            <Text variant="body-sm" className="font-medium ml-1" style={{ color: colors.white }}>
              Message
            </Text>
          </Pressable>
          <Pressable onPress={onRemoveFriend} disabled={actionLoading} style={styles.secondaryButton}>
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Icon name="close-circle" size="xs" color={colors.error} />
                <Text variant="body-sm" className="font-medium ml-1" style={{ color: colors.error }}>
                  Remove
                </Text>
              </>
            )}
          </Pressable>
          <Pressable onPress={onShare} style={styles.shareButton}>
            <Icon name="share-social" size="xs" color={colors.primary[500]} />
          </Pressable>
        </View>
      );
    }

    if (profile?.pendingRequest) {
      if (profile.pendingRequest.isSentByMe) {
        return (
          <Pressable onPress={onCancelRequest} disabled={actionLoading} style={styles.pendingButton}>
            {actionLoading ? (
              <ActivityIndicator size="small" color={colors.neutral[600]} />
            ) : (
              <Text variant="body-sm" className="font-medium" style={{ color: colors.neutral[600] }}>
                Request Sent
              </Text>
            )}
          </Pressable>
        );
      } else {
        return (
          <View style={styles.actionButtons}>
            <Pressable onPress={onAcceptRequest} disabled={actionLoading} style={styles.primaryButton}>
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text variant="body-sm" className="font-medium" style={{ color: colors.white }}>
                  Accept Request
                </Text>
              )}
            </Pressable>
            <Pressable onPress={onShare} style={styles.shareButton}>
              <Icon name="share-social" size="xs" color={colors.primary[500]} />
            </Pressable>
          </View>
        );
      }
    }

    return (
      <View style={styles.actionButtons}>
        <Pressable onPress={onAddFriend} disabled={actionLoading} style={styles.primaryButton}>
          {actionLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Icon name="person-add" size="xs" color={colors.white} />
              <Text variant="body-sm" className="font-medium ml-1" style={{ color: colors.white }}>
                Add Friend
              </Text>
            </>
          )}
        </Pressable>
        <Pressable onPress={onShare} style={styles.shareButton}>
          <Icon name="share-social" size="xs" color={colors.primary[500]} />
        </Pressable>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.headerBackground,
        { height: Animated.add(headerHeight, insets.top), paddingTop: insets.top },
      ]}
    >
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={onGoBack} style={styles.iconButton}>
          <Icon name="chevron-back" color={colors.white} size="lg" />
        </Pressable>

        {/* Collapsed Content */}
        <Animated.View style={[styles.collapsedContent, { opacity: collapsedOpacity }]}>
          <Avatar
            initials={displayData.initials}
            uri={displayData.avatar || undefined}
            size="sm"
            bgColor="bg-white"
            textColor="text-primary-500"
          />
          <View style={styles.collapsedText}>
            <Text variant="body" className="font-semibold" style={{ color: colors.white }}>
              {displayData.name}
            </Text>
            <Text variant="caption" style={{ color: withOpacity(colors.white, 0.8) }}>
              {displayData.username}
            </Text>
          </View>
        </Animated.View>

        <View style={{ width: 40 }} />
      </View>

      {/* Expanded Profile Content */}
      <Animated.View
        style={[
          styles.expandedContent,
          {
            opacity: expandedOpacity,
            transform: [{ translateY: expandedTranslateY }, { scale: expandedScale }],
          },
        ]}
      >
        <View style={styles.avatarContainer}>
          <Avatar
            initials={displayData.initials}
            uri={displayData.avatar || undefined}
            size="xl"
            bgColor="bg-white"
            textColor="text-primary-500"
          />
          {displayData.isPremium && (
            <View style={styles.premiumBadge}>
              <Icon name="diamond" size="xs" color={colors.white} />
            </View>
          )}
          {!profile?.isCurrentUser && (
            <View
              style={[
                styles.onlineIndicator,
                { backgroundColor: isOnline ? colors.success : colors.neutral[400] },
              ]}
            />
          )}
        </View>

        <Text variant="h2" style={styles.userName}>
          {displayData.name}
        </Text>
        <Text variant="body" style={styles.userHandle}>
          {displayData.username}
        </Text>

        <View style={styles.gameIdBadge}>
          <Icon name="game-controller" size="xs" color={colors.white} />
          <Text variant="caption" className="font-semibold ml-1" style={{ color: colors.white }}>
            ID: {displayData.gameId}
          </Text>
        </View>

        {displayData.bio ? (
          <Text variant="body-sm" center style={styles.userBio}>
            {displayData.bio}
          </Text>
        ) : null}

        {renderActionButton()}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary[500],
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 10,
    overflow: "hidden",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 56,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  collapsedContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  collapsedText: {
    marginLeft: 12,
  },
  expandedContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  premiumBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  userName: {
    color: colors.white,
    marginTop: 12,
  },
  userHandle: {
    color: withOpacity(colors.white, 0.8),
    marginTop: 2,
  },
  gameIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: withOpacity(colors.white, 0.2),
  },
  userBio: {
    color: withOpacity(colors.white, 0.7),
    marginTop: 8,
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: withOpacity(colors.white, 0.2),
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  pendingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: withOpacity(colors.white, 0.3),
    marginTop: 16,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
