/**
 * Store Controller
 * Handles marketplace/store endpoints
 */

import { Response, NextFunction } from 'express';
import { storeService } from './storeService';
import { packStoreService } from './packStoreService';
import { successResponse } from '../../shared/utils/responseFormatter';
import { AuthRequest } from '../../shared/types/index';

export async function getAllStoreData(_req: AuthRequest, res: Response) {
  const storeData = await storeService.getAllStoreData();
  res.json(successResponse(storeData, 'Store data retrieved successfully'));
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
  const { packId } = req.params;
  const pack = await packStoreService.getFullPack(packId);
  if (!pack) {
    res.status(404).json({ success: false, error: { message: 'Pack not found' } });
    return;
  }
  res.json(successResponse(pack, 'Pack retrieved successfully'));
}

export async function purchasePack(req: AuthRequest, res: Response) {
  const { packId } = req.params;

  res.json(successResponse(
    { packId, purchased: true },
    'Pack purchased successfully'
  ));
}

export async function purchaseAvatarAlbum(req: AuthRequest, res: Response) {
  const { albumId } = req.params;

  res.json(successResponse(
    { albumId, purchased: true },
    'Avatar album purchased successfully'
  ));
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
    const { packageId } = req.body;
    const userId = req.user!.id;

    const result = await storeService.purchaseCoins(userId, packageId);

    res.json(successResponse(result, `${result.coinsAdded} coins added successfully`));
  } catch (error) {
    next(error);
  }
}
