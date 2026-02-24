/**
 * RecentGameItem - Profile recent game list item
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface RecentGameItemProps {
  packName: string;
  result: string;
  score: number;
  date: string;
}

export function RecentGameItem({ packName, result, score, date }: RecentGameItemProps) {
  const isWin = result === "won";
  return (
    <View
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral[100] }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: withOpacity(isWin ? colors.success : colors.neutral[400], 0.12) }}
      >
        <Icon name={isWin ? "trophy" : "game-controller"} size="sm" color={isWin ? colors.success : colors.neutral[500]} />
      </View>
      <View className="flex-1 ml-3">
        <Text variant="body" className="font-medium" numberOfLines={1}>{packName}</Text>
        <Text variant="caption" style={{ color: colors.neutral[400] }}>{date}</Text>
      </View>
      <View className="items-end">
        <Text variant="body" className="font-semibold" style={{ color: isWin ? colors.success : colors.neutral[600] }}>{score}</Text>
        <Text variant="caption" style={{ color: isWin ? colors.success : colors.neutral[400], fontSize: 10 }}>
          {isWin ? "Won" : "Lost"}
        </Text>
      </View>
    </View>
  );
}
