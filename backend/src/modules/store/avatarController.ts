/**
 * Avatar Controller
 * Handles avatar and album management endpoints
 */

import { Response, NextFunction } from 'express';
import { avatarService } from './avatarService';
import { successResponse, errorResponse } from '@shared/utils/responseFormatter';
import { AuthRequest } from '@shared/types/index';

export async function getAllAvatars(req: AuthRequest, res: Response) {
  const avatars = await avatarService.getAllAvatars();
  const ownedAlbumIds = req.user
    ? await avatarService.getUserOwnedAlbumIds(req.user.id)
    : [];

  const ownedSet = new Set(ownedAlbumIds);
  const albums = avatars.albums.map(album => ({
    ...album,
    isOwned: ownedSet.has(album.id),
  }));

  res.json(successResponse({ ...avatars, albums, ownedAlbumIds }, 'Avatars retrieved successfully'));
}

export async function getFreeAvatars(_req: AuthRequest, res: Response) {
  const freeAvatars = avatarService.getFreeAvatars();
  res.json(successResponse(freeAvatars, 'Free avatars retrieved successfully'));
}

export async function getAlbums(req: AuthRequest, res: Response) {
  const albums = avatarService.getAlbums();
  const ownedAlbumIds = req.user
    ? await avatarService.getUserOwnedAlbumIds(req.user.id)
    : [];

  const ownedSet = new Set(ownedAlbumIds);
  const withOwnership = albums.map(album => ({
    ...album,
    isOwned: ownedSet.has(album.id),
  }));

  res.json(successResponse(withOwnership, 'Albums retrieved successfully'));
}

export async function getAlbum(req: AuthRequest, res: Response): Promise<void> {
  const { albumId } = req.params;
  const album = await avatarService.getAlbum(albumId);

  if (!album) {
    res.status(404).json(errorResponse('Album not found'));
    return;
  }

  const isOwned = req.user
    ? await avatarService.checkAlbumOwnership(req.user.id, albumId)
    : false;

  res.json(successResponse({ ...album, isOwned }, 'Album retrieved successfully'));
}

export async function purchaseAlbum(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { albumId } = req.params;
    const userId = req.user!.id;

    const result = await avatarService.purchaseAlbum(userId, albumId);
    res.json(successResponse(result, 'Album purchased successfully'));
  } catch (error) {
    next(error);
  }
}
