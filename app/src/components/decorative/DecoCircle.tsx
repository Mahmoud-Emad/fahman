/**
 * DecoCircle - Decorative circle for background effects
 */
import React from "react";
import { View } from "react-native";
import { colors, withOpacity } from "@/themes";

interface DecoCircleProps {
  size: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
  opacity?: number;
}

export function DecoCircle({ size, position, opacity = 0.1 }: DecoCircleProps) {
  return (
    <View
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: withOpacity(colors.white, opacity),
        ...position,
      }}
    />
  );
}
