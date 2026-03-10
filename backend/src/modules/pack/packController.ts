/**
 * Pack Controller
 */

import { Response, NextFunction } from 'express';
import packService from './packService';
import { successResponse, paginatedResponse } from '../../shared/utils/responseFormatter';
import { AuthRequest } from '../../shared/types/index';

export async function createPack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pack = await packService.createPack(req.user.id, req.body);
    res.status(201).json(successResponse(pack, 'Pack created successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getPublicPacks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { category, difficulty, search, page, limit } = req.query;

    const result = await packService.getPublicPacks(
      { category: category as string, difficulty: difficulty as string, search: search as string },
      { page: parseInt(page as string) || 1, limit: parseInt(limit as string) || 20 }
    );

    res.json(paginatedResponse(result.packs, result.page, result.limit, result.total));
  } catch (error) {
    next(error);
  }
}

export async function getMyPacks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const packs = await packService.getUserPacks(req.user.id);
    res.json(successResponse(packs));
  } catch (error) {
    next(error);
  }
}

export async function getPackById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pack = await packService.getPackById(req.params.id);
    res.json(successResponse(pack));
  } catch (error) {
    next(error);
  }
}

export async function updatePack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pack = await packService.updatePack(req.params.id, req.user.id, req.body);
    res.json(successResponse(pack, 'Pack updated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deletePack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await packService.deletePack(
      req.params.id,
      req.user.id,
      req.user.role === 'ADMIN'
    );
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function publishPack(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const pack = await packService.publishPack(req.params.id, req.user.id);
    res.json(successResponse(pack, 'Pack published successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getSystemPacks(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const packs = await packService.getSystemPacks();
    res.json(successResponse(packs));
  } catch (error) {
    next(error);
  }
}

export async function getPopularPacks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const packs = await packService.getPopularPacks(limit);
    res.json(successResponse(packs));
  } catch (error) {
    next(error);
  }
}

export async function getPacksForSelection(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await packService.getPacksForSelection(req.user.id);
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}
