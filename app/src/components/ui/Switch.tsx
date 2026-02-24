/**
 * Switch component - Toggle switch for boolean options
 * Supports full customization via props for colors, dimensions, and styling
 */
import React from "react";
import {
  Pressable,
  Animated,
  View,
  type ViewStyle,
} from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "./Text";

/**
 * Switch size options
 */
export type SwitchSize = "sm" | "md" | "lg";

/**
 * Props for the Switch component
 */
export interface SwitchProps {
  /** Whether the switch is on */
  value: boolean;
  /** Callback when switch is toggled */
  onValueChange: (value: boolean) => void;
  /** Switch size */
  size?: SwitchSize;
  /** Disabled state */
  disabled?: boolean;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: "left" | "right";
  /** Additional class names for container */
  className?: string;
  /** Custom active track color class */
  activeTrackColor?: string;
  /** Custom inactive track color class */
  inactiveTrackColor?: string;
  /** Custom thumb color class */
  thumbColor?: string;
  /** Custom margin class */
  margin?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Size to dimension mapping
 */
const sizeDimensions: Record<SwitchSize, { track: { width: number; height: number }; thumb: number }> = {
  sm: { track: { width: 36, height: 20 }, thumb: 16 },
  md: { track: { width: 48, height: 26 }, thumb: 22 },
  lg: { track: { width: 60, height: 32 }, thumb: 28 },
};

/**
 * Switch component for boolean toggles
 */
export function Switch({
  value,
  onValueChange,
  size = "md",
  disabled = false,
  label,
  labelPosition = "right",
  className,
  activeTrackColor = "bg-primary-500",
  inactiveTrackColor = "bg-surface-secondary",
  thumbColor = "bg-white",
  margin,
  style,
}: SwitchProps) {
  const dimensions = sizeDimensions[size];
  const thumbOffset = dimensions.track.width - dimensions.thumb - 4;

  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const thumbTranslate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, thumbOffset],
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const switchElement = (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        "justify-center rounded-full",
        value ? activeTrackColor : inactiveTrackColor,
        disabled && "opacity-50"
      )}
      style={{
        width: dimensions.track.width,
        height: dimensions.track.height,
      }}
    >
      <Animated.View
        className={cn("rounded-full shadow-sm", thumbColor)}
        style={{
          width: dimensions.thumb,
          height: dimensions.thumb,
          transform: [{ translateX: thumbTranslate }],
        }}
      />
    </Pressable>
  );

  if (!label) {
    return (
      <View className={cn(margin, className)} style={style}>
        {switchElement}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        "flex-row items-center",
        margin,
        disabled && "opacity-50",
        className
      )}
      style={style}
    >
      {labelPosition === "left" && (
        <Text className="mr-3">{label}</Text>
      )}
      {switchElement}
      {labelPosition === "right" && (
        <Text className="ml-3">{label}</Text>
      )}
    </Pressable>
  );
}
