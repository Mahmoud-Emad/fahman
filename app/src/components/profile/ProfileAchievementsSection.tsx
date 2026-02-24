/**
 * ProfileAchievementsSection - Achievements list for ProfileScreen
 */
import React from "react";
import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Icon } from "@/components/ui";
import { AchievementBadge } from "./AchievementBadge";
import { colors } from "@/themes";

interface ProfileAchievementsSectionProps {
  achievements: { id: string; name: string; icon: any; color: string; earned: boolean }[];
  statsLoading: boolean;
}

/**
 * Achievements section for profile screen
 */
export function ProfileAchievementsSection({ achievements, statsLoading }: ProfileAchievementsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="h4">Achievements</Text>
        {achievements.length > 0 && (
          <Pressable>
            <Text variant="body-sm" style={{ color: colors.primary[500] }}>View All</Text>
          </Pressable>
        )}
      </View>
      {statsLoading ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
        </View>
      ) : achievements.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {achievements.map((achievement) => (
            <AchievementBadge key={achievement.id} {...achievement} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="trophy-outline" size="xl" color={colors.neutral[300]} />
          <Text variant="body" color="secondary" style={{ marginTop: 8 }}>No achievements yet</Text>
          <Text variant="caption" color="muted" style={{ marginTop: 4 }}>Play games to unlock achievements</Text>
        </View>
      )}
    </View>
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
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
});
