/**
 * AnsweringPhase - Multiple-choice question UI with timer and bet selection
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { TimerDisplay, BetCard } from "../GameComponents";

interface AnsweringPhaseProps {
  /** Time remaining in seconds */
  timeLeft: number;
  /** Current question text */
  questionText: string;
  /** Multiple-choice options from server */
  options: string[];
  /** Index of currently selected option (null if none) */
  selectedAnswer: number | null;
  /** Callback when an option is selected */
  onSelectOption: (index: number) => void;
  /** Whether answer has been submitted */
  hasSubmitted: boolean;
  /** Currently selected bet value */
  selectedBet: number | null;
  /** Callback when bet is selected */
  onBetSelect: (bet: number) => void;
  /** Array of available bet values */
  betCards: number[];
  /** Array of already used bet values */
  usedBets: number[];
  /** Number of players who have answered */
  playersAnsweredCount: number;
  /** Total players in the game */
  totalPlayers: number;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Answering phase component - shows multiple-choice options instead of free text
 */
export function AnsweringPhase({
  timeLeft,
  questionText,
  options,
  selectedAnswer,
  onSelectOption,
  hasSubmitted,
  selectedBet,
  onBetSelect,
  betCards,
  usedBets,
  playersAnsweredCount,
  totalPlayers,
}: AnsweringPhaseProps) {
  return (
    <>
      {/* Timer */}
      <TimerDisplay timeLeft={timeLeft} />

      {/* Question Card */}
      <View
        className="rounded-2xl p-5 mb-6"
        style={{
          backgroundColor: colors.neutral[50],
          borderWidth: 1,
          borderColor: colors.neutral[200],
        }}
      >
        <Text variant="h2" className="font-bold text-center">
          {questionText}
        </Text>
      </View>

      {/* Multiple Choice Options */}
      {hasSubmitted ? (
        <View className="mb-6 items-center py-6">
          <Icon name="checkmark-circle" size="xl" color={colors.success} />
          <Text variant="h3" className="font-bold mt-3" style={{ color: colors.success }}>
            Answer Submitted!
          </Text>
          <Text variant="body" color="secondary" className="mt-2">
            Waiting for other players... ({playersAnsweredCount}/{totalPlayers})
          </Text>
        </View>
      ) : (
        <View className="mb-6">
          <Text variant="body" className="font-semibold mb-3">
            Choose your answer
          </Text>
          {options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            return (
              <Pressable
                key={index}
                onPress={() => onSelectOption(index)}
                delayPressIn={0}
                className="rounded-xl mb-3 p-4 flex-row items-center active:scale-[0.98]"
                style={{
                  backgroundColor: isSelected
                    ? withOpacity(colors.primary[500], 0.1)
                    : colors.neutral[50],
                  borderWidth: 2,
                  borderColor: isSelected
                    ? colors.primary[500]
                    : colors.neutral[200],
                }}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: isSelected
                      ? colors.primary[500]
                      : colors.neutral[200],
                  }}
                >
                  <Text
                    variant="body"
                    className="font-bold"
                    style={{
                      color: isSelected ? colors.white : colors.text.primary,
                    }}
                  >
                    {OPTION_LETTERS[index] ?? String(index + 1)}
                  </Text>
                </View>
                <Text
                  variant="body"
                  className="flex-1 font-medium"
                  style={{
                    color: isSelected ? colors.primary[500] : colors.text.primary,
                  }}
                >
                  {option}
                </Text>
                {isSelected && (
                  <Icon name="checkmark-circle" size="md" color={colors.primary[500]} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Bet Selection — only show before submission */}
      {!hasSubmitted && (
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="body" className="font-semibold">
              How sure are you?
            </Text>
            <Text variant="caption" color="secondary">
              {selectedBet ? `±${selectedBet} points` : "Select a number"}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {betCards.map((value) => (
              <BetCard
                key={value}
                value={value}
                isSelected={selectedBet === value}
                isDisabled={usedBets.includes(value)}
                onPress={() => onBetSelect(value)}
              />
            ))}
          </View>

          <Text variant="caption" color="muted" className="mt-2">
            Each number can only be used once per game
          </Text>
        </View>
      )}
    </>
  );
}
