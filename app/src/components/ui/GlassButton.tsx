/**
 * GlassButton - Translucent glass-style button
 * Used for overlay buttons on images/gradients
 */
import React from "react";
import { Pressable, type ViewStyle } from "react-native";
import { colors, withOpacity } from "@/themes";

export interface GlassButtonProps {
  /** Press handler */
  onPress?: () => void;
  /** Button content */
  children: React.ReactNode;
  /** Custom style overrides */
  style?: ViewStyle;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * Glass-style button with translucent background
 * Perfect for use on images or gradient backgrounds
 */
export function GlassButton({
  onPress,
  children,
  style,
  disabled = false,
}: GlassButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="rounded-full items-center justify-center active:scale-95"
      style={[
        {
          backgroundColor: withOpacity(colors.white, 0.15),
          borderWidth: 1,
          borderColor: withOpacity(colors.white, 0.25),
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
