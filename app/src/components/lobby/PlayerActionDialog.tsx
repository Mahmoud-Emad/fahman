/**
 * PlayerActionDialog - Player action menu dialog
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Avatar, Modal, type IconName } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Player } from "./types";

/**
 * Player action menu options
 */
interface PlayerAction {
  id: string;
  label: string;
  icon: IconName;
  color?: string;
  visible: boolean;
}

/**
 * Get player actions based on player state
 */
function getPlayerActions(player: Player): PlayerAction[] {
  return [
    {
      id: "view_profile",
      label: "View Profile",
      icon: "person-outline" as const,
      visible: true,
    },
    {
      id: "add_friend",
      label: player.isFriend ? "Remove Friend" : "Add Friend",
      icon: "person-add-outline" as const,
      visible: true,
    },
    {
      id: "message",
      label: "Message",
      icon: "chatbubble-outline" as const,
      visible: !!player.isFriend,
    },
    {
      id: "mute",
      label: player.isMuted ? "Unmute" : "Mute",
      icon: "volume-mute-outline" as const,
      visible: true,
    },
    {
      id: "hit",
      label: "Hit",
      icon: "notifications-outline" as const,
      visible: true,
    },
    {
      id: "block",
      label: player.isBlocked ? "Unblock" : "Block",
      icon: "ban-outline" as const,
      color: colors.error,
      visible: true,
    },
  ];
}

interface PlayerActionDialogProps {
  player: Player | null;
  visible: boolean;
  onClose: () => void;
  onAction: (action: string, playerId: string) => void;
}

/**
 * Player action dialog - Pretty styled dialog for player actions
 */
export function PlayerActionDialog({
  player,
  visible,
  onClose,
  onAction,
}: PlayerActionDialogProps) {
  if (!visible || !player) return null;

  const actions = getPlayerActions(player);
  const statusColor =
    player.isCorrect === true
      ? colors.success
      : player.isCorrect === false
      ? colors.error
      : player.hasAnswered
      ? colors.primary[500]
      : colors.neutral[400];

  return (
    <Modal visible={visible} onClose={onClose} title="">
      <View className="items-center">
        {/* Player Avatar & Info */}
        <View className="relative mb-3">
          <View
            className="rounded-full p-1"
            style={{ borderWidth: 3, borderColor: statusColor }}
          >
            <Avatar source={player.avatar} initials={player.initials} size="xl" />
          </View>
          {player.isFriend && (
            <View
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full items-center justify-center"
              style={{
                backgroundColor: colors.primary[500],
                borderWidth: 2,
                borderColor: colors.white,
              }}
            >
              <Icon name="people" customSize={14} color={colors.white} />
            </View>
          )}
        </View>

        <Text variant="h3" className="font-bold mb-1">
          {player.name}
        </Text>
        <Text variant="body" style={{ color: colors.primary[600], fontWeight: "600" }}>
          {player.score} pts
        </Text>

        {/* Divider */}
        <View
          className="w-full my-4"
          style={{ height: 1, backgroundColor: colors.neutral[200] }}
        />

        {/* Action buttons */}
        <View className="w-full">
          {actions
            .filter((a) => a.visible)
            .map((action) => (
              <Pressable
                key={action.id}
                onPress={() => {
                  onAction(action.id, player.id);
                  onClose();
                }}
                className="flex-row items-center px-4 py-3.5 rounded-xl mb-2 active:opacity-80"
                style={{
                  backgroundColor: action.color
                    ? withOpacity(action.color, 0.08)
                    : colors.neutral[50],
                }}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: action.color
                      ? withOpacity(action.color, 0.15)
                      : withOpacity(colors.primary[500], 0.1),
                  }}
                >
                  <Icon
                    name={action.icon}
                    customSize={20}
                    color={action.color || colors.primary[500]}
                  />
                </View>
                <Text
                  variant="body"
                  className="font-medium"
                  style={{ color: action.color || colors.text.primary }}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
        </View>
      </View>
    </Modal>
  );
}
