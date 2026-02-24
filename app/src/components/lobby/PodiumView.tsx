/**
 * PodiumView - Top 3 players podium display
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors } from "@/themes";
import type { Player } from "./types";

/**
 * Podium player card - Compact card for podium display
 */
function PodiumPlayerCard({
  player,
  rank,
  onPress,
}: {
  player: Player;
  rank: number;
  onPress: (player: Player) => void;
}) {
  const statusColor =
    player.isCorrect === true
      ? colors.success
      : player.isCorrect === false
      ? colors.error
      : player.hasAnswered
      ? colors.primary[500]
      : colors.neutral[400];

  const rankStyles = {
    1: { ...colors.medals.gold, height: 100 },
    2: { ...colors.medals.silver, height: 85 },
    3: { ...colors.medals.bronze, height: 75 },
  };
  const style = rankStyles[rank as 1 | 2 | 3];

  return (
    <Pressable
      onPress={() => onPress(player)}
      className="items-center active:opacity-90"
      style={{ flex: 1 }}
    >
      {/* Avatar with indicators */}
      <View className="relative mb-1">
        <View
          className="rounded-full p-0.5"
          style={{ borderWidth: 2.5, borderColor: style.border }}
        >
          <Avatar source={player.avatar} initials={player.initials} size={rank === 1 ? "lg" : "md"} />
        </View>
        {/* Status indicator */}
        <View
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: statusColor, borderWidth: 2, borderColor: colors.white }}
        >
          {player.isCorrect === true ? (
            <Icon name="checkmark" customSize={10} color={colors.white} />
          ) : player.isCorrect === false ? (
            <Icon name="close" customSize={10} color={colors.white} />
          ) : player.hasAnswered ? (
            <Icon name="checkmark" customSize={8} color={colors.white} />
          ) : (
            <Icon name="ellipsis-horizontal" customSize={8} color={colors.white} />
          )}
        </View>
        {/* Friend indicator */}
        {player.isFriend && (
          <View
            className="absolute -top-1 -left-1 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary[500], borderWidth: 2, borderColor: colors.white }}
          >
            <Icon name="people" customSize={10} color={colors.white} />
          </View>
        )}
        {/* Muted indicator */}
        {player.isMuted && (
          <View
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.neutral[500], borderWidth: 2, borderColor: colors.white }}
          >
            <Icon name="volume-mute" customSize={8} color={colors.white} />
          </View>
        )}
      </View>

      {/* Name */}
      <Text
        variant="caption"
        className="font-semibold text-center"
        numberOfLines={1}
        style={{ maxWidth: 80 }}
      >
        {player.name}
      </Text>

      {/* Score */}
      <Text variant="caption" className="font-bold" style={{ color: style.border }}>
        {player.score}
      </Text>

      {/* Podium stand */}
      <View
        className="w-full rounded-t-lg mt-1 items-center justify-center"
        style={{ height: style.height, backgroundColor: style.bg, maxWidth: 70 }}
      >
        <Text
          className="font-bold"
          style={{ fontSize: rank === 1 ? 28 : 22, color: style.text }}
        >
          {rank}
        </Text>
      </View>
    </Pressable>
  );
}

interface PodiumViewProps {
  players: Player[];
  onPlayerPress: (player: Player) => void;
}

/**
 * Podium view - Shows top 3 players in competition style
 */
export function PodiumView({ players, onPlayerPress }: PodiumViewProps) {
  if (players.length === 0) return null;

  const first = players[0];
  const second = players[1];
  const third = players[2];

  return (
    <View className="flex-row items-end justify-center px-2" style={{ height: 180 }}>
      {third && <PodiumPlayerCard player={third} rank={3} onPress={onPlayerPress} />}
      {first && <PodiumPlayerCard player={first} rank={1} onPress={onPlayerPress} />}
      {second && <PodiumPlayerCard player={second} rank={2} onPress={onPlayerPress} />}
    </View>
  );
}
