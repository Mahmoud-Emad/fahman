/**
 * FriendItem - Single friend row in friends list
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Friend } from "./types";

interface FriendItemProps {
  friend: Friend;
  onPress: () => void;
  onMessage?: () => void;
  onInvite?: () => void;
}

/**
 * Get status color and text
 */
function getStatusInfo(status: Friend["status"]) {
  switch (status) {
    case "online":
      return { color: colors.success, text: "Online" };
    case "in_game":
      return { color: colors.primary[500], text: "In Game" };
    case "offline":
      return { color: colors.neutral[400], text: "Offline" };
  }
}

/**
 * Format last seen time
 */
function formatLastSeen(date?: Date): string {
  if (!date) return "";
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * FriendItem component
 */
export function FriendItem({ friend, onPress, onMessage, onInvite }: FriendItemProps) {
  const statusInfo = getStatusInfo(friend.status);
  const showLastSeen = friend.status === "offline" && friend.lastSeen;

  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="flex-row items-center px-4 py-3"
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.neutral[50] : "transparent",
      })}
    >
      {/* Avatar with status indicator */}
      <View className="relative">
        <Avatar source={friend.avatar} initials={friend.initials} size="md" />
        <View
          className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
          style={{
            backgroundColor: statusInfo.color,
            borderColor: colors.white,
          }}
        />
      </View>

      {/* Friend info */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text variant="body" className="font-semibold" numberOfLines={1}>
            {friend.name}
          </Text>
          {friend.status === "in_game" && (
            <View
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
            >
              <Text
                variant="caption"
                style={{ color: colors.primary[500], fontSize: 10 }}
              >
                Playing
              </Text>
            </View>
          )}
        </View>
        <Text variant="caption" style={{ color: colors.neutral[500] }} numberOfLines={1}>
          {friend.status === "in_game" && friend.currentGame
            ? friend.currentGame
            : showLastSeen
              ? `Last seen ${formatLastSeen(friend.lastSeen)}`
              : friend.username}
        </Text>
      </View>

      {/* Action buttons */}
      <View className="flex-row items-center gap-1">
        {onMessage && (
          <Pressable
            onPress={onMessage}
            delayPressIn={0}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.neutral[100] : "transparent",
            })}
          >
            <Icon name="chatbubble-outline" size="sm" color={colors.neutral[500]} />
          </Pressable>
        )}
        {onInvite && friend.status !== "in_game" && (
          <Pressable
            onPress={onInvite}
            delayPressIn={0}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={({ pressed }) => ({
              backgroundColor: pressed
                ? withOpacity(colors.primary[500], 0.15)
                : withOpacity(colors.primary[500], 0.1),
            })}
          >
            <Icon name="game-controller-outline" size="sm" color={colors.primary[500]} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Friend Request Item
 */
interface FriendRequestItemProps {
  request: {
    id: string;
    from: {
      id: string;
      name: string;
      username: string;
      initials: string;
      avatar?: string;
    };
    timestamp: Date;
  };
  isSent?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onViewProfile?: (userId: string) => void;
}

export function FriendRequestItem({
  request,
  isSent = false,
  onAccept,
  onDecline,
  onCancel,
  onViewProfile,
}: FriendRequestItemProps) {
  const handlePress = () => {
    onViewProfile?.(request.from.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 active:bg-neutral-50"
      delayPressIn={0}
    >
      <Avatar source={request.from.avatar} initials={request.from.initials} size="md" />
      <View className="flex-1 ml-3">
        <Text variant="body" className="font-semibold" numberOfLines={1}>
          {request.from.name}
        </Text>
        <Text variant="caption" style={{ color: colors.neutral[500] }}>
          {isSent ? "Request sent" : request.from.username}
        </Text>
      </View>
      {isSent ? (
        // Sent request - show cancel button
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onCancel?.();
          }}
          delayPressIn={0}
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: colors.neutral[100] }}
        >
          <Text variant="body-sm" style={{ color: colors.neutral[600] }}>
            Cancel
          </Text>
        </Pressable>
      ) : (
        // Received request - show accept/decline buttons
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDecline?.();
            }}
            delayPressIn={0}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.neutral[100] }}
          >
            <Icon name="close" size="sm" color={colors.neutral[500]} />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onAccept?.();
            }}
            delayPressIn={0}
            className="w-9 h-9 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Icon name="checkmark" size="sm" color={colors.white} />
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}
