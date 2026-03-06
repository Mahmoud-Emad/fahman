/**
 * RoomDetailsDialog - Modal showing full room info before joining
 */
import React, { useState, useEffect } from "react";
import { View, Pressable, ActivityIndicator } from "react-native";
import { Text, Icon, Avatar, Modal } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { RoomData } from "./types";
import { AvatarStack, getAccentColor, getQuestionLabel } from "./RoomCard";

interface RoomDetailsDialogProps {
  room: RoomData | null;
  visible: boolean;
  onClose: () => void;
  onJoin: () => void;
}

/**
 * Room Details Dialog - shows full room info before joining
 */
export function RoomDetailsDialog({
  room,
  visible,
  onClose,
  onJoin,
}: RoomDetailsDialogProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsReady(false);
      const timer = setTimeout(() => setIsReady(true), 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible || !room) return null;

  const isPrivate = room.type === "private";
  const accent = getAccentColor(room.id);
  const questionStatus = getQuestionLabel(room);

  return (
    <Modal visible={visible} onClose={onClose} title="">
      <View>
        {/* Header Section */}
        <View className="flex-row items-start mb-4">
          <View
            className="w-14 h-14 rounded-xl items-center justify-center"
            style={{ backgroundColor: withOpacity(accent, 0.15) }}
          >
            {room.logo ? (
              <Avatar source={room.logo} size="md" borderRadius="rounded-lg" />
            ) : (
              <Text className="font-bold" style={{ color: accent, fontSize: 18 }}>
                {room.logoInitials}
              </Text>
            )}
          </View>

          <View className="flex-1 ml-3">
            <Text variant="h3" className="font-bold" style={{ lineHeight: 24 }}>
              {room.title}
            </Text>
            <View className="flex-row items-center mt-1 gap-2">
              {/* Privacy Badge */}
              <View
                className="px-2 py-0.5 rounded-full flex-row items-center"
                style={{
                  backgroundColor: isPrivate
                    ? withOpacity(colors.warning, 0.1)
                    : withOpacity(colors.success, 0.1),
                }}
              >
                <Icon
                  name={isPrivate ? "lock-closed" : "globe"}
                  customSize={10}
                  color={isPrivate ? colors.warning : colors.success}
                />
                <Text
                  style={{
                    fontSize: 10,
                    color: isPrivate ? colors.warning : colors.success,
                    marginLeft: 3,
                    fontWeight: "500",
                  }}
                >
                  {isPrivate ? "Private" : "Public"}
                </Text>
              </View>
              {/* Status Badge */}
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: withOpacity(questionStatus.color, 0.1) }}
              >
                <Text
                  style={{ fontSize: 10, color: questionStatus.color, fontWeight: "500" }}
                >
                  {room.status === "waiting"
                    ? "Waiting"
                    : room.status === "playing"
                    ? "Live"
                    : "Ended"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {room.description && (
          <View
            className="rounded-xl p-3 mb-4"
            style={{ backgroundColor: colors.neutral[50] }}
          >
            <Text style={{ fontSize: 13, color: colors.neutral[600], lineHeight: 20 }}>
              {room.description}
            </Text>
          </View>
        )}

        {/* Stats Row */}
        <View className="flex-row mb-4 gap-2">
          <View
            className="flex-1 rounded-xl p-3"
            style={{ backgroundColor: colors.neutral[50] }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: colors.success }}
                />
                <Text style={{ fontSize: 12, color: colors.neutral[500] }}>Online</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text.primary }}>
                {room.totalUsers}
              </Text>
            </View>
          </View>

          <View
            className="flex-1 rounded-xl p-3"
            style={{ backgroundColor: colors.neutral[50] }}
          >
            <View className="flex-row items-center justify-between">
              <Text style={{ fontSize: 12, color: colors.neutral[500] }}>Questions</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text.primary }}>
                {room.questionsCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress (if playing) */}
        {room.status === "playing" && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text style={{ fontSize: 12, color: colors.neutral[500] }}>Progress</Text>
              <Text
                style={{ fontSize: 12, color: colors.primary[500], fontWeight: "600" }}
              >
                {room.currentQuestion} / {room.questionsCount}
              </Text>
            </View>
            <View
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  backgroundColor: colors.primary[500],
                  width: `${(room.currentQuestion / room.questionsCount) * 100}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Players */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <AvatarStack users={room.users} totalUsers={room.totalUsers} maxShow={4} />
            {room.totalUsers > 4 && (
              <Text
                style={{ fontSize: 11, color: colors.neutral[400], marginLeft: 6 }}
              >
                +{room.totalUsers - 4}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 11, color: colors.neutral[400] }}>
            {room.totalUsers} {room.totalUsers === 1 ? "player" : "players"}
          </Text>
        </View>

        {/* Join Button */}
        <Pressable
          onPress={isReady ? onJoin : undefined}
          disabled={!isReady}
          className="w-full rounded-xl py-4 items-center flex-row justify-center"
          style={{
            backgroundColor: isReady ? colors.primary[500] : colors.neutral[200],
          }}
        >
          {!isReady ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Icon name="play" size="sm" color={colors.white} style={{ marginRight: 8 }} />
              <Text variant="body" className="font-bold" style={{ color: colors.white }}>
                Join Room
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}
