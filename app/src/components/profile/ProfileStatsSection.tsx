/**
 * ProfileStatsSection - Account info card, stats grid, and streak card for ProfileScreen
 */
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Text, Icon } from "@/components/ui";
import { StatCard } from "./StatCard";
import { colors, withOpacity } from "@/themes";

/** Blue used for the "Friends" stat card */
const STAT_COLOR_FRIENDS = colors.accent.blue;

interface ProfileStatsSectionProps {
  gameId: number;
  email: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  stats: {
    gamesPlayed: number;
    wins: number;
    winRate: number;
    friends: number;
    currentStreak: number;
    bestStreak: number;
  };
  onPhoneManagement: () => void;
  onCopyGameId: () => void;
}

/**
 * Account info, stats grid, and streak for the profile screen
 */
export function ProfileStatsSection({
  gameId,
  email,
  phoneNumber,
  phoneVerified,
  stats,
  onPhoneManagement,
  onCopyGameId,
}: ProfileStatsSectionProps) {
  return (
    <>
      {/* Account Info Card */}
      <View style={styles.accountCard}>
        <View style={styles.accountRow}>
          <View style={styles.accountIcon}>
            <Icon name="game-controller" size="sm" color={colors.primary[500]} />
          </View>
          <View style={styles.accountInfo}>
            <Text variant="caption" style={{ color: colors.neutral[500] }}>Game ID</Text>
            <Text variant="body" className="font-semibold">{gameId}</Text>
          </View>
          <Pressable style={styles.copyButton} onPress={onCopyGameId}>
            <Icon name="copy-outline" size="sm" color={colors.primary[500]} />
          </Pressable>
        </View>

        {email && (
          <View style={[styles.accountRow, styles.accountRowBorder]}>
            <View style={styles.accountIcon}>
              <Icon name="mail-outline" size="sm" color={colors.primary[500]} />
            </View>
            <View style={styles.accountInfo}>
              <Text variant="caption" style={{ color: colors.neutral[500] }}>Email</Text>
              <Text variant="body" className="font-medium">{email}</Text>
            </View>
          </View>
        )}

        <Pressable style={[styles.accountRow, styles.accountRowBorder]} onPress={onPhoneManagement}>
          <View style={styles.accountIcon}>
            <Icon name="call-outline" size="sm" color={colors.primary[500]} />
          </View>
          <View style={styles.accountInfo}>
            <Text variant="caption" style={{ color: colors.neutral[500] }}>Phone</Text>
            {phoneNumber ? (
              <View className="flex-row items-center">
                <Text variant="body" className="font-medium">{phoneNumber}</Text>
                {phoneVerified ? (
                  <View className="ml-2 flex-row items-center">
                    <Icon name="checkmark-circle" size="xs" color={colors.success} />
                    <Text variant="caption" className="ml-1" style={{ color: colors.success }}>Verified</Text>
                  </View>
                ) : (
                  <Text variant="caption" className="ml-2" style={{ color: colors.warning }}>Not verified</Text>
                )}
              </View>
            ) : (
              <Text variant="body" style={{ color: colors.neutral[400] }}>Add phone number</Text>
            )}
          </View>
          <Icon name="chevron-forward" size="sm" color={colors.neutral[400]} />
        </Pressable>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <StatCard label="Games" value={stats.gamesPlayed} icon="game-controller" color={colors.primary[500]} />
        <StatCard label="Wins" value={stats.wins} icon="trophy" color={colors.gold} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} icon="trending-up" color={colors.success} />
        <StatCard label="Friends" value={stats.friends} icon="people" color={STAT_COLOR_FRIENDS} />
      </View>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakIcon}>
          <Icon name="flame" size="md" color={colors.error} />
        </View>
        <View style={styles.streakText}>
          <Text variant="body" className="font-semibold">{stats.currentStreak} Day Streak</Text>
          <Text variant="caption" style={{ color: colors.neutral[500] }}>
            Best: {stats.bestStreak} days
          </Text>
        </View>
        <Text variant="h3">{"🔥"}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    marginHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  accountRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: withOpacity(colors.primary[500], 0.1),
    alignItems: "center",
    justifyContent: "center",
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  copyButton: {
    padding: 8,
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: withOpacity(colors.error, 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  streakText: {
    flex: 1,
    marginLeft: 12,
  },
});
