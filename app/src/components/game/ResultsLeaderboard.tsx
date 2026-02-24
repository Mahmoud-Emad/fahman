/**
 * ResultsLeaderboard - Podium and leaderboard rows for GameResultsScreen
 */
import React from "react";
import { View } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

export interface PlayerScore {
  playerId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  rank: number;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getRankSuffix(rank: number): string {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

export function getMedalColor(rank: number): string {
  if (rank === 1) return colors.medals.gold.bg;
  if (rank === 2) return colors.medals.silver.bg;
  if (rank === 3) return colors.medals.bronze.bg;
  return colors.neutral[400];
}

/**
 * Single leaderboard row
 */
export function LeaderboardRow({
  player,
  isCurrentUser,
}: {
  player: PlayerScore;
  isCurrentUser?: boolean;
}) {
  const initials = getInitials(player.displayName || player.username);
  const isTop3 = player.rank <= 3;
  const medalColor = getMedalColor(player.rank);

  return (
    <View
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{
        backgroundColor: isCurrentUser
          ? withOpacity(colors.primary[500], 0.1)
          : colors.neutral[50],
        borderWidth: isCurrentUser ? 2 : 1,
        borderColor: isCurrentUser ? colors.primary[500] : colors.neutral[200],
      }}
    >
      <View className="w-10 items-center">
        {isTop3 ? (
          <View
            className="w-7 h-7 rounded-full items-center justify-center"
            style={{ backgroundColor: medalColor }}
          >
            <Text variant="body-sm" className="font-bold" style={{ color: colors.white }}>
              {player.rank}
            </Text>
          </View>
        ) : (
          <Text variant="body" className="font-semibold" color="muted">
            #{player.rank}
          </Text>
        )}
      </View>

      <Avatar uri={player.avatar || undefined} initials={initials} size="sm" />

      <View className="flex-1 ml-3">
        <Text variant="body" className="font-semibold">
          {player.displayName || player.username}
          {isCurrentUser && (
            <Text variant="caption" color="muted">
              {" "}(You)
            </Text>
          )}
        </Text>
      </View>

      <Text variant="body" className="font-bold" style={{ color: colors.primary[500] }}>
        {player.score.toLocaleString()}
      </Text>
    </View>
  );
}

/**
 * Podium for top 3 players
 */
export function Podium({ players }: { players: PlayerScore[] }) {
  const top3 = players.slice(0, 3);

  const podiumOrder =
    top3.length >= 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
      ? [top3[1], top3[0]]
      : top3;

  const podiumHeights = [80, 110, 60];

  return (
    <View className="flex-row justify-center items-end mt-6 px-4">
      {podiumOrder.map((player, index) => {
        const actualRank = player.rank;
        const podiumHeight = podiumHeights[index] || 60;
        const initials = getInitials(player.displayName || player.username);
        const medalColor = getMedalColor(actualRank);

        return (
          <View key={player.playerId} className="items-center mx-2" style={{ width: 90 }}>
            <View
              className="rounded-full p-0.5 mb-2"
              style={{ borderWidth: 2, borderColor: medalColor }}
            >
              <Avatar
                uri={player.avatar || undefined}
                initials={initials}
                size={actualRank === 1 ? "lg" : "md"}
              />
            </View>

            <Text
              variant="body-sm"
              className="font-semibold text-center"
              numberOfLines={1}
            >
              {player.displayName || player.username}
            </Text>

            <Text variant="caption" color="muted">
              {player.score.toLocaleString()}
            </Text>

            <View
              className="w-full rounded-t-xl mt-2 items-center justify-center"
              style={{ height: podiumHeight, backgroundColor: medalColor }}
            >
              <Text variant="h2" className="font-black" style={{ color: colors.white }}>
                {actualRank}
                <Text variant="body-sm" style={{ color: colors.white }}>
                  {getRankSuffix(actualRank)}
                </Text>
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
