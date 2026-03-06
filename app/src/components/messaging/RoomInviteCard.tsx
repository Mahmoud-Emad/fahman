/**
 * RoomInviteCard - Room invite card embedded in chat messages
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { RoomInviteData } from "./types";

interface RoomInviteCardProps {
  invite: RoomInviteData;
  onJoin: () => void;
}

function getDisabledText(expiredReason?: RoomInviteData["expiredReason"]): string {
  switch (expiredReason) {
    case "deleted":
      return "Room no longer exists";
    case "full":
      return "Room is full";
    case "in_progress":
      return "Game already started";
    case "finished":
      return "Game has ended";
    case "closed":
      return "Room has been closed";
    default:
      return "Room no longer available";
  }
}

/**
 * RoomInviteCard component
 */
export function RoomInviteCard({ invite, onJoin }: RoomInviteCardProps) {
  const { packName, roomCode, isActive, currentPlayers, maxPlayers, expiredReason } = invite;

  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        maxWidth: 260,
      }}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-3 py-2"
        style={{
          backgroundColor: withOpacity(colors.primary[500], 0.1),
        }}
      >
        <Icon
          name="game-controller"
          size="sm"
          color={colors.primary[500]}
        />
        <Text
          variant="caption"
          className="ml-2 font-semibold"
          style={{ color: colors.primary[500] }}
        >
          Room Invite
        </Text>
      </View>

      {/* Content */}
      <View className="px-3 py-3">
        <Text
          variant="body"
          className="font-semibold mb-1"
          numberOfLines={1}
          style={{ color: colors.text.primary }}
        >
          {packName}
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text
              variant="caption"
              style={{ color: colors.text.muted }}
            >
              Code:{" "}
            </Text>
            <Text
              variant="caption"
              className="font-bold tracking-wider"
              style={{ color: colors.primary[500] }}
            >
              {roomCode}
            </Text>
          </View>

          {expiredReason !== "deleted" && (
            <View className="flex-row items-center">
              <Icon
                name="people"
                customSize={12}
                color={colors.neutral[500]}
              />
              <Text
                variant="caption"
                className="ml-1"
                style={{ color: colors.text.muted }}
              >
                {currentPlayers}/{maxPlayers}
              </Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        {isActive ? (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onPress={onJoin}
          >
            <Text
              variant="body-sm"
              className="font-semibold"
              style={{ color: colors.white }}
            >
              Join Game
            </Text>
          </Button>
        ) : (
          <View
            className="py-2 px-3 rounded-lg items-center"
            style={{ backgroundColor: withOpacity(colors.neutral[400], 0.2) }}
          >
            <Text
              variant="caption"
              style={{ color: colors.neutral[500] }}
            >
              {getDisabledText(expiredReason)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
