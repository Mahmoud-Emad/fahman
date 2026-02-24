/**
 * QuestionPanel - Expandable panel for editing a question
 * Features: Accordion behavior, reorder arrows, question editing
 */
import React, { useRef, useEffect } from "react";
import { View, Pressable, Animated, Image } from "react-native";
import { Text, Icon, Input, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { PACK_LIMITS } from "@/constants";
import { AnswerInput } from "./AnswerInput";
import type { QuestionFormData, QuestionError } from "./types";

interface QuestionPanelProps {
  /** Question index (0-based) */
  index: number;
  /** Question data */
  question: QuestionFormData;
  /** Total number of questions */
  totalQuestions: number;
  /** Validation errors */
  errors?: QuestionError;
  /** Callback to update question */
  onUpdate: (data: Partial<QuestionFormData>) => void;
  /** Callback to delete question */
  onDelete: () => void;
  /** Callback to toggle expanded state */
  onToggleExpand: () => void;
  /** Callback to move question up */
  onMoveUp?: () => void;
  /** Callback to move question down */
  onMoveDown?: () => void;
  /** Callback to add an answer */
  onAddAnswer: (answer: string) => void;
  /** Callback to remove an answer */
  onRemoveAnswer: (answerIndex: number) => void;
  /** Callback to pick an image */
  onPickImage: () => void;
  /** Callback to remove the image */
  onRemoveImage: () => void;
}

/**
 * Expandable question panel with accordion behavior
 */
export function QuestionPanel({
  index,
  question,
  totalQuestions,
  errors,
  onUpdate,
  onDelete,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  onAddAnswer,
  onRemoveAnswer,
  onPickImage,
  onRemoveImage,
}: QuestionPanelProps) {
  const rotateAnim = useRef(new Animated.Value(question.isExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(question.isExpanded ? 1 : 0)).current;

  const questionNumber = index + 1;
  const canMoveUp = index > 0;
  const canMoveDown = index < totalQuestions - 1;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: question.isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: question.isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [question.isExpanded, rotateAnim, heightAnim]);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Truncate question text for collapsed preview
  const questionPreview =
    question.text.length > 40
      ? question.text.substring(0, 40) + "..."
      : question.text || "New question...";

  return (
    <View
      className="mb-3 rounded-xl overflow-hidden"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: question.isExpanded
          ? colors.primary[500]
          : errors
            ? colors.error
            : colors.border,
      }}
    >
      {/* Header - Always visible */}
      <Pressable
        onPress={onToggleExpand}
        className="flex-row items-center p-4 active:bg-surface-secondary"
      >
        {/* Question number badge */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: question.isExpanded
              ? colors.primary[500]
              : withOpacity(colors.primary[500], 0.1),
          }}
        >
          <Text
            variant="body-sm"
            className="font-bold"
            style={{
              color: question.isExpanded ? colors.white : colors.primary[500],
            }}
          >
            {questionNumber}
          </Text>
        </View>

        {/* Question preview */}
        <View className="flex-1 mr-2">
          {question.isExpanded ? (
            <Text variant="body" className="font-semibold">
              Question {questionNumber}
            </Text>
          ) : (
            <>
              <Text
                variant="body-sm"
                className="font-medium"
                numberOfLines={1}
                style={{ color: question.text ? colors.text.primary : colors.text.muted }}
              >
                Q: {questionPreview}
              </Text>
              <Text variant="caption" color="muted">
                {question.answers.length} answer{question.answers.length !== 1 ? "s" : ""}
                {question.imageUri ? " • Has image" : ""}
              </Text>
            </>
          )}
        </View>

        {/* Reorder arrows (shown when collapsed) */}
        {!question.isExpanded && (
          <View className="flex-row mr-2">
            <Pressable
              onPress={onMoveUp}
              disabled={!canMoveUp}
              className="w-8 h-8 items-center justify-center active:opacity-70"
            >
              <Icon
                name="chevron-back"
                customSize={16}
                color={canMoveUp ? colors.text.secondary : colors.neutral[300]}
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
            <Pressable
              onPress={onMoveDown}
              disabled={!canMoveDown}
              className="w-8 h-8 items-center justify-center active:opacity-70"
            >
              <Icon
                name="chevron-forward"
                customSize={16}
                color={canMoveDown ? colors.text.secondary : colors.neutral[300]}
                style={{ transform: [{ rotate: "90deg" }] }}
              />
            </Pressable>
          </View>
        )}

        {/* Expand/collapse chevron */}
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <Icon name="chevron-forward" size="sm" color={colors.text.secondary} style={{ transform: [{ rotate: "90deg" }] }} />
        </Animated.View>
      </Pressable>

      {/* Expanded content */}
      {question.isExpanded && (
        <View className="px-4 pb-4 border-t" style={{ borderTopColor: colors.border }}>
          {/* Question text input */}
          <View className="mt-4 mb-4">
            <Input
              label="Question Text"
              placeholder="Enter your question..."
              value={question.text}
              onChangeText={(text) => onUpdate({ text })}
              error={errors?.text}
              multiline
              numberOfLines={3}
              maxLength={PACK_LIMITS.QUESTION_TEXT_MAX_LENGTH}
              style={{ minHeight: 80 }}
            />
            <Text variant="caption" color="muted" className="mt-1 text-right">
              {question.text.length}/{PACK_LIMITS.QUESTION_TEXT_MAX_LENGTH}
            </Text>
          </View>

          {/* Hint image */}
          <View className="mb-4">
            <Text variant="label" className="mb-2 font-medium">
              Hint Image (optional)
            </Text>
            {question.imageUri ? (
              <View className="flex-row items-center">
                <Image
                  source={{ uri: question.imageUri }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={onRemoveImage}
                  className="ml-3 px-3 py-2 rounded-lg active:opacity-70"
                  style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
                >
                  <Text
                    variant="body-sm"
                    className="font-medium"
                    style={{ color: colors.error }}
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={onPickImage}
                className="flex-row items-center p-4 rounded-lg active:opacity-70"
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.border,
                }}
              >
                <Icon name="add" size="md" color={colors.primary[500]} />
                <Text
                  variant="body-sm"
                  className="ml-2"
                  style={{ color: colors.primary[500] }}
                >
                  Add Image
                </Text>
              </Pressable>
            )}
          </View>

          {/* Answers input */}
          <View className="mb-4">
            <AnswerInput
              answers={question.answers}
              onAddAnswer={onAddAnswer}
              onRemoveAnswer={onRemoveAnswer}
              error={errors?.answers}
            />
          </View>

          {/* Delete button */}
          <Button
            variant="ghost"
            onPress={onDelete}
            style={{ alignSelf: "flex-start" }}
          >
            <View className="flex-row items-center">
              <Icon name="close" size="sm" color={colors.error} />
              <Text
                variant="body-sm"
                className="ml-1"
                style={{ color: colors.error }}
              >
                Delete Question
              </Text>
            </View>
          </Button>
        </View>
      )}
    </View>
  );
}
