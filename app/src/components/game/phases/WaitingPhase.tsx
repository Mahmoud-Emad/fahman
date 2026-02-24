/**
 * WaitingPhase - Waiting for game to start
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors } from "@/themes";
import { LobbyView } from "@/components/lobby";
import type { Player, ChatMessage } from "../types";

interface WaitingPhaseProps {
  /** List of players */
  players: Player[];
  /** Chat messages */
  messages: ChatMessage[];
  /** Current user ID */
  currentUserId: string;
  /** Callback when sending a chat message */
  onSendMessage: (message: string) => void;
  /** Callback for player actions */
  onPlayerAction: (action: string, playerId: string) => void;
}

/**
 * Waiting phase component - shown when waiting for host to start
 */
export function WaitingPhase({
  players,
  messages,
  currentUserId,
  onSendMessage,
  onPlayerAction,
}: WaitingPhaseProps) {
  return (
    <View className="items-center py-8">
      <Icon name="ellipsis-horizontal" size="xl" color={colors.neutral[400]} />
      <Text variant="h3" className="font-bold mt-4">
        Waiting for host...
      </Text>
      <Text variant="body" color="secondary" className="mt-2">
        The game will start soon
      </Text>

      <View className="w-full mt-6">
        <LobbyView
          players={players}
          messages={messages}
          onSendMessage={onSendMessage}
          currentUserId={currentUserId}
          showChat={true}
          onPlayerAction={onPlayerAction}
        />
      </View>
    </View>
  );
}
