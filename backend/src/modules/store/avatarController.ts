/**
 * Avatar Controller
 * Handles avatar and album management endpoints
 */

import { Response } from 'express';
import { avatarService } from './avatarService';
import { successResponse, errorResponse } from '../../shared/utils/responseFormatter';
import { AuthRequest } from '../../shared/types/index';

export async function getAllAvatars(req: AuthRequest, res: Response) {
  const avatars = await avatarService.getAllAvatars();

  if (req.user) {
    for (const album of avatars.albums) {
      (album as any).isOwned = await avatarService.checkAlbumOwnership(
        req.user.id,
        album.id
      );
    }
  }

  res.json(successResponse(avatars, 'Avatars retrieved successfully'));
}

export async function getFreeAvatars(_req: AuthRequest, res: Response) {
  const freeAvatars = avatarService.getFreeAvatars();
  res.json(successResponse(freeAvatars, 'Free avatars retrieved successfully'));
}

export async function getAlbums(req: AuthRequest, res: Response) {
  const albums = avatarService.getAlbums();

  if (req.user) {
    for (const album of albums) {
      (album as any).isOwned = await avatarService.checkAlbumOwnership(
        req.user.id,
        album.id
      );
    }
  }

  res.json(successResponse(albums, 'Albums retrieved successfully'));
}

export async function getAlbum(req: AuthRequest, res: Response): Promise<void> {
  const { albumId } = req.params;
  const album = await avatarService.getAlbum(albumId);

  if (!album) {
    res.status(404).json(errorResponse('Album not found'));
    return;
  }

  if (req.user) {
    (album as any).isOwned = await avatarService.checkAlbumOwnership(
      req.user.id,
      albumId
    );
  }

  res.json(successResponse(album, 'Album retrieved successfully'));
}

export async function purchaseAlbum(req: AuthRequest, res: Response): Promise<void> {
  const { albumId } = req.params;
  const userId = req.user!.id;

  const album = await avatarService.getAlbum(albumId);
  if (!album) {
    res.status(404).json(errorResponse('Album not found'));
    return;
  }

  const alreadyOwned = await avatarService.checkAlbumOwnership(userId, albumId);
  if (alreadyOwned) {
    res.status(400).json(errorResponse('You already own this album'));
    return;
  }

  res.json(successResponse(
    { albumId, purchased: true },
    'Album purchased successfully'
  ));
}
