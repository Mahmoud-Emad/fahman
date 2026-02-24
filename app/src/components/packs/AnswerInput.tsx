/**
 * AnswerInput - Input field with add button for adding answers
 */
import React, { useState } from "react";
import { View, TextInput, Pressable } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { PACK_LIMITS } from "@/constants";
import { AnswerChipList } from "./AnswerChip";

interface AnswerInputProps {
  /** Current answers list */
  answers: string[];
  /** Callback when answer is added */
  onAddAnswer: (answer: string) => void;
  /** Callback when answer is removed */
  onRemoveAnswer: (index: number) => void;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Answer input with add button and chip display
 */
export function AnswerInput({
  answers,
  onAddAnswer,
  onRemoveAnswer,
  error,
  disabled = false,
}: AnswerInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !answers.includes(trimmed)) {
      onAddAnswer(trimmed);
      setInputValue("");
    }
  };

  const handleSubmitEditing = () => {
    handleAdd();
  };

  const canAdd =
    inputValue.trim().length > 0 &&
    !answers.includes(inputValue.trim()) &&
    answers.length < PACK_LIMITS.MAX_ANSWERS_PER_QUESTION;

  return (
    <View>
      {/* Label */}
      <Text
        variant="label"
        className="mb-2 font-medium"
        style={{ color: error ? colors.error : colors.text.primary }}
      >
        Acceptable Answers *
      </Text>

      {/* Answer chips */}
      <AnswerChipList
        answers={answers}
        onRemoveAnswer={onRemoveAnswer}
        disabled={disabled}
      />

      {/* Input row */}
      {answers.length < PACK_LIMITS.MAX_ANSWERS_PER_QUESTION && (
        <View
          className="flex-row items-center rounded-lg overflow-hidden"
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.border,
          }}
        >
          <TextInput
            className="flex-1 px-4 py-3"
            style={{
              fontSize: 14,
              color: colors.text.primary,
            }}
            placeholder="Add an answer..."
            placeholderTextColor={colors.text.muted}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSubmitEditing}
            returnKeyType="done"
            maxLength={PACK_LIMITS.ANSWER_TEXT_MAX_LENGTH}
            editable={!disabled}
          />
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd || disabled}
            className="w-12 h-12 items-center justify-center active:opacity-70"
            style={{
              backgroundColor: canAdd
                ? colors.primary[500]
                : withOpacity(colors.neutral[400], 0.3),
            }}
          >
            <Icon
              name="add"
              size="md"
              color={canAdd ? colors.white : colors.neutral[400]}
            />
          </Pressable>
        </View>
      )}

      {/* Error message */}
      {error && (
        <Text variant="caption" style={{ color: colors.error }} className="mt-1">
          {error}
        </Text>
      )}

      {/* Helper text */}
      {!error && (
        <Text variant="caption" color="muted" className="mt-1">
          {answers.length}/{PACK_LIMITS.MAX_ANSWERS_PER_QUESTION} answers (min{" "}
          {PACK_LIMITS.MIN_ANSWERS_PER_QUESTION})
        </Text>
      )}
    </View>
  );
}
