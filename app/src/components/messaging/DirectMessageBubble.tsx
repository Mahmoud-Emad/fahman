/**
 * DirectMessageBubble - Message bubble for direct messages
 */
import React from "react";
import { View, Pressable, Alert } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { RoomInviteCard } from "./RoomInviteCard";
import type { DirectMessage, RoomInviteData } from "./types";

interface DirectMessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  onJoinRoom?: (invite: RoomInviteData) => void;
  onDelete?: (messageId: string) => void;
  showTimestamp?: boolean;
}

/**
 * Format time for message
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Get status icon for message
 */
function getStatusIcon(status: DirectMessage["status"]): string | null {
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
 * DirectMessageBubble component
 */
export function DirectMessageBubble({
  message,
  isOwn,
  onJoinRoom,
  onDelete,
  showTimestamp = true,
}: DirectMessageBubbleProps) {
  const { type, text, roomInvite, timestamp, status } = message;
  const statusIcon = isOwn ? getStatusIcon(status) : null;

  // Handle long press to delete (only for own messages)
  const handleLongPress = () => {
    if (!isOwn || !onDelete) return;

    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(message.id),
        },
      ]
    );
  };

  // System message
  if (type === "system") {
    return (
      <View className="items-center my-2">
        <View
          className="px-3 py-1.5 rounded-full"
          style={{ backgroundColor: withOpacity(colors.neutral[400], 0.1) }}
        >
          <Text variant="caption" color="muted">
            {text}
          </Text>
        </View>
      </View>
    );
  }

  // Room invite message
  if (type === "room_invite" && roomInvite) {
    return (
      <View
        className={`my-1 ${isOwn ? "items-end" : "items-start"}`}
        style={{ paddingHorizontal: 16 }}
      >
        <RoomInviteCard
          invite={roomInvite}
          isOwn={isOwn}
          onJoin={() => onJoinRoom?.(roomInvite)}
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
                color={status === "read" ? colors.info : colors.neutral[400]}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        )}
      </View>
    );
  }

  // Text message
  return (
    <View
      className={`my-1 ${isOwn ? "items-end" : "items-start"}`}
      style={{ paddingHorizontal: 16 }}
    >
      <Pressable
        onLongPress={handleLongPress}
        delayLongPress={500}
        disabled={!isOwn || !onDelete}
      >
        <View
          className="px-3.5 py-2.5 rounded-2xl"
          style={{
            backgroundColor: isOwn ? colors.primary[500] : colors.neutral[100],
            maxWidth: "80%",
            borderBottomRightRadius: isOwn ? 4 : 16,
            borderBottomLeftRadius: isOwn ? 16 : 4,
          }}
        >
          <Text
            variant="body"
            style={{
              color: isOwn ? colors.white : colors.text.primary,
            }}
          >
            {text}
          </Text>
        </View>
      </Pressable>

      {/* Timestamp and status */}
      {showTimestamp && (
        <View className="flex-row items-center mt-1">
          <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
            {formatTime(timestamp)}
          </Text>
          {statusIcon && (
            <Icon
              name={statusIcon as any}
              customSize={12}
              color={status === "read" ? colors.info : colors.neutral[400]}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      )}
    </View>
  );
}
