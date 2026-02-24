/**
 * Icon component - Wrapper for Expo vector icons
 * Provides consistent icon styling across the app
 */
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors } from "@/themes";

/**
 * Available icon names (subset of Ionicons)
 */
export type IconName =
  | "home"
  | "home-outline"
  | "settings"
  | "settings-outline"
  | "help-circle"
  | "help-circle-outline"
  | "create"
  | "create-outline"
  | "storefront"
  | "storefront-outline"
  | "people"
  | "people-outline"
  | "person"
  | "person-outline"
  | "person-circle"
  | "person-circle-outline"
  | "flash"
  | "flash-outline"
  | "chevron-back"
  | "chevron-forward"
  | "chevron-down"
  | "chevron-up"
  | "close"
  | "add"
  | "add-circle"
  | "add-circle-outline"
  | "albums"
  | "albums-outline"
  | "remove"
  | "checkmark"
  | "search"
  | "notifications"
  | "notifications-outline"
  | "volume-high"
  | "volume-high-outline"
  | "volume-mute"
  | "volume-mute-outline"
  | "shield"
  | "shield-outline"
  | "eye"
  | "eye-outline"
  | "eye-off"
  | "eye-off-outline"
  | "globe"
  | "globe-outline"
  | "diamond"
  | "diamond-outline"
  | "share-social"
  | "share-social-outline"
  | "mail"
  | "mail-outline"
  | "log-in"
  | "log-in-outline"
  | "chatbubble"
  | "chatbubble-outline"
  | "game-controller"
  | "game-controller-outline"
  | "musical-notes"
  | "musical-notes-outline"
  | "musical-note"
  | "musical-note-outline"
  | "megaphone"
  | "megaphone-outline"
  | "language"
  | "language-outline"
  | "ellipsis-horizontal"
  | "ellipsis-vertical"
  | "call"
  | "call-outline"
  | "card"
  | "card-outline"
  | "cart"
  | "cart-outline"
  | "lock-closed"
  | "lock-closed-outline"
  | "logo-google"
  | "logo-facebook"
  | "wallet"
  | "wallet-outline"
  | "play"
  | "play-outline"
  | "pause"
  | "pause-outline"
  | "person-add"
  | "person-add-outline"
  | "ban"
  | "ban-outline"
  | "information-circle"
  | "information-circle-outline"
  | "checkmark-circle"
  | "checkmark-circle-outline"
  | "warning"
  | "warning-outline"
  | "alert-circle"
  | "alert-circle-outline"
  | "log-out"
  | "log-out-outline"
  | "chatbubbles"
  | "chatbubbles-outline"
  | "copy"
  | "copy-outline"
  | "close-circle"
  | "close-circle-outline"
  | "send"
  | "send-outline"
  | "trophy"
  | "trophy-outline"
  | "flame"
  | "flame-outline"
  | "trending-up"
  | "trending-up-outline"
  | "school"
  | "school-outline"
  | "medal"
  | "medal-outline"
  | "arrow-back"
  | "arrow-back-outline"
  | "keypad"
  | "keypad-outline"
  | "gift"
  | "gift-outline"
  | "folder"
  | "folder-outline"
  | "images"
  | "images-outline"
  | "download"
  | "download-outline"
  | "refresh"
  | "refresh-outline"
  | "trash"
  | "trash-outline"
  | "time"
  | "time-outline"
  | "calendar"
  | "calendar-outline"
  | "key"
  | "key-outline"
  | "play-circle"
  | "play-circle-outline"
  | "star"
  | "star-outline"
  | "heart"
  | "heart-outline"
  | "bookmark"
  | "bookmark-outline"
  | "list"
  | "list-outline"
  | "options"
  | "options-outline"
  | "filter"
  | "filter-outline"
  | "arrow-up"
  | "arrow-up-outline"
  | "arrow-down"
  | "arrow-down-outline"
  | "arrow-forward"
  | "arrow-forward-outline";

/**
 * Icon size options
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the Icon component
 */
export interface IconProps {
  /** Icon name from Ionicons */
  name: IconName;
  /** Icon size */
  size?: IconSize;
  /** Custom size in pixels (overrides size prop) */
  customSize?: number;
  /** Icon color */
  color?: string;
  /** Additional style */
  style?: ComponentProps<typeof Ionicons>["style"];
}

/**
 * Size to pixels mapping
 */
const sizeMap: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
};

/**
 * Icon component using Ionicons
 */
export function Icon({
  name,
  size = "md",
  customSize,
  color = colors.text.primary,
  style,
}: IconProps) {
  const iconSize = customSize ?? sizeMap[size];

  return (
    <Ionicons
      name={name}
      size={iconSize}
      color={color}
      style={style}
    />
  );
}
