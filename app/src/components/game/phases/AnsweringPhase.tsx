/**
 * AnsweringPhase - Question answering UI with timer and bet selection
 */
import React from "react";
import { View, TextInput } from "react-native";
import { Text, Input } from "@/components/ui";
import { colors } from "@/themes";
import { TimerDisplay, BetCard } from "../GameComponents";

interface AnsweringPhaseProps {
  /** Time remaining in seconds */
  timeLeft: number;
  /** Current question text */
  questionText: string;
  /** Player's current answer */
  answer: string;
  /** Callback when answer changes */
  onAnswerChange: (answer: string) => void;
  /** Currently selected bet value */
  selectedBet: number | null;
  /** Callback when bet is selected */
  onBetSelect: (bet: number) => void;
  /** Array of available bet values */
  betCards: number[];
  /** Array of already used bet values */
  usedBets: number[];
}

/**
 * Answering phase component - shown when player is answering a question
 */
export function AnsweringPhase({
  timeLeft,
  questionText,
  answer,
  onAnswerChange,
  selectedBet,
  onBetSelect,
  betCards,
  usedBets,
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

      {/* Answer Input */}
      <View className="mb-6">
        <Text variant="body" className="font-semibold mb-2">
          Your Answer
        </Text>
        <TextInput
          value={answer}
          onChangeText={onAnswerChange}
          placeholder="Type your answer..."
          placeholderTextColor={colors.neutral[400]}
          className="rounded-xl px-4 py-3.5"
          style={{
            backgroundColor: colors.neutral[50],
            borderWidth: 1,
            borderColor: colors.neutral[200],
            fontSize: 16,
            color: colors.text.primary,
          }}
        />
      </View>

      {/* Bet Selection */}
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
    </>
  );
}
