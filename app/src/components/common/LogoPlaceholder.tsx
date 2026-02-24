/**
 * LogoPlaceholder component - Placeholder for the app logo
 * Will be replaced with actual logo image later
 */
import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { colors, withOpacity } from "@/themes";

/**
 * Props for the LogoPlaceholder component
 */
export interface LogoPlaceholderProps {
  /** Width of the placeholder */
  width?: number;
  /** Height of the placeholder */
  height?: number;
}

/**
 * LogoPlaceholder component
 */
export function LogoPlaceholder({
  width = 200,
  height = 150,
}: LogoPlaceholderProps) {
  return (
    <View
      className="items-center justify-center rounded-xl"
      style={{
        width,
        height,
        backgroundColor: withOpacity(colors.primary[500], 0.1),
        borderWidth: 2,
        borderColor: withOpacity(colors.primary[500], 0.3),
        borderStyle: "dashed",
      }}
    >
      <Text variant="h3" color="primary" className="font-bold">
        LOGO
      </Text>
      <Text variant="caption" color="muted">
        Coming Soon
      </Text>
    </View>
  );
}
