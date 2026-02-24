/**
 * FloatingBadge - Floating badge component for fun stats
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface FloatingBadgeProps {
  icon: string;
  label: string;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}

export function FloatingBadge({ icon, label, position }: FloatingBadgeProps) {
  return (
    <View
      className="absolute flex-row items-center px-3 py-1.5 rounded-full"
      style={{
        ...position,
        backgroundColor: withOpacity(colors.white, 0.2),
        borderWidth: 1,
        borderColor: withOpacity(colors.white, 0.3),
      }}
    >
      <Icon name={icon as any} customSize={14} color={colors.white} />
      <Text
        variant="caption"
        className="ml-1.5 font-semibold"
        style={{ color: colors.white }}
      >
        {label}
      </Text>
    </View>
  );
}
