/**
 * NumberStepper - Numeric input with +/- buttons
 * Used for settings like max players
 */
import React from "react";
import { View, Pressable, type ViewStyle } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface NumberStepperProps {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onValueChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step amount */
  step?: number;
  /** Label text */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Number stepper with +/- buttons
 */
export function NumberStepper({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  helperText,
  disabled = false,
  style,
}: NumberStepperProps) {
  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  const handleDecrement = () => {
    if (canDecrement) {
      onValueChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (canIncrement) {
      onValueChange(Math.min(max, value + step));
    }
  };

  return (
    <View style={style}>
      {/* Label */}
      {label && (
        <Text variant="label" className="mb-2 font-medium">
          {label}
        </Text>
      )}

      {/* Stepper Control */}
      <View
        className="flex-row items-center justify-between rounded-xl px-2"
        style={{
          height: 56,
          backgroundColor: colors.white,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Decrement Button */}
        <Pressable
          onPress={handleDecrement}
          disabled={!canDecrement}
          className="w-12 h-12 rounded-lg items-center justify-center active:bg-surface-secondary"
          style={{
            backgroundColor: canDecrement
              ? withOpacity(colors.primary[500], 0.1)
              : colors.neutral[100],
          }}
        >
          <Icon
            name="remove"
            size="md"
            color={canDecrement ? colors.primary[500] : colors.neutral[300]}
          />
        </Pressable>

        {/* Value Display */}
        <View className="flex-1 items-center">
          <Text
            variant="h3"
            className="font-bold"
            style={{
              color: disabled ? colors.text.muted : colors.text.primary,
            }}
          >
            {value}
          </Text>
        </View>

        {/* Increment Button */}
        <Pressable
          onPress={handleIncrement}
          disabled={!canIncrement}
          className="w-12 h-12 rounded-lg items-center justify-center active:bg-surface-secondary"
          style={{
            backgroundColor: canIncrement
              ? withOpacity(colors.primary[500], 0.1)
              : colors.neutral[100],
          }}
        >
          <Icon
            name="add"
            size="md"
            color={canIncrement ? colors.primary[500] : colors.neutral[300]}
          />
        </Pressable>
      </View>

      {/* Helper Text */}
      {helperText && (
        <Text variant="caption" color="muted" className="mt-1">
          {helperText}
        </Text>
      )}
    </View>
  );
}
