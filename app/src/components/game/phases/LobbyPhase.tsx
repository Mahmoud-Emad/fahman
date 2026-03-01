/**
 * LobbyPhase - Auto-graded question results view
 * Shows correct answer, each player's result, and "Next Question" for host.
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Button, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { PlayerResult } from "../types";

interface LobbyPhaseProps {
  /** Current question number */
  currentQuestion: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Current question text */
  questionText: string;
  /** Options that were displayed for this question */
  options: string[];
  /** Correct answer indices from server */
  correctAnswer: number[] | null;
  /** Per-player results from server grading */
  questionResults: PlayerResult[] | null;
  /** Whether current user is the host */
  isHost: boolean;
  /** Callback when host advances to next question */
  onNextQuestion: () => void;
  /** Current user ID to highlight own result */
  currentUserId: string;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * Lobby phase component - shows auto-graded results after each question
 */
export function LobbyPhase({
  currentQuestion,
  totalQuestions,
  questionText,
  options,
  correctAnswer,
  questionResults,
  isHost,
  onNextQuestion,
  currentUserId,
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
          Question {currentQuestion} of {totalQuestions}
        </Text>
        <Text variant="body" className="font-semibold">
          {questionText}
        </Text>
      </View>

      {/* Options with correct answer highlighted */}
      <View className="mb-4">
        <Text variant="body" className="font-semibold mb-2">
          Correct Answer
        </Text>
        {options.map((option, index) => {
          const isCorrect = correctAnswer?.includes(index) ?? false;
          return (
            <View
              key={index}
              className="rounded-xl mb-2 p-3 flex-row items-center"
              style={{
                backgroundColor: isCorrect
                  ? withOpacity(colors.success, 0.1)
                  : colors.neutral[50],
                borderWidth: 1.5,
                borderColor: isCorrect ? colors.success : colors.neutral[200],
              }}
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor: isCorrect ? colors.success : colors.neutral[200],
                }}
              >
                <Text
                  variant="body-sm"
                  className="font-bold"
                  style={{ color: isCorrect ? colors.white : colors.text.primary }}
                >
                  {OPTION_LETTERS[index] ?? String(index + 1)}
                </Text>
              </View>
              <Text
                variant="body"
                className="flex-1 font-medium"
                style={{ color: isCorrect ? colors.success : colors.text.secondary }}
              >
                {option}
              </Text>
              {isCorrect && (
                <Icon name="checkmark-circle" size="md" color={colors.success} />
              )}
            </View>
          );
        })}
      </View>

      {/* Player Results */}
      {questionResults && questionResults.length > 0 && (
        <View className="mb-4">
          <Text variant="body" className="font-semibold mb-2">
            Player Results
          </Text>
          {questionResults.map((result) => {
            const isMe = result.playerId === currentUserId;
            return (
              <View
                key={result.playerId}
                className="rounded-xl mb-2 p-3 flex-row items-center"
                style={{
                  backgroundColor: isMe
                    ? withOpacity(colors.primary[500], 0.06)
                    : colors.neutral[50],
                  borderWidth: 1,
                  borderColor: isMe ? colors.primary[500] : colors.neutral[200],
                }}
              >
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: result.isCorrect
                      ? withOpacity(colors.success, 0.15)
                      : withOpacity(colors.error, 0.15),
                  }}
                >
                  <Icon
                    name={result.isCorrect ? "checkmark" : "close"}
                    customSize={18}
                    color={result.isCorrect ? colors.success : colors.error}
                  />
                </View>
                <View className="flex-1">
                  <Text variant="body" className="font-semibold">
                    {isMe ? "You" : result.username}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {result.isCorrect ? "+" : ""}{result.pointsEarned} points
                  </Text>
                </View>
                <Text
                  variant="body"
                  className="font-bold"
                  style={{ color: colors.primary[500] }}
                >
                  {result.newScore}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Next Question / End Game button (host only) */}
      {isHost ? (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={onNextQuestion}
        >
          {isLastQuestion ? "End Game" : "Next Question"}
        </Button>
      ) : (
        <View
          className="flex-row items-center justify-center p-4 rounded-xl"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Icon name="ellipsis-horizontal" size="sm" color={colors.primary[500]} />
          <Text variant="body" className="font-medium ml-2" style={{ color: colors.primary[500] }}>
            Waiting for host to continue...
          </Text>
        </View>
      )}
    </>
  );
}
