/**
 * Pack Service
 * Business logic for pack management
 */

import { Prisma, Difficulty, Visibility } from '@prisma/client';
import { prisma } from '@config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '@shared/utils/errors';
import { PackFilters } from '@shared/types/index';
import { PaginationParams } from '@shared/types/pagination';
import { paginate } from '@shared/utils/pagination';
import { packStoreService } from '../store/packStoreService';
import { storePurchaseService } from '../store/storePurchaseService';

export class PackService {
  /**
   * Create a new pack
   */
  async createPack(userId: string, packData: {
    title: string;
    description?: string | null;
    category?: string | null;
    difficulty?: string | null;
    visibility?: string;
    imageUrl?: string | null;
  }) {
    return await prisma.pack.create({
      data: {
        title: packData.title,
        description: packData.description,
        category: packData.category,
        difficulty: packData.difficulty as Difficulty,
        visibility: (packData.visibility as Visibility) || 'PUBLIC',
        imageUrl: packData.imageUrl,
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
    const { category, difficulty, search } = filters;

    const where: Prisma.PackWhereInput = {
      visibility: 'PUBLIC',
      isPublished: true,
    };

    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty as Difficulty;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const include = {
      creator: {
        select: { id: true, username: true, avatar: true },
      },
      _count: {
        select: { questions: true },
      },
    };

    const result = await paginate({
      page: pagination.page,
      limit: pagination.limit,
      findMany: ({ skip, take }) =>
        prisma.pack.findMany({ where, skip, take, include, orderBy: { createdAt: 'desc' } }),
      count: () => prisma.pack.count({ where }),
    });

    return { packs: result.data, ...result.meta };
  }

  /**
   * Get user's packs
   */
  async getUserPacks(userId: string) {
    const packs = await prisma.pack.findMany({
      where: { creatorId: userId },
      include: {
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get per-pack play count: rooms that used each pack and had game sessions
    const packIds = packs.map(p => p.id);
    const playCounts = packIds.length > 0
      ? await prisma.room.groupBy({
          by: ['selectedPackId'],
          where: {
            selectedPackId: { in: packIds },
            gameSessions: { some: {} },
          },
          _count: true,
        })
      : [];

    const playCountMap = new Map(playCounts.map(pc => [pc.selectedPackId, pc._count]));

    return packs.map(pack => ({
      ...pack,
      timesPlayed: playCountMap.get(pack.id) || 0,
    }));
  }

  /**
   * Get pack by ID with questions.
   * Enforces visibility: PRIVATE packs are only visible to the creator.
   * FRIENDS packs require an accepted friendship with the creator.
   */
  async getPackById(packId: string, userId?: string) {
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

    // Creator always has access
    if (pack.creatorId === userId) {
      return pack;
    }

    // PRIVATE packs: creator-only
    if (pack.visibility === 'PRIVATE') {
      throw new ForbiddenError('Access denied');
    }

    // FRIENDS packs: require accepted friendship with creator
    if (pack.visibility === 'FRIENDS') {
      if (!userId) {
        throw new ForbiddenError('Access denied');
      }
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { userId: pack.creatorId, friendId: userId },
            { userId, friendId: pack.creatorId },
          ],
        },
      });
      if (!friendship) {
        throw new ForbiddenError('Access denied');
      }
    }

    return pack;
  }

  /**
   * Update pack
   */
  async updatePack(packId: string, userId: string, updateData: {
    title?: string;
    description?: string | null;
    category?: string | null;
    difficulty?: string | null;
    visibility?: string;
    imageUrl?: string | null;
  }) {
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    if (pack.creatorId !== userId) {
      throw new ForbiddenError('You can only update your own packs');
    }

    // Whitelist allowed fields — never allow isStandard, isPublished, timesPlayed, creatorId
    return await prisma.pack.update({
      where: { id: packId },
      data: {
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.category !== undefined && { category: updateData.category }),
        ...(updateData.difficulty !== undefined && { difficulty: updateData.difficulty as Difficulty }),
        ...(updateData.visibility !== undefined && { visibility: updateData.visibility as Visibility }),
        ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
      },
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
  async getPopularPacks(limit: number = 5, excludeIds: string[] = []) {
    // Get packs with room count, ordered by most rooms
    const packsWithRoomCount = await prisma.pack.findMany({
      where: {
        isPublished: true,
        visibility: 'PUBLIC',
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
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
   * Get packs for selection modal (system, user's, popular, store packs by category)
   * Popular packs exclude system packs and user's own packs to avoid duplicates.
   */
  async getPacksForSelection(userId: string) {
    const [systemPacks, userPacks, ownedStorePackIds] = await Promise.all([
      this.getSystemPacks(),
      this.getUserPacks(userId),
      storePurchaseService.getUserOwnedStorePackIds(userId),
    ]);

    const allStorePacks = packStoreService.getStorePacks();
    const ownedStoreSet = new Set(ownedStorePackIds);

    // Split store packs into owned, free (unowned), and paid (unowned)
    const ownedStorePacks = ownedStorePackIds
      .map(id => allStorePacks.find(p => p.id === id))
      .filter(Boolean)
      .map(pack => packStoreService.toPreview(pack!));

    const freeStorePacks = allStorePacks
      .filter(p => p.free && !ownedStoreSet.has(p.id))
      .map(pack => packStoreService.toPreview(pack));

    const paidStorePacks = allStorePacks
      .filter(p => !p.free && !ownedStoreSet.has(p.id))
      .map(pack => packStoreService.toPreview(pack));

    // Collect IDs to exclude from popular section
    const excludeIds = [
      ...systemPacks.map((p) => p.id),
      ...userPacks.map((p) => p.id),
    ];

    const popularPacks = await this.getPopularPacks(5, excludeIds);

    return {
      systemPacks,
      userPacks,
      popularPacks,
      freeStorePacks,
      paidStorePacks,
      ownedStorePacks,
    };
  }
}

export default new PackService();
