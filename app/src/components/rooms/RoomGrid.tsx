/**
 * RoomGrid - Grid display for rooms with loading and empty states
 */
import React from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors } from "@/themes";
import { RoomCard } from "./RoomCard";
import { SkeletonCard } from "./SkeletonCard";
import type { RoomData } from "./types";

interface RoomGridProps {
  /** Rooms to display */
  rooms: RoomData[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Callback when a room is pressed */
  onRoomPress: (room: RoomData) => void;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Room grid component with loading and empty states
 */
export function RoomGrid({
  rooms,
  isLoading,
  skeletonCount = 6,
  onRoomPress,
  emptyMessage = "No rooms match your filters",
}: RoomGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <View className="flex-row flex-wrap justify-between">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <View key={`skeleton-${i}`} className="mb-4">
            <SkeletonCard />
          </View>
        ))}
      </View>
    );
  }

  // Empty state
  if (rooms.length === 0) {
    return (
      <View className="flex-1 items-center py-8">
        <Icon name="search" size="xl" color={colors.neutral[300]} />
        <Text variant="body" color="muted" className="mt-2">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  // Room grid
  return (
    <View className="flex-row flex-wrap justify-between">
      {rooms.map((room) => (
        <View key={room.id} className="mb-4">
          <RoomCard room={room} onPress={() => onRoomPress(room)} />
        </View>
      ))}
    </View>
  );
}

interface RoomSectionProps {
  /** Section title */
  title: string;
  /** Rooms to display */
  rooms: RoomData[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Callback when a room is pressed */
  onRoomPress: (room: RoomData) => void;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Right side action element */
  rightAction?: React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * Room section with title and grid
 */
export function RoomSection({
  title,
  rooms,
  isLoading,
  onRoomPress,
  skeletonCount = 6,
  rightAction,
  emptyMessage,
}: RoomSectionProps) {
  return (
    <View className="mb-6">
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text variant="h3" className="font-bold">
          {title}
        </Text>
        {rightAction}
      </View>

      {/* Room grid */}
      <RoomGrid
        rooms={rooms}
        isLoading={isLoading}
        skeletonCount={skeletonCount}
        onRoomPress={onRoomPress}
        emptyMessage={emptyMessage}
      />
    </View>
  );
}

interface LoadingIndicatorProps {
  /** Whether to show the indicator */
  visible: boolean;
}

/**
 * Loading indicator for infinite scroll
 */
export function LoadingIndicator({ visible }: LoadingIndicatorProps) {
  if (!visible) return null;

  return (
    <View className="py-4 items-center">
      <ActivityIndicator size="small" color={colors.primary[500]} />
    </View>
  );
}

interface JoinByIdButtonProps {
  onPress: () => void;
}

/**
 * Join by ID button for room sections
 */
export function JoinByIdButton({ onPress }: JoinByIdButtonProps) {
  return (
    <Pressable className="active:opacity-70" onPress={onPress}>
      <View className="flex-row items-center">
        <Icon name="log-in" customSize={18} color={colors.primary[500]} />
        <Text
          variant="body-sm"
          className="font-medium ml-1"
          style={{ color: colors.primary[500] }}
        >
          Join by ID
        </Text>
      </View>
    </Pressable>
  );
}
