/**
 * Question Service
 * Business logic for question management
 */

import { prisma } from '../../config/database';
import { QuestionType, MediaType, Prisma } from '@prisma/client';
import { ValidationError, NotFoundError, ForbiddenError } from '../../shared/utils/errors';

interface CreateQuestionData {
  text: string;
  options: Prisma.InputJsonValue;
  correctAnswers: Prisma.InputJsonValue;
  questionType?: QuestionType;
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  timeLimit?: number;
  points?: number;
  orderIndex: number;
}

type UpdateQuestionData = Partial<CreateQuestionData>;

export class QuestionService {
  /**
   * Create a question for a pack
   */
  async createQuestion(packId: string, userId: string, questionData: CreateQuestionData) {
    // Verify pack exists and user owns it
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    if (pack.creatorId !== userId) {
      throw new ForbiddenError('You can only add questions to your own packs');
    }

    // Check question count limit
    if (pack._count.questions >= 15) {
      throw new ValidationError('Pack cannot have more than 15 questions');
    }

    return await prisma.question.create({
      data: {
        ...questionData,
        packId,
      },
    });
  }

  /**
   * Get questions for a pack
   */
  async getPackQuestions(packId: string) {
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    return await prisma.question.findMany({
      where: { packId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /**
   * Update a question
   */
  async updateQuestion(questionId: string, userId: string, updateData: UpdateQuestionData) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        pack: true,
      },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    if (question.pack.creatorId !== userId) {
      throw new ForbiddenError('You can only update questions in your own packs');
    }

    return await prisma.question.update({
      where: { id: questionId },
      data: updateData,
    });
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string, userId: string, isAdmin: boolean = false) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        pack: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    if (question.pack.creatorId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete questions from your own packs');
    }

    // Check if pack would have too few questions
    if (question.pack._count.questions <= 5 && question.pack.isPublished) {
      throw new ValidationError('Cannot delete question: pack must have at least 5 questions');
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return { message: 'Question deleted successfully' };
  }

  /**
   * Bulk create questions
   */
  async bulkCreateQuestions(packId: string, userId: string, questions: CreateQuestionData[]) {
    // Verify pack
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    if (pack.creatorId !== userId) {
      throw new ForbiddenError('You can only add questions to your own packs');
    }

    // Check total would not exceed 15
    if (pack._count.questions + questions.length > 15) {
      throw new ValidationError(
        `Adding ${questions.length} questions would exceed the 15 question limit`
      );
    }

    // Create all questions
    const createdQuestions = await prisma.$transaction(
      questions.map((q) =>
        prisma.question.create({
          data: {
            ...q,
            packId,
          },
        })
      )
    );

    return createdQuestions;
  }
}

export default new QuestionService();
