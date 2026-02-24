/**
 * Checkbox component - Selection control for boolean options
 * Supports full customization via props for colors, dimensions, and styling
 */
import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "./Text";

/**
 * Checkbox size options
 */
export type CheckboxSize = "sm" | "md" | "lg";

/**
 * Props for the Checkbox component
 */
export interface CheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox is toggled */
  onCheckedChange: (checked: boolean) => void;
  /** Checkbox size */
  size?: CheckboxSize;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Custom checked color class */
  checkedColor?: string;
  /** Custom unchecked color class */
  uncheckedColor?: string;
  /** Custom border radius class */
  borderRadius?: string;
  /** Custom margin class */
  margin?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Size to dimension mapping
 */
const sizeDimensions: Record<CheckboxSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

/**
 * Checkbox component for boolean selection
 */
export function Checkbox({
  checked,
  onCheckedChange,
  size = "md",
  disabled = false,
  label,
  className,
  checkedColor = "bg-primary-500",
  uncheckedColor = "bg-transparent",
  borderRadius = "rounded",
  margin,
  style,
}: CheckboxProps) {
  const dimension = sizeDimensions[size];

  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const checkboxElement = (
    <View
      className={cn(
        "items-center justify-center border-2",
        borderRadius,
        checked ? cn(checkedColor, "border-primary-500") : cn(uncheckedColor, "border-border"),
        disabled && "opacity-50"
      )}
      style={{ width: dimension, height: dimension }}
    >
      {checked && (
        <Text
          className="text-text-inverse font-bold"
          style={{ fontSize: dimension * 0.6, lineHeight: dimension * 0.7 }}
        >
          ✓
        </Text>
      )}
    </View>
  );

  if (!label) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        className={cn(margin, className)}
        style={style}
      >
        {checkboxElement}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn("flex-row items-center", margin, className)}
      style={style}
    >
      {checkboxElement}
      <Text className="ml-2">{label}</Text>
    </Pressable>
  );
}
