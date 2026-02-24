/**
 * SettingToggle - Reusable setting toggle row component
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Switch } from "@/components/ui";

export interface SettingToggleProps {
  /** Setting title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Current toggle value */
  value: boolean;
  /** Callback when value changes */
  onValueChange: (value: boolean) => void;
  /** Optional additional className */
  className?: string;
}

/**
 * Setting toggle row with title, optional description, and switch
 */
export function SettingToggle({
  title,
  description,
  value,
  onValueChange,
  className,
}: SettingToggleProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      className={`flex-row items-center py-3 px-4 pl-6 ${className || ""}`}
    >
      <View className="flex-1 mr-4">
        <Text variant="body">{title}</Text>
        {description && (
          <Text variant="caption" color="muted" className="mt-0.5">
            {description}
          </Text>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} size="sm" />
    </Pressable>
  );
}
