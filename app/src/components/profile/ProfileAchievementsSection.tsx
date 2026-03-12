/**
 * ProfileAchievementsSection - Achievements list for ProfileScreen
 */
import React, { useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Icon, Modal, type IconName } from "@/components/ui";
import { AchievementBadge } from "./AchievementBadge";
import { colors, withOpacity } from "@/themes";

export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  earned: boolean;
}

interface ProfileAchievementsSectionProps {
  achievements: AchievementItem[];
  statsLoading: boolean;
  /** Called when "View All" is pressed — parent renders modal outside scroll view */
  onViewAll?: () => void;
}

/**
 * Grid badge for modal — fixed-width cell, tappable for description
 */
function GridBadge({
  achievement,
  onPress,
}: {
  achievement: AchievementItem;
  onPress: () => void;
}) {
  const { name, icon, color, earned } = achievement;
  return (
    <Pressable onPress={onPress} delayPressIn={0} style={modalStyles.gridCell}>
      <View
        style={[
          modalStyles.badgeIcon,
          {
            backgroundColor: earned ? withOpacity(color, 0.12) : colors.neutral[100],
            opacity: earned ? 1 : 0.5,
          },
        ]}
      >
        <Icon name={icon} size="md" color={earned ? color : colors.neutral[400]} />
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
    </Pressable>
  );
}

/**
 * Full achievements list modal
 */
export function AchievementsModal({
  visible,
  onClose,
  achievements,
}: {
  visible: boolean;
  onClose: () => void;
  achievements: AchievementItem[];
}) {
  const [selected, setSelected] = useState<AchievementItem | null>(null);
  const earned = achievements.filter((a) => a.earned);
  const locked = achievements.filter((a) => !a.earned);

  return (
    <Modal visible={visible} onClose={onClose} title="Achievements" maxHeight="85%">
      <View style={modalStyles.summary}>
        <Icon name="trophy" size="md" color={colors.gold} />
        <Text variant="body" className="font-semibold ml-2">
          {earned.length} / {achievements.length} Unlocked
        </Text>
      </View>

      {/* Selected achievement detail */}
      {selected && (
        <Pressable
          onPress={() => setSelected(null)}
          style={modalStyles.detailCard}
        >
          <View style={[modalStyles.detailIcon, { backgroundColor: withOpacity(selected.color, 0.12) }]}>
            <Icon name={selected.icon} size="md" color={selected.earned ? selected.color : colors.neutral[400]} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="body" className="font-semibold">{selected.name}</Text>
            <Text variant="body-sm" style={{ color: colors.neutral[600], marginTop: 2 }}>
              {selected.description}
            </Text>
            <Text variant="caption" style={{ color: selected.earned ? colors.success : colors.neutral[400], marginTop: 4 }}>
              {selected.earned ? "Unlocked" : "Locked"}
            </Text>
          </View>
        </Pressable>
      )}

      {earned.length > 0 && (
        <View style={modalStyles.group}>
          <Text variant="body-sm" className="font-semibold" style={{ color: colors.neutral[600], marginBottom: 12 }}>
            Earned
          </Text>
          <View style={modalStyles.grid}>
            {earned.map((a) => (
              <GridBadge key={a.id} achievement={a} onPress={() => setSelected(a)} />
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
              <GridBadge key={a.id} achievement={a} onPress={() => setSelected(a)} />
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
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: colors.neutral[50],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
export function ProfileAchievementsSection({ achievements, statsLoading, onViewAll }: ProfileAchievementsSectionProps) {
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="h4">Achievements</Text>
        {achievements.length > 0 && onViewAll && (
          <Pressable onPress={onViewAll} delayPressIn={0}>
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
