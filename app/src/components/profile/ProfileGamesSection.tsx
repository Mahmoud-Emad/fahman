/**
 * ProfileGamesSection - Recent games list and footer for ProfileScreen
 */
import React, { useState, useEffect } from "react";
import { View, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Text, Icon, Modal } from "@/components/ui";
import { RecentGameItem } from "./RecentGameItem";
import { userService, type RecentGame } from "@/services/userService";
import { colors } from "@/themes";

interface ProfileGamesSectionProps {
  recentGames: { id: string; packName: string; result: string; score: number; date: string }[];
  statsLoading: boolean;
  joinDate: string;
  userId?: string;
}

/**
 * Modal showing full game history
 */
function AllGamesModal({
  visible,
  onClose,
  userId,
}: {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const [games, setGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const response = userId
          ? await userService.getOtherUserRecentGames(userId, 50)
          : await userService.getRecentGames(50);
        if (response.success && response.data) {
          setGames(response.data);
        }
      } catch {
        // Silently fail — user already sees the preview
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [visible, userId]);

  return (
    <Modal visible={visible} onClose={onClose} title="Game History">
      {loading ? (
        <View style={modalStyles.loading}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
        </View>
      ) : games.length > 0 ? (
        games.map((game) => (
          <RecentGameItem
            key={game.id}
            packName={game.packTitle}
            result={game.result}
            score={game.score}
            date={new Date(game.playedAt).toLocaleDateString()}
          />
        ))
      ) : (
        <View style={modalStyles.empty}>
          <Icon name="game-controller-outline" size="xl" color={colors.neutral[300]} />
          <Text variant="body" color="secondary" style={{ marginTop: 8 }}>No games played yet</Text>
        </View>
      )}
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  loading: {
    paddingVertical: 32,
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
  },
});

/**
 * Recent games and footer for the profile screen
 */
export function ProfileGamesSection({ recentGames, statsLoading, joinDate, userId }: ProfileGamesSectionProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h4">Recent Games</Text>
          {recentGames.length > 0 && (
            <Pressable onPress={() => setModalVisible(true)} delayPressIn={0}>
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

      <AllGamesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userId={userId}
      />
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
    paddingTop: 24,
    paddingBottom: 8,
  },
});
