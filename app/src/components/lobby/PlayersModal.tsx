/**
 * PlayersModal - Modal showing all players in the lobby
 */
import React, { useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { Text, Icon, Avatar, Modal } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Player } from "./types";
import { PlayerActionDialog } from "./PlayerActionDialog";

/**
 * Simple player list item for modal
 */
function PlayerListItem({
  player,
  onPress,
}: {
  player: Player;
  onPress: (player: Player) => void;
}) {
  const statusColor =
    player.isCorrect === true
      ? colors.success
      : player.isCorrect === false
      ? colors.error
      : player.hasAnswered
      ? colors.primary[500]
      : colors.neutral[400];

  return (
    <Pressable
      onPress={() => onPress(player)}
      className="flex-row items-center py-3 px-1 active:bg-neutral-50"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}
    >
      {/* Avatar with indicators */}
      <View className="relative">
        <Avatar source={player.avatar} initials={player.initials} size="sm" />
        {player.isFriend && (
          <View
            className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary[500], borderWidth: 1.5, borderColor: colors.white }}
          >
            <Icon name="people" customSize={8} color={colors.white} />
          </View>
        )}
        {player.isMuted && (
          <View
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.neutral[500], borderWidth: 1.5, borderColor: colors.white }}
          >
            <Icon name="volume-mute" customSize={8} color={colors.white} />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1 ml-3">
        <Text variant="body" className="font-medium" numberOfLines={1}>
          {player.name}
        </Text>
        <Text variant="caption" color="secondary">
          {player.score} pts
        </Text>
      </View>

      {/* Status */}
      <View
        className="w-7 h-7 rounded-full items-center justify-center"
        style={{ backgroundColor: withOpacity(statusColor, 0.12) }}
      >
        {player.isCorrect === true ? (
          <Icon name="checkmark" customSize={14} color={colors.success} />
        ) : player.isCorrect === false ? (
          <Icon name="close" customSize={14} color={colors.error} />
        ) : player.hasAnswered ? (
          <Icon name="checkmark" customSize={12} color={colors.primary[500]} />
        ) : (
          <Icon name="ellipsis-horizontal" customSize={12} color={colors.neutral[400]} />
        )}
      </View>
    </Pressable>
  );
}

interface PlayersModalProps {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  onPlayerAction: (action: string, playerId: string) => void;
}

/**
 * Players modal - shows all players in the lobby
 */
export function PlayersModal({
  visible,
  onClose,
  players,
  onPlayerAction,
}: PlayersModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const handlePlayerPress = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleAction = (action: string, playerId: string) => {
    onPlayerAction(action, playerId);
    setSelectedPlayer(null);
  };

  return (
    <>
      <Modal visible={visible} onClose={onClose} title={`All Players (${players.length})`}>
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {players.map((player) => (
            <PlayerListItem key={player.id} player={player} onPress={handlePlayerPress} />
          ))}
        </ScrollView>
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
