/**
 * WaveDivider component - Decorative wave separator
 * Creates an orange wave effect between sections
 */
import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/themes";

/**
 * Props for the WaveDivider component
 */
export interface WaveDividerProps {
  /** Wave color (defaults to primary orange) */
  color?: string;
  /** Height of the wave */
  height?: number;
  /** Whether to flip the wave vertically */
  flip?: boolean;
}

/**
 * WaveDivider component
 */
export function WaveDivider({
  color = colors.primary[500],
  height = 50,
  flip = false,
}: WaveDividerProps) {
  return (
    <View
      style={{
        height,
        width: "100%",
        transform: flip ? [{ scaleY: -1 }] : undefined,
      }}
    >
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <Path
          fill={color}
          d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,85.3C672,75,768,53,864,48C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
        />
      </Svg>
    </View>
  );
}
