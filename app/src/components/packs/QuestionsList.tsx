/**
 * QuestionsList - Questions accordion list with add/edit/delete for PackCreationScreen
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Button, Icon, Badge } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { PACK_LIMITS } from "@/constants";
import { QuestionPanel } from "./QuestionPanel";
import type { PackFormErrors, QuestionFormData } from "./types";

interface QuestionsListProps {
  questions: QuestionFormData[];
  errors: PackFormErrors;
  isQuestionCountValid: boolean;
  onAddQuestion: () => void;
  onUpdateQuestion: (id: string, data: Partial<QuestionFormData>) => void;
  onDeleteQuestion: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onMoveQuestion: (fromIndex: number, direction: "up" | "down") => void;
  onAddAnswer: (questionId: string, answer: string) => void;
  onRemoveAnswer: (questionId: string, answerIndex: number) => void;
  onPickImage: (questionId: string) => void;
  onRemoveImage: (questionId: string) => void;
}

/**
 * Questions section: summary bar, validation message, panels, and add button
 */
export function QuestionsList({
  questions,
  errors,
  isQuestionCountValid,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onToggleExpand,
  onMoveQuestion,
  onAddAnswer,
  onRemoveAnswer,
  onPickImage,
  onRemoveImage,
}: QuestionsListProps) {
  const questionCount = questions.length;

  return (
    <>
      {/* Summary Bar */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Text variant="body" className="font-semibold mr-2">
            Questions
          </Text>
          <Badge variant={isQuestionCountValid ? "success" : "warning"} size="sm">
            {questionCount}/{PACK_LIMITS.MAX_QUESTIONS}
          </Badge>
        </View>
        <Button
          variant="outline"
          size="sm"
          disabled={questionCount >= PACK_LIMITS.MAX_QUESTIONS}
          onPress={onAddQuestion}
        >
          <View className="flex-row items-center">
            <Icon name="add" customSize={16} color={colors.primary[500]} />
            <Text variant="body-sm" className="ml-1" style={{ color: colors.primary[500] }}>
              Add
            </Text>
          </View>
        </Button>
      </View>

      {/* Questions validation error */}
      {errors.questions && (
        <View
          className="flex-row items-center px-3 py-2 rounded-lg mb-3"
          style={{ backgroundColor: withOpacity(colors.warning, 0.1) }}
        >
          <Icon name="warning" size="sm" color={colors.warning} />
          <Text variant="body-sm" className="ml-2" style={{ color: colors.warning }}>
            {errors.questions}
          </Text>
        </View>
      )}

      {/* Question Panels */}
      {questions.map((question, index) => (
        <QuestionPanel
          key={question.id}
          index={index}
          question={question}
          totalQuestions={questions.length}
          errors={errors.questionErrors[question.id]}
          onUpdate={(data) => onUpdateQuestion(question.id, data)}
          onDelete={() => onDeleteQuestion(question.id)}
          onToggleExpand={() => onToggleExpand(question.id)}
          onMoveUp={() => onMoveQuestion(index, "up")}
          onMoveDown={() => onMoveQuestion(index, "down")}
          onAddAnswer={(answer) => onAddAnswer(question.id, answer)}
          onRemoveAnswer={(answerIndex) => onRemoveAnswer(question.id, answerIndex)}
          onPickImage={() => onPickImage(question.id)}
          onRemoveImage={() => onRemoveImage(question.id)}
        />
      ))}

      {/* Add Question Card */}
      {questionCount < PACK_LIMITS.MAX_QUESTIONS && (
        <Pressable
          onPress={onAddQuestion}
          className="p-6 rounded-xl items-center active:opacity-70"
          style={{
            backgroundColor: withOpacity(colors.primary[500], 0.05),
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: withOpacity(colors.primary[500], 0.2),
          }}
        >
          <Icon name="add" size="lg" color={colors.primary[500]} />
          <Text variant="body" className="mt-2 font-medium" style={{ color: colors.primary[500] }}>
            Add Question
          </Text>
        </Pressable>
      )}
    </>
  );
}
