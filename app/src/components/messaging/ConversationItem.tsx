/**
 * ConversationItem - Single conversation row component
 */
import React, { memo } from "react";
import { View } from "react-native";
import { Text, Avatar, Pressable } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Conversation } from "./types";
import { formatMessageTime } from "./types";
import { useAuth } from "@/contexts";

interface ConversationItemProps {
  conversation: Conversation;
  onPress: () => void;
}

/**
 * ConversationItem component
 */
export const ConversationItem = memo(function ConversationItem({
  conversation,
  onPress,
}: ConversationItemProps) {
  const { user } = useAuth();
  const { participants, lastMessage, unreadCount } = conversation;
  const participant = participants[0]; // For 1:1 chats
  const isOnline = participant?.isOnline;
  const isOwnMessage = lastMessage.senderId === user?.id;

  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="flex-row items-center px-4 py-3 active:opacity-70"
      style={{
        backgroundColor: unreadCount > 0 ? withOpacity(colors.primary[500], 0.05) : colors.white,
      }}
    >
      {/* Avatar with online indicator */}
      <View className="relative">
        <Avatar
          source={participant?.avatar}
          initials={participant?.initials || "??"}
          size="md"
        />
        {isOnline && (
          <View
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: colors.success,
              borderColor: colors.white,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text
            variant="body"
            className={unreadCount > 0 ? "font-bold" : "font-semibold"}
            numberOfLines={1}
          >
            {participant?.name || "Unknown"}
          </Text>
          <Text
            variant="caption"
            style={{
              color: unreadCount > 0 ? colors.primary[500] : colors.text.muted,
            }}
          >
            {formatMessageTime(lastMessage.timestamp)}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-0.5">
          <Text
            variant="body-sm"
            color={unreadCount > 0 ? "primary" : "muted"}
            numberOfLines={1}
            className="flex-1 pr-2"
            style={{ fontWeight: unreadCount > 0 ? "500" : "400" }}
          >
            {isOwnMessage ? "You: " : ""}
            {lastMessage.text}
          </Text>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <View
              className="min-w-5 h-5 rounded-full items-center justify-center px-1.5"
              style={{ backgroundColor: colors.primary[500] }}
            >
              <Text
                variant="caption"
                style={{ color: colors.white, fontSize: 11, fontWeight: "600" }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});
