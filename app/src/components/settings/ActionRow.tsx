/**
 * ActionRow - Action row component for settings and menus
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

export interface ActionRowProps {
  /** Icon element to display on the left */
  icon?: React.ReactNode;
  /** Row title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Press handler */
  onPress: () => void;
  /** Optional right side element (defaults to chevron) */
  rightElement?: React.ReactNode;
  /** Whether to show divider below */
  showDivider?: boolean;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Whether this is a destructive action (red text) */
  destructive?: boolean;
  /** Optional additional className */
  className?: string;
}

/**
 * Action row with icon, title, subtitle, and optional right element
 */
export function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  disabled = false,
  destructive = false,
  className,
}: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center py-4 px-4 bg-white ${!disabled ? 'active:bg-surface-secondary' : ''} ${className || ""}`}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {icon && (
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: withOpacity(destructive ? colors.error : colors.primary[500], 0.1) }}
        >
          {icon}
        </View>
      )}
      <View className="flex-1">
        <Text
          variant="body"
          className="font-medium"
          style={{ color: destructive ? colors.error : colors.text.primary }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="muted" className="mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <Icon name="chevron-forward" color={destructive ? colors.error : colors.neutral[400]} size="sm" />
      )}
    </Pressable>
  );
}

/**
 * Simple action row without icon - for simpler menus
 */
export interface SimpleActionRowProps {
  /** Row title */
  title: string;
  /** Optional value to display */
  value?: string;
  /** Press handler */
  onPress: () => void;
  /** Whether this is a destructive action */
  destructive?: boolean;
}

export function SimpleActionRow({
  title,
  value,
  onPress,
  destructive,
}: SimpleActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-4 bg-white active:bg-surface-secondary"
    >
      <Text
        variant="body"
        style={{ color: destructive ? colors.error : colors.text.primary }}
      >
        {title}
      </Text>
      <View className="flex-row items-center">
        {value && (
          <Text variant="body" color="muted" className="mr-2">
            {value}
          </Text>
        )}
        <Icon
          name="chevron-forward"
          color={destructive ? colors.error : colors.neutral[400]}
          size="sm"
        />
      </View>
    </Pressable>
  );
}
