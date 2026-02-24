/**
 * Pack Service
 * Business logic for pack management
 */

import { prisma } from '../config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { PackFilters, PaginationParams } from '../types';

export class PackService {
  /**
   * Create a new pack
   */
  async createPack(userId: string, packData: any) {
    return await prisma.pack.create({
      data: {
        ...packData,
        creatorId: userId,
      },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  /**
   * Validate pack question count (5-15 questions)
   */
  async validatePackQuestionCount(packId: string): Promise<boolean> {
    const questionCount = await prisma.question.count({
      where: { packId },
    });

    if (questionCount < 5 || questionCount > 15) {
      throw new ValidationError(
        `Pack must have between 5 and 15 questions. Current count: ${questionCount}`
      );
    }

    return true;
  }

  /**
   * Publish a pack (validates question count first)
   */
  async publishPack(packId: string, userId: string) {
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    if (pack.creatorId !== userId) {
      throw new ForbiddenError('You can only publish your own packs');
    }

    // Validate question count
    await this.validatePackQuestionCount(packId);

    return await prisma.pack.update({
      where: { id: packId },
      data: { isPublished: true },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  /**
   * Get public packs with filters and pagination
   */
  async getPublicPacks(filters: PackFilters = {}, pagination: PaginationParams = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { category, difficulty, search } = filters;

    const where: any = {
      visibility: 'PUBLIC',
      isPublished: true,
    };

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [packs, total] = await Promise.all([
      prisma.pack.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { id: true, username: true, avatar: true },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pack.count({ where }),
    ]);

    return { packs, total, page, limit };
  }

  /**
   * Get user's packs
   */
  async getUserPacks(userId: string) {
    return await prisma.pack.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get pack by ID with questions
   */
  async getPackById(packId: string) {
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { questions: true },
        },
      },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    return pack;
  }

  /**
   * Update pack
   */
  async updatePack(packId: string, userId: string, updateData: any) {
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    if (pack.creatorId !== userId) {
      throw new ForbiddenError('You can only update your own packs');
    }

    return await prisma.pack.update({
      where: { id: packId },
      data: updateData,
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
  }

  /**
   * Delete pack
   */
  async deletePack(packId: string, userId: string, isAdmin: boolean = false) {
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    if (pack.creatorId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete your own packs');
    }

    await prisma.pack.delete({
      where: { id: packId },
    });

    return { message: 'Pack deleted successfully' };
  }

  /**
   * Get system/standard packs (created by admins, marked as isStandard)
   */
  async getSystemPacks() {
    return await prisma.pack.findMany({
      where: {
        isStandard: true,
        isPublished: true,
      },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get popular packs - top 5 packs by number of rooms using them
   */
  async getPopularPacks(limit: number = 5) {
    // Get packs with room count, ordered by most rooms
    const packsWithRoomCount = await prisma.pack.findMany({
      where: {
        isPublished: true,
        visibility: 'PUBLIC',
      },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true },
        },
        _count: {
          select: { questions: true, rooms: true },
        },
      },
      orderBy: {
        rooms: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return packsWithRoomCount;
  }

  /**
   * Get packs for selection modal (system, user's, and popular)
   */
  async getPacksForSelection(userId: string) {
    const [systemPacks, userPacks, popularPacks] = await Promise.all([
      this.getSystemPacks(),
      this.getUserPacks(userId),
      this.getPopularPacks(5),
    ]);

    return {
      systemPacks,
      userPacks,
      popularPacks,
    };
  }
}

export default new PackService();
