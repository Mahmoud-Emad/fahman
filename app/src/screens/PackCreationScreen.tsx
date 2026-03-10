/**
 * PackCreationScreen - Create or edit a question pack
 * Features: Pack info form, question management with accordion panels
 */
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { Text, Button, Icon, Dialog } from "@/components/ui";
import { useImagePicker } from "@/components/packs";
import { PackDetailsForm } from "@/components/packs/PackDetailsForm";
import { QuestionsList } from "@/components/packs/QuestionsList";
import type {
  PackFormData,
  PackFormErrors,
  QuestionFormData,
  QuestionError,
} from "@/components/packs/types";
import { packsService, type CreateQuestionData } from "@/services/packsService";
import { uploadService } from "@/services/uploadService";
import { useToast } from "@/contexts";
import { colors } from "@/themes";
import { transformUrl } from "@/utils/transformUrl";
import { PACK_LIMITS } from "@/constants";
import type { RootStackParamList } from "../../App";

type PackCreationNavigationProp = StackNavigationProp<RootStackParamList, "PackCreation">;
type PackCreationRouteProp = RouteProp<RootStackParamList, "PackCreation">;

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyQuestion = (): QuestionFormData => ({
  id: generateId(),
  text: "",
  answers: [],
  correctAnswerIndices: [],
  imageUri: null,
  isExpanded: true,
});

const getInitialFormData = (): PackFormData => ({
  title: "",
  description: "",
  textHint: "",
  logoUri: null,
  isPublic: true,
  questions: [],
});

/**
 * Pack creation screen
 */
export function PackCreationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<PackCreationNavigationProp>();
  const route = useRoute<PackCreationRouteProp>();
  const toast = useToast();
  const packId = route.params?.packId;
  const isEditing = !!packId;

  const [formData, setFormData] = useState<PackFormData>(getInitialFormData);
  const [errors, setErrors] = useState<PackFormErrors>({ questionErrors: {} });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingPack, setIsLoadingPack] = useState(isEditing);

  const { pickImage } = useImagePicker();

  useEffect(() => {
    const loadPackData = async () => {
      if (!packId) return;
      setIsLoadingPack(true);
      try {
        const response = await packsService.getPack(packId);
        if (response.success && response.data) {
          const pack = response.data;
          setFormData({
            title: pack.title,
            description: pack.description || "",
            textHint: (pack as any).textHint || "",
            logoUri: transformUrl(pack.imageUrl) || null,
            isPublic: pack.visibility === "PUBLIC",
            questions: pack.questions.map((q) => ({
              id: q.id,
              text: q.text,
              answers: q.options,
              correctAnswerIndices: q.correctAnswers,
              imageUri: transformUrl(q.mediaUrl) || null,
              isExpanded: false,
            })),
          });
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load pack data");
        setApiError("Failed to load pack data");
      } finally {
        setIsLoadingPack(false);
      }
    };

    loadPackData();
  }, [packId]);

  const clearError = useCallback(
    (field: keyof PackFormErrors) => {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [errors]
  );

  const clearQuestionError = useCallback(
    (questionId: string, field: keyof QuestionError) => {
      if (errors.questionErrors[questionId]?.[field]) {
        setErrors((prev) => ({
          ...prev,
          questionErrors: {
            ...prev.questionErrors,
            [questionId]: { ...prev.questionErrors[questionId], [field]: undefined },
          },
        }));
      }
    },
    [errors]
  );

  const updateQuestion = (questionId: string, data: Partial<QuestionFormData>) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, ...data } : q)),
    }));
    if (data.text !== undefined) clearQuestionError(questionId, "text");
  };

  const addQuestion = () => {
    if (formData.questions.length >= PACK_LIMITS.MAX_QUESTIONS) return;
    const collapsed = formData.questions.map((q) => ({ ...q, isExpanded: false }));
    setFormData((prev) => ({ ...prev, questions: [...collapsed, createEmptyQuestion()] }));
    clearError("questions");
  };

  const deleteQuestion = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
    setDeleteQuestionId(null);
  };

  const toggleQuestionExpanded = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => ({
        ...q,
        isExpanded: q.id === questionId ? !q.isExpanded : false,
      })),
    }));
  };

  const moveQuestion = (fromIndex: number, direction: "up" | "down") => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= formData.questions.length) return;
    const newQuestions = [...formData.questions];
    const [moved] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, moved);
    setFormData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const addAnswer = (questionId: string, answer: string) => {
    const question = formData.questions.find((q) => q.id === questionId);
    if (!question || question.answers.length >= PACK_LIMITS.MAX_ANSWERS_PER_QUESTION) return;
    const newAnswers = [...question.answers, answer];
    const newCorrectIndices = [...question.correctAnswerIndices, question.answers.length];
    updateQuestion(questionId, { answers: newAnswers, correctAnswerIndices: newCorrectIndices });
    clearQuestionError(questionId, "answers");
  };

  const removeAnswer = (questionId: string, answerIndex: number) => {
    const question = formData.questions.find((q) => q.id === questionId);
    if (!question) return;
    const newAnswers = question.answers.filter((_, i) => i !== answerIndex);
    const newCorrectIndices = question.correctAnswerIndices
      .filter((i) => i !== answerIndex)
      .map((i) => (i > answerIndex ? i - 1 : i));
    updateQuestion(questionId, { answers: newAnswers, correctAnswerIndices: newCorrectIndices });
  };

  const pickQuestionImage = async (questionId: string) => {
    const uri = await pickImage();
    if (uri) updateQuestion(questionId, { imageUri: uri });
  };

  const validateForm = (): boolean => {
    const newErrors: PackFormErrors = { questionErrors: {} };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > PACK_LIMITS.TITLE_MAX_LENGTH) {
      newErrors.title = `Title must be ${PACK_LIMITS.TITLE_MAX_LENGTH} characters or less`;
    }

    if (formData.description.length > PACK_LIMITS.DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `Description must be ${PACK_LIMITS.DESCRIPTION_MAX_LENGTH} characters or less`;
    }

    if (formData.questions.length < PACK_LIMITS.MIN_QUESTIONS) {
      newErrors.questions = `Minimum ${PACK_LIMITS.MIN_QUESTIONS} questions required`;
    } else if (formData.questions.length > PACK_LIMITS.MAX_QUESTIONS) {
      newErrors.questions = `Maximum ${PACK_LIMITS.MAX_QUESTIONS} questions allowed`;
    }

    formData.questions.forEach((question) => {
      const qErrors: QuestionError = {};
      if (!question.text.trim()) qErrors.text = "Question text is required";
      if (question.answers.length < PACK_LIMITS.MIN_ANSWERS_PER_QUESTION) {
        qErrors.answers = "At least one correct answer is required";
      }
      if (Object.keys(qErrors).length > 0) {
        newErrors.questionErrors[question.id] = qErrors;
      }
    });

    setErrors(newErrors);
    return !newErrors.title && !newErrors.description && !newErrors.questions &&
      Object.keys(newErrors.questionErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const firstErrorQuestionId = Object.keys(errors.questionErrors)[0];
      if (firstErrorQuestionId) toggleQuestionExpanded(firstErrorQuestionId);
      return;
    }

    setIsSaving(true);
    setApiError(null);

    try {
      let packImageUrl: string | null = null;
      if (formData.logoUri) {
        const uploadedUrl = await uploadService.processImageUri(formData.logoUri);
        packImageUrl = uploadedUrl || null;
      }

      const processedQuestions = await Promise.all(
        formData.questions.map(async (q) => {
          let mediaUrl: string | null = null;
          if (q.imageUri) {
            const uploadedUrl = await uploadService.processImageUri(q.imageUri);
            mediaUrl = uploadedUrl || null;
          }
          return { ...q, uploadedImageUrl: mediaUrl };
        })
      );

      let targetPackId = packId;

      if (isEditing && packId) {
        const packResponse = await packsService.updatePack(packId, {
          title: formData.title,
          description: formData.description || undefined,
          textHint: formData.textHint || undefined,
          imageUrl: packImageUrl || undefined,
          visibility: formData.isPublic ? "PUBLIC" : "PRIVATE",
        });
        if (!packResponse.success) {
          throw new Error(packResponse.message || "Failed to update pack");
        }

        const existingResponse = await packsService.getPack(packId);
        const existingQuestions = existingResponse.data?.questions || [];
        const existingIds = new Set(existingQuestions.map((q) => q.id));

        for (let i = 0; i < processedQuestions.length; i++) {
          const q = processedQuestions[i];
          const questionData: CreateQuestionData = {
            text: q.text,
            options: q.answers,
            correctAnswers: q.correctAnswerIndices.length > 0 ? q.correctAnswerIndices : [0],
            questionType: "SINGLE",
            mediaUrl: q.uploadedImageUrl || undefined,
            mediaType: q.uploadedImageUrl ? "IMAGE" : undefined,
            timeLimit: 30,
            points: 100,
          };

          if (existingIds.has(q.id)) {
            await packsService.updateQuestion(q.id, questionData);
          } else {
            await packsService.addQuestion(packId, questionData);
          }
        }

        const currentIds = new Set(formData.questions.map((q) => q.id));
        for (const existingQ of existingQuestions) {
          if (!currentIds.has(existingQ.id)) {
            await packsService.deleteQuestion(existingQ.id);
          }
        }
      } else {
        const packResponse = await packsService.createPack({
          title: formData.title,
          description: formData.description || undefined,
          textHint: formData.textHint || undefined,
          imageUrl: packImageUrl || undefined,
          visibility: formData.isPublic ? "PUBLIC" : "PRIVATE",
        });
        if (!packResponse.success || !packResponse.data) {
          throw new Error(packResponse.message || "Failed to create pack");
        }

        targetPackId = packResponse.data.id;

        const questions: CreateQuestionData[] = processedQuestions.map((q, index) => ({
          text: q.text,
          options: q.answers,
          correctAnswers: q.correctAnswerIndices.length > 0 ? q.correctAnswerIndices : [0],
          questionType: "SINGLE" as const,
          mediaUrl: q.uploadedImageUrl || undefined,
          mediaType: q.uploadedImageUrl ? ("IMAGE" as const) : undefined,
          timeLimit: 30,
          points: 100,
        }));

        const questionsResponse = await packsService.addQuestionsBulk(targetPackId!, questions);
        if (!questionsResponse.success) {
          toast.error(questionsResponse.message || "Failed to add questions");
        }
      }

      navigation.goBack();
    } catch (error: any) {
      toast.error(error.message || "Failed to save pack. Please try again.");
      setApiError(error.message || "Failed to save pack. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isQuestionCountValid =
    formData.questions.length >= PACK_LIMITS.MIN_QUESTIONS &&
    formData.questions.length <= PACK_LIMITS.MAX_QUESTIONS;

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-primary-500">
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full items-center justify-center -ml-2 active:opacity-70"
          >
            <Icon name="chevron-back" color={colors.white} size="lg" />
          </Pressable>
          <Text variant="h3" className="flex-1 text-center font-bold" style={{ color: colors.white }}>
            {isEditing ? "Edit Pack" : "Create Pack"}
          </Text>
          <Button
            variant="ghost"
            loading={isSaving}
            disabled={isSaving || isLoadingPack}
            onPress={handleSave}
            textClassName="font-semibold"
            style={{ marginRight: -8 }}
          >
            <Text className="font-semibold" style={{ color: colors.white }}>
              Save
            </Text>
          </Button>
        </View>
      </View>

      {isLoadingPack ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text variant="body" color="muted" className="mt-3">
            Loading pack...
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PackDetailsForm
              formData={formData}
              errors={errors}
              onPickLogo={async () => {
                const uri = await pickImage();
                if (uri) setFormData((prev) => ({ ...prev, logoUri: uri }));
              }}
              onRemoveLogo={() => setFormData((prev) => ({ ...prev, logoUri: null }))}
              onUpdateTitle={(title) => {
                setFormData((prev) => ({ ...prev, title }));
                clearError("title");
              }}
              onUpdateDescription={(description) => {
                setFormData((prev) => ({ ...prev, description }));
                clearError("description");
              }}
              onUpdateTextHint={(textHint) => {
                setFormData((prev) => ({ ...prev, textHint }));
              }}
              onTogglePublic={() => setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
            />

            <QuestionsList
              questions={formData.questions}
              errors={errors}
              isQuestionCountValid={isQuestionCountValid}
              onAddQuestion={addQuestion}
              onUpdateQuestion={updateQuestion}
              onDeleteQuestion={(id) => setDeleteQuestionId(id)}
              onToggleExpand={toggleQuestionExpanded}
              onMoveQuestion={moveQuestion}
              onAddAnswer={addAnswer}
              onRemoveAnswer={removeAnswer}
              onPickImage={pickQuestionImage}
              onRemoveImage={(questionId) => updateQuestion(questionId, { imageUri: null })}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <Dialog
        visible={!!deleteQuestionId}
        onClose={() => setDeleteQuestionId(null)}
        title="Delete Question?"
        message="This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => deleteQuestionId && deleteQuestion(deleteQuestionId)}
      />

      <Dialog
        visible={!!apiError}
        onClose={() => setApiError(null)}
        title="Error"
        message={apiError || "An error occurred"}
        confirmText="OK"
        onConfirm={() => setApiError(null)}
      />
    </View>
  );
}
