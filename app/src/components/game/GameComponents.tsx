/**
 * Game UI components - Timer, BetCard, HostControls
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { Player } from "./types";

/**
 * Large timer display component
 */
export function TimerDisplay({ timeLeft }: { timeLeft: number }) {
  const timerColor = timeLeft <= 5 ? colors.error : timeLeft <= 10 ? colors.warning : colors.primary[500];

  return (
    <View className="items-center mb-6">
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: 100,
          height: 100,
          backgroundColor: withOpacity(timerColor, 0.1),
          borderWidth: 4,
          borderColor: timerColor,
        }}
      >
        <Text
          variant="h1"
          className="font-bold"
          style={{ color: timerColor, fontSize: 40 }}
        >
          {timeLeft}
        </Text>
      </View>
      <Text variant="caption" color="secondary" className="mt-2">
        seconds remaining
      </Text>
    </View>
  );
}

/**
 * Confidence bet card component
 */
interface BetCardProps {
  value: number;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
}

export function BetCard({ value, isSelected, isDisabled, onPress }: BetCardProps) {
  const backgroundColor = isDisabled
    ? colors.neutral[100]
    : isSelected
    ? colors.primary[500]
    : colors.white;
  const textColor = isDisabled
    ? colors.neutral[400]
    : isSelected
    ? colors.white
    : colors.text.primary;
  const borderColor = isDisabled
    ? colors.neutral[200]
    : isSelected
    ? colors.primary[500]
    : colors.neutral[300];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="items-center justify-center rounded-xl active:scale-95"
      style={{
        width: 48,
        height: 48,
        backgroundColor,
        borderWidth: 1.5,
        borderColor,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      <Text variant="body" className="font-bold" style={{ color: textColor }}>
        {value}
      </Text>
    </Pressable>
  );
}

/**
 * Host controls for marking answers
 */
interface HostControlsProps {
  players: Player[];
  onMarkPlayer: (playerId: string, isCorrect: boolean) => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export function HostControls({
  players,
  onMarkPlayer,
  onNextQuestion,
  isLastQuestion,
}: HostControlsProps) {
  const allMarked = players.every((p) => !p.hasAnswered || p.isCorrect !== undefined);

  return (
    <View className="flex-1">
      <Text variant="body" className="font-semibold mb-3">
        Mark Answers
      </Text>
      {players.map((player) => (
        <View
          key={player.id}
          className="flex-row items-center p-3 rounded-xl mb-2"
          style={{
            backgroundColor:
              player.isCorrect === true
                ? withOpacity(colors.success, 0.08)
                : player.isCorrect === false
                ? withOpacity(colors.error, 0.08)
                : colors.neutral[50],
            borderWidth: 1,
            borderColor: colors.neutral[200],
          }}
        >
          <Avatar source={player.avatar} initials={player.initials} size="sm" />
          <View className="flex-1 ml-3">
            <Text variant="body" className="font-semibold">
              {player.name}
            </Text>
            <Text variant="caption" color="secondary">
              {player.hasAnswered ? player.answer : "No answer yet"}
            </Text>
          </View>

          {player.hasAnswered && player.isCorrect === undefined ? (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => onMarkPlayer(player.id, true)}
                className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
                style={{ backgroundColor: withOpacity(colors.success, 0.15) }}
              >
                <Icon name="checkmark" customSize={20} color={colors.success} />
              </Pressable>
              <Pressable
                onPress={() => onMarkPlayer(player.id, false)}
                className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
                style={{ backgroundColor: withOpacity(colors.error, 0.15) }}
              >
                <Icon name="close" customSize={20} color={colors.error} />
              </Pressable>
            </View>
          ) : player.isCorrect !== undefined ? (
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: player.isCorrect
                  ? withOpacity(colors.success, 0.15)
                  : withOpacity(colors.error, 0.15),
              }}
            >
              <Icon
                name={player.isCorrect ? "checkmark" : "close"}
                customSize={20}
                color={player.isCorrect ? colors.success : colors.error}
              />
            </View>
          ) : (
            <Text variant="caption" color="muted">
              Waiting...
            </Text>
          )}
        </View>
      ))}

      {allMarked && (
        <Pressable
          onPress={onNextQuestion}
          className="mt-4 rounded-xl py-4 items-center active:opacity-90"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <Text variant="body" className="font-bold" style={{ color: colors.white }}>
            {isLastQuestion ? "End Game" : "Next Question"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
