/**
 * AnsweringPhase - Free-text answer input with timer and bet selection.
 * Players type their answer; the host corrects answers manually.
 */
import React from "react";
import { View } from "react-native";
import { Text, Icon, Input } from "@/components/ui";
import { colors } from "@/themes";
import { TimerDisplay, BetCard } from "../GameComponents";

interface AnsweringPhaseProps {
  /** Time remaining in seconds */
  timeLeft: number;
  /** Current question text */
  questionText: string;
  /** Current typed answer text */
  answerText: string;
  /** Callback when the user types an answer */
  onChangeAnswer: (text: string) => void;
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
  /** Pack hint text displayed under the question */
  textHint?: string | null;
}

/**
 * Answering phase component - shows a text input for free-text answers.
 * Answer options are never displayed; the host grades answers after submission.
 */
export function AnsweringPhase({
  timeLeft,
  questionText,
  answerText,
  onChangeAnswer,
  hasSubmitted,
  selectedBet,
  onBetSelect,
  betCards,
  usedBets,
  playersAnsweredCount,
  totalPlayers,
  textHint,
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
        {textHint ? (
          <View className="mt-3 flex-row items-center justify-center">
            <Icon name="bulb-outline" customSize={14} color={colors.primary[500]} />
            <Text
              variant="body-sm"
              className="ml-1.5 text-center"
              style={{ color: colors.primary[500] }}
            >
              {textHint}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Answer Input */}
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
            Type your answer
          </Text>
          <Input
            variant="filled"
            placeholder="Enter your answer..."
            value={answerText}
            onChangeText={onChangeAnswer}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
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
