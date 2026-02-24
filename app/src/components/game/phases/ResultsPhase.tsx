/**
 * ResultsPhase - Final game results display
 */
import React from "react";
import { View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Player } from "../types";
import type { RootStackParamList } from "../../../../App";

interface ResultsPhaseProps {
  /** List of players (will be sorted by score) */
  players: Player[];
}

/**
 * Results phase component - shown at end of game
 */
export function ResultsPhase({ players }: ResultsPhaseProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handlePlayerPress = (playerId: string) => {
    navigation.navigate("UserProfile", { userId: playerId });
  };

  return (
    <View className="items-center py-8">
      <Icon name="diamond" size="xl" color={colors.primary[500]} />
      <Text variant="h2" className="font-bold mt-4">
        Game Over!
      </Text>
      <Text variant="body" color="secondary" className="mt-2">
        Final Scores
      </Text>

      <View className="w-full mt-6">
        {sortedPlayers.map((player, index) => (
          <Pressable
            key={player.id}
            onPress={() => handlePlayerPress(player.id)}
            className="flex-row items-center p-3 rounded-xl mb-2 active:opacity-80"
            style={{
              backgroundColor:
                index === 0 ? withOpacity(colors.primary[500], 0.1) : colors.neutral[50],
              borderWidth: index === 0 ? 2 : 1,
              borderColor: index === 0 ? colors.primary[500] : colors.neutral[200],
            }}
            delayPressIn={0}
          >
            <Text
              variant="h3"
              className="font-bold w-8"
              style={{ color: index === 0 ? colors.primary[500] : colors.neutral[500] }}
            >
              #{index + 1}
            </Text>
            <Avatar source={player.avatar} initials={player.initials} size="sm" />
            <Text variant="body" className="font-semibold flex-1 ml-3">
              {player.name}
            </Text>
            <Text
              variant="h3"
              className="font-bold"
              style={{ color: colors.primary[500] }}
            >
              {player.score}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
