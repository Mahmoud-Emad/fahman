/**
 * LobbyPhase - Waiting/results view after answering
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { LobbyView } from "@/components/lobby";
import { HostControls } from "../GameComponents";
import type { Player, ChatMessage } from "../types";

interface LobbyPhaseProps {
  /** Current question number */
  currentQuestion: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Current question text */
  questionText: string;
  /** Whether the player has submitted their answer */
  hasSubmitted: boolean;
  /** Player's submitted answer */
  answer: string;
  /** Player's bet amount */
  selectedBet: number | null;
  /** Whether current user is the host */
  isHost: boolean;
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
  /** Callback when host marks a player's answer */
  onMarkPlayer: (playerId: string, isCorrect: boolean) => void;
  /** Callback when host advances to next question */
  onNextQuestion: () => void;
}

/**
 * Lobby phase component - shown when waiting for results or host
 */
export function LobbyPhase({
  currentQuestion,
  totalQuestions,
  questionText,
  hasSubmitted,
  answer,
  selectedBet,
  isHost,
  players,
  messages,
  currentUserId,
  onSendMessage,
  onPlayerAction,
  onMarkPlayer,
  onNextQuestion,
}: LobbyPhaseProps) {
  const isLastQuestion = currentQuestion >= totalQuestions;

  return (
    <>
      {/* Question Summary Card */}
      <View
        className="rounded-2xl p-4 mb-4"
        style={{
          backgroundColor: withOpacity(colors.primary[500], 0.08),
          borderWidth: 1,
          borderColor: withOpacity(colors.primary[500], 0.2),
        }}
      >
        <Text variant="caption" color="secondary" className="mb-1">
          Question {currentQuestion}
        </Text>
        <Text variant="body" className="font-semibold">
          {questionText}
        </Text>
      </View>

      {/* Player's Submitted Answer */}
      {hasSubmitted && (
        <View
          className="rounded-xl p-3 mb-4 flex-row items-center"
          style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
        >
          <Icon name="checkmark" size="sm" color={colors.success} />
          <View className="ml-2 flex-1">
            <Text variant="caption" style={{ color: colors.success }}>
              Your answer: {answer}
            </Text>
            <Text variant="caption" color="secondary">
              Bet: {selectedBet} points
            </Text>
          </View>
        </View>
      )}

      {/* Host Controls or Lobby View */}
      {isHost ? (
        <HostControls
          players={players}
          onMarkPlayer={onMarkPlayer}
          onNextQuestion={onNextQuestion}
          isLastQuestion={isLastQuestion}
        />
      ) : (
        <LobbyView
          players={players}
          messages={messages}
          onSendMessage={onSendMessage}
          currentUserId={currentUserId}
          showChat={hasSubmitted}
          onPlayerAction={onPlayerAction}
        />
      )}
    </>
  );
}
