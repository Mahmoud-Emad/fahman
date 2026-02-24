/**
 * AnswerChip - Removable answer tag for question answers
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface AnswerChipProps {
  /** Answer text */
  answer: string;
  /** Callback when remove button is pressed */
  onRemove: () => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Removable answer chip component
 */
export function AnswerChip({ answer, onRemove, disabled = false }: AnswerChipProps) {
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-1.5 mr-2 mb-2"
      style={{
        backgroundColor: withOpacity(colors.primary[500], 0.1),
        borderWidth: 1,
        borderColor: withOpacity(colors.primary[500], 0.2),
      }}
    >
      <Text
        variant="body-sm"
        className="mr-2"
        style={{ color: colors.primary[700] }}
        numberOfLines={1}
      >
        {answer}
      </Text>
      {!disabled && (
        <Pressable
          onPress={onRemove}
          className="w-5 h-5 rounded-full items-center justify-center active:opacity-70"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.2) }}
        >
          <Icon name="close" customSize={12} color={colors.primary[700]} />
        </Pressable>
      )}
    </View>
  );
}

interface AnswerChipListProps {
  /** List of answers */
  answers: string[];
  /** Callback when an answer is removed */
  onRemoveAnswer: (index: number) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * List of answer chips
 */
export function AnswerChipList({
  answers,
  onRemoveAnswer,
  disabled = false,
}: AnswerChipListProps) {
  if (answers.length === 0) return null;

  return (
    <View className="flex-row flex-wrap">
      {answers.map((answer, index) => (
        <AnswerChip
          key={`${answer}-${index}`}
          answer={answer}
          onRemove={() => onRemoveAnswer(index)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}
