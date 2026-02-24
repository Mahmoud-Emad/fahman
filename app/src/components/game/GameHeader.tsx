/**
 * GameHeader - Header for game room with question count and score
 */
import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface GameHeaderProps {
  /** Current question number */
  currentQuestion: number;
  /** Total number of questions */
  totalQuestions: number;
  /** Player's current score */
  playerScore: number;
  /** Callback when back button is pressed */
  onBackPress: () => void;
}

/**
 * Game header component with back button, question counter, and score
 */
export function GameHeader({
  currentQuestion,
  totalQuestions,
  playerScore,
  onBackPress,
}: GameHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-4 pb-3 flex-row items-center justify-between"
      style={{
        paddingTop: insets.top + 8,
        backgroundColor: colors.primary[500],
      }}
    >
      {/* Back Button */}
      <Pressable
        onPress={onBackPress}
        className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
        style={{ backgroundColor: withOpacity(colors.white, 0.2) }}
      >
        <Icon name="chevron-back" size="md" color={colors.white} />
      </Pressable>

      {/* Question Counter */}
      <Text variant="h3" className="font-bold" style={{ color: colors.white }}>
        Q {currentQuestion} / {totalQuestions}
      </Text>

      {/* Score Badge */}
      <View
        className="px-3 py-1.5 rounded-full"
        style={{ backgroundColor: withOpacity(colors.white, 0.2) }}
      >
        <Text variant="body" className="font-bold" style={{ color: colors.white }}>
          {playerScore} pts
        </Text>
      </View>
    </View>
  );
}
