/**
 * Divider component - Visual separator for content sections
 * Supports full customization via props for colors, dimensions, and styling
 */
import React from "react";
import { View, type ViewStyle } from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "./Text";

/**
 * Divider orientation options
 */
export type DividerOrientation = "horizontal" | "vertical";

/**
 * Props for the Divider component
 */
export interface DividerProps {
  /** Divider orientation */
  orientation?: DividerOrientation;
  /** Label text (displayed in center of divider) */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Custom color class */
  color?: string;
  /** Custom thickness */
  thickness?: number;
  /** Custom margin class */
  margin?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Divider component for visual separation
 */
export function Divider({
  orientation = "horizontal",
  label,
  className,
  color = "bg-border",
  thickness = 1,
  margin,
  style,
}: DividerProps) {
  const isHorizontal = orientation === "horizontal";

  if (label && isHorizontal) {
    return (
      <View
        className={cn("flex-row items-center", margin || "my-4", className)}
        style={style}
      >
        <View
          className={cn("flex-1", color)}
          style={{ height: thickness }}
        />
        <Text variant="caption" color="muted" className="px-3">
          {label}
        </Text>
        <View
          className={cn("flex-1", color)}
          style={{ height: thickness }}
        />
      </View>
    );
  }

  return (
    <View
      className={cn(
        color,
        isHorizontal ? (margin || "my-4") : (margin || "mx-4"),
        className
      )}
      style={[
        isHorizontal
          ? { height: thickness, width: "100%" }
          : { width: thickness, height: "100%" },
        style,
      ]}
    />
  );
}
