/**
 * RoomCard - Card component for displaying room information
 */
import React from "react";
import { View, Pressable, Dimensions } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { RoomData, RoomUser } from "./types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

/**
 * Orange color palette for room cards - using theme colors
 */
const ORANGE_ACCENTS = [
  colors.primary[500], // #f97316
  colors.primary[600], // #ea580c
  colors.primary[400], // #fb923c
  colors.primary[700], // #c2410c
  colors.primary[300], // #fdba74
  colors.primary[800], // #9a3412
];

export const getAccentColor = (id: string) => {
  return ORANGE_ACCENTS[parseInt(id, 10) % ORANGE_ACCENTS.length];
};

/**
 * Get question status label
 */
export const getQuestionLabel = (room: RoomData): { label: string; color: string } => {
  if (room.status === "waiting") {
    return { label: "Waiting", color: colors.neutral[500] };
  }
  if (room.status === "finished" || room.currentQuestion >= room.questionsCount) {
    return { label: "Final", color: colors.error };
  }
  return { label: `Q ${room.currentQuestion}`, color: colors.primary[500] };
};

/**
 * Avatar stack component - shows overlapping avatars
 */
export function AvatarStack({
  users,
  totalUsers,
  maxShow = 3,
}: {
  users: RoomUser[];
  totalUsers: number;
  maxShow?: number;
}) {
  const visibleUsers = users.slice(0, maxShow);
  const remaining = totalUsers - visibleUsers.length;

  return (
    <View className="flex-row items-center">
      {visibleUsers.map((user, index) => (
        <View
          key={user.id}
          style={{
            marginLeft: index > 0 ? -8 : 0,
            zIndex: visibleUsers.length - index,
          }}
        >
          <Avatar source={user.avatar} initials={user.initials} size="xs" />
        </View>
      ))}
      {remaining > 0 && (
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: 20,
            height: 20,
            marginLeft: -6,
            backgroundColor: colors.neutral[200],
          }}
        >
          <Text
            className="font-semibold"
            style={{ color: colors.neutral[600], fontSize: 8 }}
          >
            +{remaining > 99 ? "99" : remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

interface RoomCardProps {
  room: RoomData;
  onPress?: () => void;
}

/**
 * Room card component - Clean design with full info
 */
export function RoomCard({ room, onPress }: RoomCardProps) {
  const isPrivate = room.type === "private";
  const accent = getAccentColor(room.id);
  const questionStatus = getQuestionLabel(room);

  const displayTitle =
    room.title.length > 20 ? room.title.slice(0, 20) + "..." : room.title;

  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl overflow-hidden active:scale-[0.98]"
      style={{
        width: CARD_WIDTH,
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: withOpacity(accent, 0.3),
        shadowColor: accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View className="p-3">
        {/* Header: Logo + Title */}
        <View className="flex-row items-center mb-2">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center"
            style={{ backgroundColor: withOpacity(accent, 0.12) }}
          >
            {room.logo ? (
              <Avatar source={room.logo} size="sm" borderRadius="rounded-lg" />
            ) : (
              <Text className="font-bold" style={{ color: accent, fontSize: 13 }}>
                {room.logoInitials}
              </Text>
            )}
          </View>

          <View className="flex-1 ml-2.5">
            <View className="flex-row items-center">
              <Text variant="body" className="font-semibold flex-1" style={{ fontSize: 13 }}>
                {displayTitle}
              </Text>
              {isPrivate && (
                <Icon
                  name="lock-closed"
                  customSize={12}
                  color={colors.neutral[400]}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>

        {/* Info row: Online (left) + Questions (right) */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: colors.success }}
            />
            <Text style={{ fontSize: 12, color: colors.neutral[600] }}>
              {room.totalUsers} online
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.neutral[500] }}>
            {room.questionsCount} Questions
          </Text>
        </View>

        {/* Bottom row: Avatars + Status */}
        <View className="flex-row items-center justify-between">
          <AvatarStack users={room.users} totalUsers={room.totalUsers} maxShow={4} />

          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: withOpacity(questionStatus.color, 0.12) }}
          >
            <Text
              style={{ fontSize: 11, color: questionStatus.color, fontWeight: "600" }}
            >
              {questionStatus.label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
