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
  isOwn: boolean;
}

/**
 * RoomInviteCard component
 */
export function RoomInviteCard({ invite, onJoin, isOwn }: RoomInviteCardProps) {
  const { packName, roomCode, isActive, currentPlayers, maxPlayers } = invite;

  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: isOwn
          ? withOpacity(colors.white, 0.2)
          : colors.white,
        borderWidth: isOwn ? 0 : 1,
        borderColor: colors.border,
        maxWidth: 260,
      }}
    >
      {/* Header */}
      <View
        className="flex-row items-center px-3 py-2"
        style={{
          backgroundColor: isOwn
            ? withOpacity(colors.white, 0.1)
            : withOpacity(colors.primary[500], 0.1),
        }}
      >
        <Icon
          name="game-controller"
          size="sm"
          color={isOwn ? colors.white : colors.primary[500]}
        />
        <Text
          variant="caption"
          className="ml-2 font-semibold"
          style={{ color: isOwn ? colors.white : colors.primary[500] }}
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
          style={{ color: isOwn ? colors.white : colors.text.primary }}
        >
          {packName}
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Text
              variant="caption"
              style={{ color: isOwn ? withOpacity(colors.white, 0.8) : colors.text.muted }}
            >
              Code:{" "}
            </Text>
            <Text
              variant="caption"
              className="font-bold tracking-wider"
              style={{ color: isOwn ? colors.white : colors.primary[500] }}
            >
              {roomCode}
            </Text>
          </View>

          <View className="flex-row items-center">
            <Icon
              name="people"
              customSize={12}
              color={isOwn ? withOpacity(colors.white, 0.8) : colors.neutral[500]}
            />
            <Text
              variant="caption"
              className="ml-1"
              style={{ color: isOwn ? withOpacity(colors.white, 0.8) : colors.text.muted }}
            >
              {currentPlayers}/{maxPlayers}
            </Text>
          </View>
        </View>

        {/* Join Button */}
        {isActive ? (
          <Button
            variant={isOwn ? "outline" : "primary"}
            size="sm"
            fullWidth
            onPress={onJoin}
            style={isOwn ? { borderColor: colors.white } : undefined}
          >
            <Text
              variant="body-sm"
              className="font-semibold"
              style={{ color: isOwn ? colors.white : colors.white }}
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
              style={{ color: isOwn ? withOpacity(colors.white, 0.6) : colors.neutral[500] }}
            >
              Room no longer available
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
