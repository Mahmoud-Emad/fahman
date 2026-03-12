/**
 * Store Controller
 * Handles marketplace/store endpoints
 */

import { Response, NextFunction } from 'express';
import { storeService } from './storeService';
import { avatarService } from './avatarService';
import { packStoreService } from './packStoreService';
import { successResponse } from '@shared/utils/responseFormatter';
import { AuthRequest } from '@shared/types/index';
import { getAuthUser } from '@shared/middleware/getAuthUser';

export async function getAllStoreData(req: AuthRequest, res: Response) {
  const userId = req.user?.id;
  const [storeData, ownedPackIds, ownedAlbumIds] = await Promise.all([
    storeService.getAllStoreData(),
    userId ? storeService.getUserOwnedStorePackIds(userId) : [],
    userId ? avatarService.getUserOwnedAlbumIds(userId) : [],
  ]);
  res.json(successResponse({ ...storeData, ownedPackIds, ownedAlbumIds }, 'Store data retrieved successfully'));
}

export async function getAvatars(_req: AuthRequest, res: Response) {
  const avatars = await storeService.getAvatarsData();
  res.json(successResponse(avatars, 'Avatars retrieved successfully'));
}

export async function getSounds(_req: AuthRequest, res: Response) {
  const sounds = await storeService.getSoundsData();
  res.json(successResponse(sounds, 'Sounds retrieved successfully'));
}

export async function getPacks(_req: AuthRequest, res: Response) {
  const packs = await packStoreService.getPackPreviews();
  res.json(successResponse(packs, 'Store packs retrieved successfully'));
}

export async function getFullPack(req: AuthRequest, res: Response) {
  const packId = decodeURIComponent(req.params.packId);
  const pack = await packStoreService.getFullPack(packId);
  if (!pack) {
    res.status(404).json({ success: false, error: { message: 'Pack not found' } });
    return;
  }
  res.json(successResponse(pack, 'Pack retrieved successfully'));
}

export async function purchasePack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = getAuthUser(req).id;
    const packId = decodeURIComponent(req.params.packId);

    const result = await storeService.purchaseStorePack(userId, packId);
    res.json(successResponse(result, 'Pack purchased successfully'));
  } catch (error) {
    next(error);
  }
}

export async function purchaseAvatarAlbum(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { albumId } = req.params;
    const userId = getAuthUser(req).id;

    const result = await avatarService.purchaseAlbum(userId, albumId);
    res.json(successResponse(result, 'Avatar album purchased successfully'));
  } catch (error) {
    next(error);
  }
}

export async function purchaseSound(req: AuthRequest, res: Response) {
  const { soundId } = req.params;

  res.json(successResponse(
    { soundId, purchased: true },
    'Sound purchased successfully'
  ));
}

export async function purchaseCoins(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { packageId, receiptToken, platform } = req.body;
    const userId = getAuthUser(req).id;

    const result = await storeService.purchaseCoins(userId, packageId, receiptToken, platform);

    res.json(successResponse(result, `${result.coinsAdded} coins added successfully`));
  } catch (error) {
    next(error);
  }
}
