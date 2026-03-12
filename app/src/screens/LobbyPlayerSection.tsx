/**
 * LobbyPlayerSection - Player list card + invite button for the lobby
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, AvatarGroup, Badge } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface LobbyPlayerSectionProps {
  playerCount: number;
  minPlayers: number;
  canStart: boolean;
  avatarGroupData: { uri?: string; initials: string }[];
  onPlayersPress: () => void;
  onInvitePress: () => void;
}

export function LobbyPlayerSection({
  playerCount,
  minPlayers,
  canStart,
  avatarGroupData,
  onPlayersPress,
  onInvitePress,
}: LobbyPlayerSectionProps) {
  return (
    <>
      {/* Players Card */}
      <Pressable
        onPress={onPlayersPress}
        className="rounded-xl p-4 mb-3 active:opacity-90"
        style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Icon name="people" size="sm" color={colors.primary[500]} />
            <Text variant="body" className="font-semibold ml-2">
              Players
            </Text>
          </View>
          <Badge variant={canStart ? "success" : "warning"} size="sm">
            {playerCount}/{minPlayers} min
          </Badge>
        </View>

        <View className="flex-row items-center justify-between">
          {playerCount > 0 ? (
            <AvatarGroup
              avatars={avatarGroupData}
              max={6}
              size="sm"
            />
          ) : (
            <Text variant="caption" color="muted">
              Waiting for players to join...
            </Text>
          )}
          <View className="flex-row items-center">
            <Text variant="caption" color="secondary" className="mr-1">
              View all
            </Text>
            <Icon name="chevron-forward" customSize={14} color={colors.neutral[400]} />
          </View>
        </View>
      </Pressable>

      {/* Invite Button */}
      <Pressable
        onPress={onInvitePress}
        className="rounded-xl p-4 mb-3 flex-row items-center justify-center active:opacity-70"
        style={{
          backgroundColor: withOpacity(colors.primary[500], 0.08),
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: withOpacity(colors.primary[500], 0.3),
        }}
      >
        <Icon name="person-add" size="md" color={colors.primary[500]} />
        <Text
          variant="body"
          className="ml-2 font-medium"
          style={{ color: colors.primary[500] }}
        >
          Invite Players
        </Text>
      </Pressable>
    </>
  );
}
