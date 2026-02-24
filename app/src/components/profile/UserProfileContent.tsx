/**
 * UserProfileContent - Scrollable body content for user profile
 * Shows stats, streak, achievements, and recent games sections
 */
import React from "react";
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Icon } from "@/components/ui";
import { StatCard } from "./StatCard";
import { AchievementBadge } from "./AchievementBadge";
import { RecentGameItem } from "./RecentGameItem";
import { colors } from "@/themes";
import type { DisplayData } from "./UserProfileHeader";

/** Blue used for the "Friends" stat card — no direct theme equivalent */
const STAT_COLOR_FRIENDS = "#3B82F6";

interface UserProfileContentProps {
  displayData: DisplayData;
  statsLoading: boolean;
}

/**
 * Scrollable content sections for user profile
 */
export function UserProfileContent({ displayData, statsLoading }: UserProfileContentProps) {
  return (
    <>
      {/* Stats Card */}
      <View style={styles.statsCard}>
        <StatCard label="Games" value={displayData.stats.gamesPlayed} icon="game-controller" color={colors.primary[500]} />
        <StatCard label="Wins" value={displayData.stats.wins} icon="trophy" color={colors.gold} />
        <StatCard label="Win Rate" value={`${displayData.stats.winRate}%`} icon="trending-up" color={colors.success} />
        <StatCard label="Friends" value={displayData.stats.friends} icon="people" color={STAT_COLOR_FRIENDS} />
      </View>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakIcon}>
          <Icon name="flame" size="md" color={colors.error} />
        </View>
        <View style={styles.streakText}>
          <Text variant="body" className="font-semibold">
            {displayData.stats.currentStreak} Day Streak
          </Text>
          <Text variant="caption" style={{ color: colors.neutral[500] }}>
            Best: {displayData.stats.bestStreak} days
          </Text>
        </View>
        <Text variant="h3">{"🔥"}</Text>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h4">Achievements</Text>
        </View>
        {statsLoading ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        ) : displayData.achievements.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {displayData.achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} {...achievement} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="trophy-outline" size="xl" color={colors.neutral[300]} />
            <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
              No achievements yet
            </Text>
          </View>
        )}
      </View>

      {/* Recent Games */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h4">Recent Games</Text>
        </View>
        <View style={styles.gamesContainer}>
          {statsLoading ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : displayData.recentGames.length > 0 ? (
            displayData.recentGames.map((game) => <RecentGameItem key={game.id} {...game} />)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="game-controller-outline" size="xl" color={colors.neutral[300]} />
              <Text variant="body" color="secondary" style={{ marginTop: 8 }}>
                No games played yet
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Member since */}
      <View style={styles.footer}>
        <Text variant="caption" style={{ color: colors.neutral[400] }}>
          Member since {displayData.joinDate}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 16,
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
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  streakText: {
    flex: 1,
    marginLeft: 12,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  gamesContainer: {
    marginHorizontal: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
  },
});
