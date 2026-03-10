/**
 * PlayersModal - Modal showing all players in the lobby
 */
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Avatar, Badge, Modal } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Player } from "@/components/lobby/types";
import { PlayerActionDialog } from "@/components/lobby/PlayerActionDialog";

/**
 * Single player row inside the modal
 */
function PlayerListItem({
  player,
  isCurrentUser,
  isHostPlayer,
  onPress,
}: {
  player: Player;
  isCurrentUser: boolean;
  isHostPlayer: boolean;
  onPress: (player: Player) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(player)}
      className="flex-row items-center py-3 px-1 active:bg-neutral-50"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[100],
        backgroundColor: isCurrentUser ? withOpacity(colors.primary[500], 0.04) : undefined,
      }}
    >
      <Avatar source={player.avatar} initials={player.initials} size="sm" />

      <View className="flex-1 ml-3">
        <Text variant="body" className="font-medium" numberOfLines={1}>
          {player.name}
        </Text>
        <Text variant="caption" color="secondary">
          {player.score} pts
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
    </Pressable>
  );
}

interface PlayersModalProps {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  currentUserId: string;
  hostId: string;
  onPlayerAction: (action: string, playerId: string) => void;
  onInvite: () => void;
}

/**
 * Players modal - shows all players in the lobby with host/you labels
 */
export function PlayersModal({
  visible,
  onClose,
  players,
  currentUserId,
  hostId,
  onPlayerAction,
  onInvite,
}: PlayersModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handlePlayerPress = (player: Player) => {
    if (player.id !== currentUserId) {
      setSelectedPlayer(player);
    }
  };

  const handleAction = (action: string, playerId: string) => {
    onPlayerAction(action, playerId);
    setSelectedPlayer(null);
  };

  // Sort: host first, current user second, others after
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === hostId) return -1;
    if (b.id === hostId) return 1;
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return 0;
  });

  return (
    <>
      <Modal visible={visible} onClose={onClose} title={`Players (${players.length})`}>
        {sortedPlayers.map((player) => (
          <PlayerListItem
            key={player.id}
            player={player}
            isCurrentUser={player.id === currentUserId}
            isHostPlayer={player.id === hostId}
            onPress={handlePlayerPress}
          />
        ))}

        {/* Invite button */}
        <Pressable
          onPress={onInvite}
          className="flex-row items-center justify-center py-4 mt-2 rounded-xl active:opacity-70"
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
      </Modal>

      <PlayerActionDialog
        player={selectedPlayer}
        visible={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onAction={handleAction}
      />
    </>
  );
}
