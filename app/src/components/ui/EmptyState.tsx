/**
 * EmptyState - Reusable empty/no-results state component
 */
import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Pressable } from "./Pressable";
import { Icon } from "./Icon";
import { colors, withOpacity } from "@/themes";

export interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon: string;
  /** Main title text */
  title: string;
  /** Description text (optional) */
  description?: string;
  /** Action button configuration (optional) */
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Visual variant - 'default' for empty state, 'search' for no results */
  variant?: "default" | "search";
  /** Icon size */
  iconSize?: "md" | "lg" | "xl";
  /** Custom container class names */
  className?: string;
}

/**
 * EmptyState component - Display when list is empty or no search results
 *
 * @example
 * ```tsx
 * // Empty state
 * <EmptyState
 *   icon="chatbubbles"
 *   title="No conversations yet"
 *   description="Start a conversation by inviting friends"
 *   action={{ label: "Add Friends", onPress: handleAddFriend }}
 * />
 *
 * // No search results
 * <EmptyState
 *   icon="search"
 *   title="No results found"
 *   description="Try a different search term"
 *   variant="search"
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  iconSize = "xl",
  className = "",
}: EmptyStateProps) {
  const showIconContainer = variant === "default";

  return (
    <View className={`items-center justify-center py-16 ${className}`}>
      {showIconContainer ? (
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: withOpacity(colors.neutral[400], 0.1) }}
        >
          <Icon name={icon as any} size={iconSize} color={colors.neutral[400]} />
        </View>
      ) : (
        <Icon name={icon as any} size={iconSize} color={colors.neutral[400]} />
      )}

      <Text
        variant="body"
        color="muted"
        className={`font-medium ${!showIconContainer ? "mt-4" : ""}`}
      >
        {title}
      </Text>

      {description && (
        <Text variant="body-sm" color="muted" center className="mt-1 px-8">
          {description}
        </Text>
      )}

      {action && (
        <Pressable
          onPress={action.onPress}
          delayPressIn={0}
          className="mt-4 px-6 py-2.5 rounded-full active:opacity-70"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <Text
            variant="body-sm"
            className="font-medium"
            style={{ color: colors.white }}
          >
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
