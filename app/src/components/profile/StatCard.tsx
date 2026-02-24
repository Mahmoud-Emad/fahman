/**
 * StatCard - Profile statistics card component
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <View
      className="flex-1 items-center p-3 rounded-2xl mx-1"
      style={{ backgroundColor: withOpacity(color, 0.08) }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: withOpacity(color, 0.15) }}
      >
        <Icon name={icon as any} size="sm" color={color} />
      </View>
      <Text variant="h3" style={{ color: colors.neutral[900] }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: colors.neutral[500], marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}
