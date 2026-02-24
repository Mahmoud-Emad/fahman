/**
 * ProfileGamesSection - Recent games list and footer for ProfileScreen
 */
import React from "react";
import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Icon } from "@/components/ui";
import { RecentGameItem } from "./RecentGameItem";
import { colors } from "@/themes";

interface ProfileGamesSectionProps {
  recentGames: { id: string; packName: string; result: string; score: number; date: string }[];
  statsLoading: boolean;
  joinDate: string;
}

/**
 * Recent games and footer for the profile screen
 */
export function ProfileGamesSection({ recentGames, statsLoading, joinDate }: ProfileGamesSectionProps) {
  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h4">Recent Games</Text>
          {recentGames.length > 0 && (
            <Pressable>
              <Text variant="body-sm" style={{ color: colors.primary[500] }}>View All</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.gamesContainer}>
          {statsLoading ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : recentGames.length > 0 ? (
            recentGames.map((game) => <RecentGameItem key={game.id} {...game} />)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="game-controller-outline" size="xl" color={colors.neutral[300]} />
              <Text variant="body" color="secondary" style={{ marginTop: 8 }}>No games played yet</Text>
              <Text variant="caption" color="muted" style={{ marginTop: 4 }}>Start playing to see your history</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text variant="caption" style={{ color: colors.neutral[400] }}>Member since {joinDate}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
