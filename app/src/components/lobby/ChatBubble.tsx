/**
 * ChatBubble - Chat message bubble component
 */
import React from "react";
import { View } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { colors } from "@/themes";
import type { ChatMessage } from "./types";

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

/**
 * Chat message bubble
 */
export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  // System messages - styled based on variant
  if (message.type === "system") {
    const variantColors = {
      info: colors.neutral[400],
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
    };
    const textColor = variantColors[message.systemVariant || "info"];

    return (
      <View className="items-center my-3 px-4">
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
    <View className={`flex-row mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      {!isOwn && <Avatar source={message.senderAvatar} initials={message.senderInitials} size="xs" />}
      <View
        className={`rounded-2xl px-3 py-2 max-w-[75%] ${isOwn ? "mr-1" : "ml-2"}`}
        style={{ backgroundColor: isOwn ? colors.primary[500] : colors.neutral[100] }}
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
      </View>
    </View>
  );
}
