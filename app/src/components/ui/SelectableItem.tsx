/**
 * SelectableItem - Reusable selectable list item with checkbox, avatar, and info
 *
 * Consolidates the UserCard pattern from UserSelectModal, FriendItem, etc.
 */
import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Icon } from "./Icon";
import { Avatar } from "./Avatar";
import { Badge, type BadgeVariant } from "./Badge";
import { Pressable } from "./Pressable";
import { colors, withOpacity } from "@/themes";

export interface SelectableItemProps {
  /** Whether the item is selected */
  selected?: boolean;
  /** Press handler */
  onPress: () => void;

  // --- Avatar ---
  /** Avatar image URI */
  avatar?: string;
  /** Initials to show when no avatar */
  initials: string;
  /** Show online/offline dot on avatar */
  showOnlineIndicator?: boolean;
  /** Whether the user is online */
  isOnline?: boolean;

  // --- Content ---
  /** Primary text (e.g. user name) */
  title: string;
  /** Secondary text (e.g. "Friend", username) */
  subtitle?: string;

  // --- Right side ---
  /** Badge to show on the right */
  badge?: {
    variant: BadgeVariant;
    label: string;
  };
  /** Custom right content (overrides badge) */
  rightContent?: React.ReactNode;

  // --- Selection ---
  /** Selection mode: 'multi' shows checkbox, 'none' hides it */
  selectionMode?: "multi" | "none";
}

/**
 * SelectableItem component
 *
 * @example
 * ```tsx
 * <SelectableItem
 *   selected={selectedIds.has(user.id)}
 *   onPress={() => toggleUser(user.id)}
 *   initials={user.initials}
 *   avatar={user.avatar}
 *   isOnline={user.isOnline}
 *   showOnlineIndicator
 *   title={user.name}
 *   subtitle="Friend"
 *   badge={{ variant: "success", label: "Online" }}
 *   selectionMode="multi"
 * />
 * ```
 */
export function SelectableItem({
  selected = false,
  onPress,
  avatar,
  initials,
  showOnlineIndicator = false,
  isOnline = false,
  title,
  subtitle,
  badge,
  rightContent,
  selectionMode = "multi",
}: SelectableItemProps) {
  const showCheckbox = selectionMode === "multi";

  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="flex-row items-center p-3 rounded-xl mb-2 active:opacity-70"
      style={{
        backgroundColor: selected
          ? withOpacity(colors.primary[500], 0.1)
          : colors.white,
        borderWidth: 1,
        borderColor: selected ? colors.primary[500] : colors.border,
      }}
    >
      {/* Checkbox */}
      {showCheckbox && (
        <View
          className="w-6 h-6 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: selected
              ? colors.primary[500]
              : colors.neutral[100],
            borderWidth: selected ? 0 : 1,
            borderColor: colors.neutral[300],
          }}
        >
          {selected && (
            <Icon name="checkmark" customSize={14} color={colors.white} />
          )}
        </View>
      )}

      {/* Avatar */}
      <View className="relative mr-3">
        <Avatar source={avatar} initials={initials} size="sm" />
        {showOnlineIndicator && isOnline && (
          <View
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
            style={{
              backgroundColor: colors.success,
              borderWidth: 2,
              borderColor: colors.white,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text variant="body" className="font-medium">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="muted">
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right side */}
      {rightContent ??
        (badge && (
          <Badge variant={badge.variant} size="sm">
            {badge.label}
          </Badge>
        ))}
    </Pressable>
  );
}
