/**
 * AchievementBadge - Profile achievement badge component
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon, type IconName } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface AchievementBadgeProps {
  name: string;
  icon: IconName;
  color: string;
  earned: boolean;
}

export function AchievementBadge({ name, icon, color, earned }: AchievementBadgeProps) {
  return (
    <View className="items-center mr-4">
      <View
        className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5"
        style={{
          backgroundColor: earned ? withOpacity(color, 0.12) : colors.neutral[100],
          opacity: earned ? 1 : 0.5,
        }}
      >
        <Icon name={icon} size="md" color={earned ? color : colors.neutral[400]} />
      </View>
      <Text
        variant="caption"
        style={{
          color: earned ? colors.neutral[700] : colors.neutral[400],
          fontSize: 10,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}
