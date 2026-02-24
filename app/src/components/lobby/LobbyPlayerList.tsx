/**
 * LobbyPlayerList - Player list display for RoomLobbyScreen
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Avatar, Badge } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Player } from "./types";

/**
 * Single player card in the lobby
 */
function PlayerCard({ player, isHost }: { player: Player; isHost: boolean }) {
  return (
    <View
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Avatar uri={player.avatar || undefined} initials={player.initials} size="sm" />
      <View className="flex-1 ml-3">
        <Text variant="body" className="font-medium">
          {player.name}
        </Text>
      </View>
      {isHost && player.id === "host" && (
        <Badge variant="primary" size="sm">
          Host
        </Badge>
      )}
    </View>
  );
}

interface LobbyPlayerListProps {
  players: Player[];
  maxPlayers: number;
  isHost: boolean;
  canStart: boolean;
  minPlayersToStart: number;
  onInvite: () => void;
}

/**
 * Full player list section with invite button
 */
export function LobbyPlayerList({
  players,
  maxPlayers,
  isHost,
  canStart,
  minPlayersToStart,
  onInvite,
}: LobbyPlayerListProps) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text variant="body" className="font-semibold">
          Players
        </Text>
        <Badge variant={canStart ? "success" : "warning"} size="sm">
          {players.length}/{minPlayersToStart} min
        </Badge>
      </View>

      {players.map((player) => (
        <PlayerCard key={player.id} player={player} isHost={isHost} />
      ))}

      <Pressable
        onPress={onInvite}
        className="flex-row items-center justify-center p-4 rounded-xl mt-2 active:opacity-70"
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
    </View>
  );
}
