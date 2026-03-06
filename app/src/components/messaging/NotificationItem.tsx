/**
 * NotificationItem - Single notification row component
 * Clean, minimal design matching app style
 */
import React, { useState } from "react";
import { View, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Text, Icon, Avatar, Pressable } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Notification, NotificationAction } from "./types";
import { formatMessageTime } from "./types";

/** Blue used for friend_request notification accent — no direct theme equivalent */
const FRIEND_REQUEST_COLOR = "#3B82F6";

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onAction?: (action: NotificationAction) => void;
  onDelete?: (notificationId: string) => void;
}

/**
 * Get icon for notification type (when no sender)
 */
function getNotificationIcon(type: Notification["type"]): string {
  switch (type) {
    case "room_invite":
      return "game-controller";
    case "friend_request":
      return "person-add";
    case "friend_accepted":
      return "people";
    case "system":
      return "notifications";
    default:
      return "notifications";
  }
}

/**
 * Get accent color for notification type
 */
function getNotificationColor(type: Notification["type"]): string {
  switch (type) {
    case "room_invite":
      return colors.primary[500];
    case "friend_request":
      return FRIEND_REQUEST_COLOR;
    case "friend_accepted":
      return colors.success;
    case "system":
      return colors.neutral[500];
    default:
      return colors.neutral[500];
  }
}

/**
 * Render right swipe action (delete)
 */
function renderRightActions(
  progress: Animated.AnimatedInterpolation<number>,
  _dragX: Animated.AnimatedInterpolation<number>,
  onDelete: () => void
) {
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [72, 0],
  });

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={onDelete}
        delayPressIn={0}
        className="w-[72px] h-full items-center justify-center"
        style={{ backgroundColor: colors.error }}
      >
        <Icon name="trash" size="sm" color={colors.white} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Status label shown after an action has been taken
 */
function ActionTakenLabel({ action }: { action: string }) {
  const labelMap: Record<string, { text: string; color: string; icon: string }> = {
    accepted: { text: "Accepted", color: colors.success, icon: "checkmark-circle" },
    declined: { text: "Declined", color: colors.neutral[400], icon: "close-circle" },
    joined: { text: "Joined", color: colors.primary[500], icon: "enter" },
  };

  const info = labelMap[action] || { text: action, color: colors.neutral[400], icon: "ellipse" };

  return (
    <View className="mt-2 flex-row items-center gap-1">
      <Icon name={info.icon as any} customSize={14} color={info.color} />
      <Text
        variant="caption"
        className="font-medium"
        style={{ color: info.color, fontSize: 12 }}
      >
        {info.text}
      </Text>
    </View>
  );
}

/**
 * NotificationItem component
 */
export function NotificationItem({
  notification,
  onPress,
  onAction,
  onDelete,
}: NotificationItemProps) {
  const { type, title, message, timestamp, isRead, sender } = notification;
  const iconName = getNotificationIcon(type);
  const accentColor = getNotificationColor(type);
  const [avatarError, setAvatarError] = useState(false);

  // Determine if we have a valid avatar to show
  const hasAvatar = !!sender?.avatar && !avatarError;

  const handleDelete = () => {
    onDelete?.(notification.id);
  };

  const content = (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="flex-row items-start px-4 py-3"
      style={({ pressed }) => ({
        backgroundColor: pressed
          ? colors.neutral[50]
          : isRead
            ? "transparent"
            : withOpacity(accentColor, 0.04),
      })}
    >
      {/* Avatar or Icon */}
      <View className="relative">
        {hasAvatar ? (
          <Avatar
            uri={sender!.avatar}
            initials={sender!.initials}
            size="md"
            onError={() => setAvatarError(true)}
          />
        ) : sender ? (
          <Avatar initials={sender.initials} size="md" />
        ) : (
          <View
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: withOpacity(accentColor, 0.1) }}
          >
            <Icon name={iconName as any} size="md" color={accentColor} />
          </View>
        )}
        {/* Unread indicator dot */}
        {!isRead && (
          <View
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: accentColor,
              borderColor: colors.white,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        {/* Header row: title + time */}
        <View className="flex-row items-center justify-between">
          <Text
            variant="body"
            className={isRead ? "font-medium" : "font-semibold"}
            numberOfLines={1}
            style={{ flex: 1, color: colors.text.primary }}
          >
            {title}
          </Text>
          <Text
            variant="caption"
            className="ml-2"
            style={{ color: colors.neutral[400], fontSize: 12 }}
          >
            {formatMessageTime(timestamp)}
          </Text>
        </View>

        {/* Message */}
        <Text
          variant="body-sm"
          numberOfLines={2}
          className="mt-0.5"
          style={{ color: colors.neutral[500], lineHeight: 18 }}
        >
          {message}
        </Text>

        {/* Action Buttons - Friend Request (only when no action taken) */}
        {!notification.actionTaken && type === "friend_request" && onAction && (
          <View className="mt-3 flex-row items-center gap-2">
            <Pressable
              onPress={() => onAction("decline")}
              delayPressIn={0}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <Icon name="close" size="sm" color={colors.neutral[500]} />
            </Pressable>
            <Pressable
              onPress={() => onAction("accept")}
              delayPressIn={0}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary[500] }}
            >
              <Icon name="checkmark" size="sm" color={colors.white} />
            </Pressable>
          </View>
        )}

        {/* Action Button - Room Invite (only when no action taken) */}
        {!notification.actionTaken && type === "room_invite" && onAction && (
          <View className="mt-3">
            <Pressable
              onPress={() => onAction("join")}
              delayPressIn={0}
              className="self-start px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.primary[500] }}
            >
              <Text
                variant="body-sm"
                className="font-semibold"
                style={{ color: colors.white }}
              >
                Join Game
              </Text>
            </Pressable>
          </View>
        )}

        {/* Action taken status label */}
        {notification.actionTaken && (
          <ActionTakenLabel action={notification.actionTaken} />
        )}
      </View>
    </Pressable>
  );

  // If onDelete is provided, wrap in Swipeable
  if (onDelete) {
    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, handleDelete)
        }
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        {content}
      </Swipeable>
    );
  }

  return content;
}
