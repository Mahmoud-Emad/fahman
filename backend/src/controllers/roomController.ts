/**
 * Room Controller
 * HTTP request handlers for room operations
 */

import { Response, NextFunction } from 'express';
import roomService from '../services/roomService';
import roomMembersService from '../services/roomMembersService';
import { successResponse, paginatedResponse } from '../utils/responseFormatter';
import { AuthRequest } from '../types';

/**
 * Create a new room
 */
export async function createRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await roomService.createRoom(req.user.id, req.body);
    res.status(201).json(successResponse(room, 'Room created successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get public rooms
 */
export async function getPublicRooms(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { status, page, limit } = req.query;

    const result = await roomService.getPublicRooms(
      { page: parseInt(page as string) || 1, limit: parseInt(limit as string) || 20 },
      { status: status as string }
    );

    res.json(paginatedResponse(result.rooms, result.page, result.limit, result.total));
  } catch (error) {
    next(error);
  }
}

/**
 * Get popular rooms
 */
export async function getPopularRooms(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { limit } = req.query;
    const rooms = await roomService.getPopularRooms(parseInt(limit as string) || 10);
    res.json(successResponse(rooms));
  } catch (error) {
    next(error);
  }
}

/**
 * Get room by ID
 */
export async function getRoomById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await roomService.getRoomById(req.params.id);
    res.json(successResponse(room));
  } catch (error) {
    next(error);
  }
}

/**
 * Get room by code
 */
export async function getRoomByCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await roomService.getRoomByCode(req.params.code);
    res.json(successResponse(room));
  } catch (error) {
    next(error);
  }
}

/**
 * Join room by ID
 */
export async function joinRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { password } = req.body;
    const result = await roomMembersService.joinRoom(req.user.id, req.params.id, password);
    res.json(successResponse(result, 'Joined room successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Join room by code
 */
export async function joinRoomByCode(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { roomCode, password } = req.body;
    const result = await roomMembersService.joinRoomByCode(req.user.id, roomCode, password);
    res.json(successResponse(result, 'Joined room successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Leave room
 */
export async function leaveRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await roomMembersService.leaveRoom(req.user.id, req.params.id);
    const message = result.closed ? 'Room closed' : 'Left room successfully';
    res.json(successResponse(result, message));
  } catch (error) {
    next(error);
  }
}

/**
 * Kick player from room
 */
export async function kickPlayer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await roomMembersService.kickPlayer(req.user.id, req.params.id, req.params.userId);
    res.json(successResponse(result, 'Player kicked successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Update room
 */
export async function updateRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await roomService.updateRoom(req.user.id, req.params.id, req.body);
    res.json(successResponse(room, 'Room updated successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete room
 */
export async function deleteRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await roomService.deleteRoom(
      req.user.id,
      req.params.id,
      req.user.role === 'ADMIN'
    );
    res.json(successResponse(result));
  } catch (error) {
    next(error);
  }
}

/**
 * Start game
 */
export async function startGame(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const result = await roomService.startGame(req.user.id, req.params.id);
    res.json(successResponse(result, 'Game started successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's rooms
 */
export async function getMyRooms(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const rooms = await roomService.getUserRooms(req.user.id);
    res.json(successResponse(rooms));
  } catch (error) {
    next(error);
  }
}

/**
 * Set player ready status
 */
export async function setReady(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { isReady } = req.body;
    const member = await roomMembersService.setPlayerReady(req.user.id, req.params.id, isReady);
    res.json(successResponse(member, isReady ? 'You are ready' : 'You are not ready'));
  } catch (error) {
    next(error);
  }
}
