/**
 * ProfileAchievementsSection - Achievements list for ProfileScreen
 */
import React, { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Icon, Modal } from "@/components/ui";
import { AchievementBadge } from "./AchievementBadge";
import { colors, withOpacity } from "@/themes";

interface AchievementItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  earned: boolean;
}

interface ProfileAchievementsSectionProps {
  achievements: AchievementItem[];
  statsLoading: boolean;
}

/**
 * Grid badge for modal — fixed-width cell, no horizontal margin
 */
function GridBadge({ name, icon, color, earned }: AchievementItem) {
  return (
    <View style={modalStyles.gridCell}>
      <View
        style={[
          modalStyles.badgeIcon,
          {
            backgroundColor: earned ? withOpacity(color, 0.12) : colors.neutral[100],
            opacity: earned ? 1 : 0.5,
          },
        ]}
      >
        <Icon name={icon as any} size="md" color={earned ? color : colors.neutral[400]} />
      </View>
      <Text
        variant="caption"
        numberOfLines={1}
        style={{
          color: earned ? colors.neutral[700] : colors.neutral[400],
          fontSize: 10,
          textAlign: "center",
          marginTop: 6,
        }}
      >
        {name}
      </Text>
    </View>
  );
}

/**
 * Full achievements list modal
 */
function AchievementsModal({
  visible,
  onClose,
  achievements,
}: {
  visible: boolean;
  onClose: () => void;
  achievements: AchievementItem[];
}) {
  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <Modal visible={visible} onClose={onClose} title="Achievements">
      <View style={modalStyles.summary}>
        <Icon name="trophy" size="md" color={colors.gold} />
        <Text variant="body" className="font-semibold ml-2">
          {earned.length} / {achievements.length} Unlocked
        </Text>
      </View>

      {earned.length > 0 && (
        <View style={modalStyles.group}>
          <Text variant="body-sm" className="font-semibold" style={{ color: colors.neutral[600], marginBottom: 12 }}>
            Earned
          </Text>
          <View style={modalStyles.grid}>
            {earned.map((a) => (
              <GridBadge key={a.id} {...a} />
            ))}
          </View>
        </View>
      )}

      {locked.length > 0 && (
        <View style={modalStyles.group}>
          <Text variant="body-sm" className="font-semibold" style={{ color: colors.neutral[400], marginBottom: 12 }}>
            Locked
          </Text>
          <View style={modalStyles.grid}>
            {locked.map((a) => (
              <GridBadge key={a.id} {...a} />
            ))}
          </View>
        </View>
      )}
    </Modal>
  );
}

const GRID_COLUMNS = 4;
const GRID_GAP = 12;

const modalStyles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: withOpacity(colors.gold, 0.08),
    borderRadius: 12,
  },
  group: {
    marginTop: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -(GRID_GAP / 2),
  },
  gridCell: {
    width: `${100 / GRID_COLUMNS}%` as any,
    alignItems: "center",
    paddingHorizontal: GRID_GAP / 2,
    marginBottom: 16,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Achievements section for profile screen
 */
export function ProfileAchievementsSection({ achievements, statsLoading }: ProfileAchievementsSectionProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="h4">Achievements</Text>
        {achievements.length > 0 && (
          <Pressable onPress={() => setModalVisible(true)} delayPressIn={0}>
            <Text variant="body-sm" style={{ color: colors.primary[500] }}>View All</Text>
          </Pressable>
        )}
      </View>
      {statsLoading ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
        </View>
      ) : earnedCount > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {achievements.filter((a) => a.earned).map((achievement) => (
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

      <AchievementsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        achievements={achievements}
      />
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
