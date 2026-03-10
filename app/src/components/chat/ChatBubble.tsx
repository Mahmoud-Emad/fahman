/**
 * ChatBubble - Unified chat message bubble for both room chat and direct messages
 *
 * Consolidates lobby/ChatBubble (room chat) and messaging/DirectMessageBubble (DMs).
 */
import React, { memo } from "react";
import { View, Pressable, Alert } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { RoomInviteCard } from "./RoomInviteCard";
import type { RoomInviteData } from "@/components/messaging/types";

/**
 * System message variant for colored system messages
 */
export type SystemMessageVariant = "info" | "success" | "warning" | "error";

/**
 * Message delivery status (for DMs)
 */
export type ChatMessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export interface ChatBubbleProps {
  /** Whether this message was sent by the current user */
  isCurrentUser: boolean;

  // --- Content ---
  /** Message type */
  type: "text" | "system" | "room_invite";
  /** Message text content */
  text?: string;
  /** Room invite data (when type is "room_invite") */
  roomInvite?: RoomInviteData;

  // --- Sender (for non-current-user messages) ---
  /** Sender display name */
  senderName?: string;
  /** Sender initials for avatar */
  senderInitials?: string;
  /** Sender avatar URI */
  senderAvatar?: string;
  /** Whether to show the sender avatar (room chat style) */
  showAvatar?: boolean;
  /** Whether to show the sender name above the message */
  showSenderName?: boolean;

  // --- Meta ---
  /** Message timestamp */
  timestamp: Date;
  /** Whether to show the timestamp */
  showTimestamp?: boolean;

  // --- DM-specific ---
  /** Delivery status (DMs only) */
  status?: ChatMessageStatus;
  /** Whether message is read */
  isRead?: boolean;

  // --- System-specific ---
  /** System message visual variant */
  systemVariant?: SystemMessageVariant;

  // --- Interactions ---
  /** Callback when room invite join is pressed */
  onRoomInvitePress?: (invite: RoomInviteData) => void;
  /** Callback for deleting own messages (long press) */
  onDelete?: (messageId: string) => void;
  /** Message ID (needed for onDelete) */
  messageId?: string;

  // --- Style variant ---
  /** 'room' for room chat style (compact), 'dm' for DM style (with status) */
  variant?: "room" | "dm";
}

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${mins.toString().padStart(2, "0")} ${ampm}`;
}

function getStatusIcon(status?: ChatMessageStatus): string | null {
  switch (status) {
    case "sent":
      return "checkmark";
    case "delivered":
      return "checkmark-done";
    case "read":
      return "checkmark-done";
    case "failed":
      return "alert-circle";
    default:
      return null;
  }
}

/**
 * ChatBubble component - Unified message bubble for room chat and DMs
 */
export const ChatBubble = memo(function ChatBubble({
  isCurrentUser,
  type,
  text,
  roomInvite,
  senderName,
  senderInitials,
  senderAvatar,
  showAvatar = false,
  showSenderName = false,
  timestamp,
  showTimestamp = true,
  status,
  systemVariant = "info",
  onRoomInvitePress,
  onDelete,
  messageId,
  variant = "room",
}: ChatBubbleProps) {
  const isDm = variant === "dm";
  const statusIcon =
    isDm && isCurrentUser ? getStatusIcon(status) : null;

  // --- System message ---
  if (type === "system") {
    if (isDm) {
      return (
        <View className="items-center my-2">
          <View
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: withOpacity(colors.neutral[400], 0.1),
            }}
          >
            <Text variant="caption" color="muted">
              {text}
            </Text>
          </View>
        </View>
      );
    }

    const variantColors = {
      info: colors.neutral[400],
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };

    return (
      <View className="items-center my-2 px-4">
        <Text
          variant="caption"
          className="text-center"
          style={{ color: variantColors[systemVariant], fontSize: 12 }}
        >
          {text}
        </Text>
      </View>
    );
  }

  // --- Room invite message ---
  if (type === "room_invite" && roomInvite) {
    return (
      <View
        className={`my-1 ${isCurrentUser ? "items-end" : "items-start"}`}
        style={{ paddingHorizontal: 16 }}
      >
        <RoomInviteCard
          invite={roomInvite}
          onJoin={() => onRoomInvitePress?.(roomInvite)}
        />
        {showTimestamp && (
          <View className="flex-row items-center mt-1">
            <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
              {formatTime(timestamp)}
            </Text>
            {statusIcon && (
              <Icon
                name={statusIcon as any}
                customSize={12}
                color={
                  status === "read" ? colors.info : colors.neutral[400]
                }
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        )}
      </View>
    );
  }

  // --- Text message (DM style) ---
  if (isDm) {
    const handleLongPress = () => {
      if (!isCurrentUser || !onDelete || !messageId) return;
      Alert.alert(
        "Delete Message",
        "Are you sure you want to delete this message?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(messageId),
          },
        ]
      );
    };

    return (
      <View
        className={`my-1 ${isCurrentUser ? "items-end" : "items-start"}`}
        style={{ paddingHorizontal: 16 }}
      >
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={500}
          disabled={!isCurrentUser || !onDelete}
        >
          <View
            className="px-3.5 py-2.5 rounded-2xl"
            style={{
              backgroundColor: isCurrentUser
                ? colors.primary[500]
                : colors.neutral[100],
              maxWidth: "80%",
              borderBottomRightRadius: isCurrentUser ? 4 : 16,
              borderBottomLeftRadius: isCurrentUser ? 16 : 4,
            }}
          >
            <Text
              variant="body"
              style={{
                color: isCurrentUser ? colors.white : colors.text.primary,
              }}
            >
              {text}
            </Text>
          </View>
        </Pressable>

        {showTimestamp && (
          <View className="flex-row items-center mt-1">
            <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
              {formatTime(timestamp)}
            </Text>
            {statusIcon && (
              <Icon
                name={statusIcon as any}
                customSize={12}
                color={
                  status === "read" ? colors.info : colors.neutral[400]
                }
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        )}
      </View>
    );
  }

  // --- Text message (Room chat style) ---
  return (
    <View
      className={`flex-row mb-2.5 ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      {showAvatar && !isCurrentUser && (
        <Avatar
          uri={senderAvatar}
          initials={senderInitials || "?"}
          size="xs"
          style={{ marginTop: 4 }}
        />
      )}
      <View
        className={`rounded-2xl px-3.5 py-2.5 max-w-[75%] ${isCurrentUser ? "mr-1" : "ml-2"}`}
        style={{
          backgroundColor: isCurrentUser
            ? colors.primary[500]
            : colors.neutral[100],
        }}
      >
        {showSenderName && !isCurrentUser && senderName && (
          <Text
            variant="caption"
            className="font-semibold mb-0.5"
            style={{ color: colors.primary[600] }}
          >
            {senderName}
          </Text>
        )}
        <Text
          variant="body-sm"
          style={{
            color: isCurrentUser ? colors.white : colors.text.primary,
          }}
        >
          {text}
        </Text>
        {showTimestamp && (
          <Text
            variant="caption"
            className="mt-0.5"
            style={{
              color: isCurrentUser
                ? withOpacity(colors.white, 0.6)
                : colors.text.muted,
              fontSize: 10,
              alignSelf: isCurrentUser ? "flex-end" : "flex-start",
            }}
          >
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
});
