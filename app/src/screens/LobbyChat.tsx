/**
 * LobbyChat - Chat card for the lobby showing last message preview and unread badge
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface LobbyChatProps {
  unreadCount: number;
  lastMessagePreview: string;
  onPress: () => void;
}

export function LobbyChat({ unreadCount, lastMessagePreview, onPress }: LobbyChatProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl p-4 mb-3 active:opacity-90"
      style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="relative">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
            >
              <Icon name="chatbubble-ellipses" size="md" color={colors.primary[500]} />
            </View>
            {unreadCount > 0 && (
              <View
                className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full items-center justify-center px-1"
                style={{ backgroundColor: colors.error }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: colors.white }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View className="ml-3">
            <Text variant="body" className="font-semibold">
              Room Chat
            </Text>
            <Text variant="caption" color="muted" numberOfLines={1}>
              {lastMessagePreview}
            </Text>
          </View>
        </View>
        <Icon name="chevron-forward" customSize={16} color={colors.neutral[400]} />
      </View>
    </Pressable>
  );
}
