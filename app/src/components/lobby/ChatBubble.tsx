/**
 * ChatBubble - Memoized chat message bubble for lobby chat
 */
import React, { memo } from "react";
import { View } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { ChatMessage } from "./types";

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

/**
 * Chat message bubble — memoized to avoid re-renders in FlatList
 */
export const ChatBubble = memo(function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  if (message.type === "system") {
    const variantColors = {
      info: colors.neutral[400],
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };
    const textColor = variantColors[message.systemVariant || "info"];

    return (
      <View className="items-center my-2 px-4">
        <Text
          variant="caption"
          className="text-center"
          style={{ color: textColor, fontSize: 12 }}
        >
          {message.message}
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-row mb-2.5 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && (
        <Avatar
          uri={message.senderAvatar}
          initials={message.senderInitials}
          size="xs"
          style={{ marginTop: 4 }}
        />
      )}
      <View
        className={`rounded-2xl px-3.5 py-2.5 max-w-[75%] ${isOwn ? "mr-1" : "ml-2"}`}
        style={{
          backgroundColor: isOwn ? colors.primary[500] : colors.neutral[100],
        }}
      >
        {!isOwn && (
          <Text
            variant="caption"
            className="font-semibold mb-0.5"
            style={{ color: colors.primary[600] }}
          >
            {message.senderName}
          </Text>
        )}
        <Text
          variant="body-sm"
          style={{ color: isOwn ? colors.white : colors.text.primary }}
        >
          {message.message}
        </Text>
        <Text
          variant="caption"
          className="mt-0.5"
          style={{
            color: isOwn
              ? withOpacity(colors.white, 0.6)
              : colors.text.muted,
            fontSize: 10,
            alignSelf: isOwn ? "flex-end" : "flex-start",
          }}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
});

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${h}:${mins.toString().padStart(2, "0")} ${ampm}`;
}
