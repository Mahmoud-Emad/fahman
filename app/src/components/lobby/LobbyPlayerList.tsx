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
function PlayerCard({ player, isCurrentUser, isHostPlayer }: { player: Player; isCurrentUser: boolean; isHostPlayer: boolean }) {
  return (
    <View
      className="flex-row items-center p-3 rounded-xl mb-2"
      style={{
        backgroundColor: isCurrentUser ? withOpacity(colors.primary[500], 0.05) : colors.white,
        borderWidth: isCurrentUser ? 1.5 : 1,
        borderColor: isCurrentUser ? colors.primary[500] : colors.border,
      }}
    >
      <Avatar uri={player.avatar || undefined} initials={player.initials} size="sm" />
      <View className="flex-1 ml-3">
        <Text variant="body" className="font-medium">
          {player.name}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        {isHostPlayer && (
          <Badge variant="warning" size="sm">
            Host
          </Badge>
        )}
        {isCurrentUser && (
          <Badge variant="primary" size="sm">
            You
          </Badge>
        )}
      </View>
    </View>
  );
}

interface LobbyPlayerListProps {
  players: Player[];
  maxPlayers: number;
  isHost: boolean;
  canStart: boolean;
  minPlayersToStart: number;
  currentUserId: string;
  hostId: string;
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
  currentUserId,
  hostId,
  onInvite,
}: LobbyPlayerListProps) {
  // Sort: host first, current user second, others after
  const sortedPlayers = [...players].sort((a, b) => {
    const aIsHost = a.id === hostId;
    const bIsHost = b.id === hostId;
    const aIsYou = a.id === currentUserId;
    const bIsYou = b.id === currentUserId;

    if (aIsHost) return -1;
    if (bIsHost) return 1;
    if (aIsYou) return -1;
    if (bIsYou) return 1;
    return 0;
  });

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

      {sortedPlayers.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrentUser={player.id === currentUserId}
          isHostPlayer={player.id === hostId}
        />
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
