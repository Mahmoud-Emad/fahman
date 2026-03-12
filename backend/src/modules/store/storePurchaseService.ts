/**
 * Store Purchase Service
 * Handles purchasing store items (packs, coins) with DB persistence
 */

import { prisma } from '@config/database';
import { ValidationError, ConflictError } from '@shared/utils/errors';
import { packStoreService } from './packStoreService';
import { verifyReceipt, type Platform } from './paymentVerificationService';
import logger from '@shared/utils/logger';

class StorePurchaseService {
  /**
   * Get store pack IDs owned by a user
   */
  async getUserOwnedStorePackIds(userId: string): Promise<string[]> {
    const purchases = await prisma.packPurchase.findMany({
      where: { userId },
      select: { packId: true },
    });
    return purchases.map(p => p.packId);
  }

  /**
   * Purchase a store pack (TOML-based)
   */
  async purchaseStorePack(userId: string, packId: string): Promise<{ packId: string; purchased: boolean; newBalance: number }> {
    // Verify pack exists in DB (store packs are synced to DB at seed time)
    const dbPack = await prisma.pack.findUnique({ where: { id: packId } });
    if (!dbPack) {
      throw new ValidationError('Pack not found');
    }

    // Get price from TOML source
    const storePack = packStoreService.getFullPack(packId);
    const price = storePack?.price ?? 0;

    // All checks + mutations inside a single transaction to prevent races
    const result = await prisma.$transaction(async (tx) => {
      // Check if already owned (inside tx to prevent double-spend)
      const existing = await tx.packPurchase.findUnique({
        where: { userId_packId: { userId, packId } },
      });
      if (existing) {
        throw new ConflictError('You already own this pack');
      }

      let newBalance = 0;
      if (price > 0) {
        // Atomic balance check + deduct: only updates if coins >= price
        const result = await tx.user.updateMany({
          where: { id: userId, coins: { gte: price } },
          data: { coins: { decrement: price } },
        });
        if (result.count === 0) {
          throw new ValidationError('Not enough coins');
        }
        const user = await tx.user.findUnique({ where: { id: userId }, select: { coins: true } });
        newBalance = user!.coins;
      } else {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { coins: true } });
        newBalance = user?.coins || 0;
      }

      await tx.packPurchase.create({
        data: { userId, packId },
      });

      return newBalance;
    });

    return { packId, purchased: true, newBalance: result };
  }

  /**
   * Purchase a coin package and add coins to user balance.
   * Verifies payment receipt and prevents replay attacks.
   */
  async purchaseCoins(
    userId: string,
    packageId: string,
    receiptToken: string,
    platform: Platform,
  ): Promise<{ coinsAdded: number; newBalance: number }> {
    const packages: Record<string, number> = {
      pack_50: 50,
      pack_150: 150,
      pack_500: 500,
    };

    const coinsToAdd = packages[packageId];
    if (!coinsToAdd) {
      throw new ValidationError('Invalid package. Must be one of: pack_50, pack_150, pack_500');
    }

    // Verify payment receipt with the platform store (before transaction to avoid
    // holding a DB transaction open during external network calls)
    await verifyReceipt(receiptToken, packageId, platform);

    // Atomic transaction: replay check + create record + grant coins
    const result = await prisma.$transaction(async (tx) => {
      // Replay attack prevention inside tx to prevent concurrent duplicate grants
      const existingTransaction = await tx.transaction.findUnique({
        where: { receiptToken },
      });
      if (existingTransaction) {
        throw new ConflictError('This receipt has already been processed');
      }

      await tx.transaction.create({
        data: {
          buyerId: userId,
          amount: coinsToAdd,
          status: 'COMPLETED',
          paymentMethod: platform,
          receiptToken,
          platform,
          completedAt: new Date(),
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: coinsToAdd } },
        select: { coins: true },
      });

      return user.coins;
    });

    logger.info(`Coin purchase: user=${userId} package=${packageId} platform=${platform} coins=${coinsToAdd}`);

    return { coinsAdded: coinsToAdd, newBalance: result };
  }
}

export const storePurchaseService = new StorePurchaseService();
