/**
 * Room Controller
 * HTTP request handlers for room operations
 */

import { Response, NextFunction } from 'express';
import roomService from './roomService';
import roomMembersService from './roomMembersService';
import { getSocketRegistry } from '@/socket';
import { successResponse, paginatedResponse } from '@shared/utils/responseFormatter';
import { AuthRequest } from '@shared/types/index';
import { getAuthUser } from '@shared/middleware/getAuthUser';

/**
 * Create a new room
 */
export async function createRoom(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const room = await roomService.createRoom(getAuthUser(req).id, req.body);
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
 * Search rooms by title or code
 */
export async function searchRooms(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q, limit } = req.query;
    const query = (q as string || '').trim();
    if (!query) {
      res.json(successResponse([]));
      return;
    }
    const rooms = await roomService.searchRooms(query, parseInt(limit as string) || 20);
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
    const result = await roomMembersService.joinRoom(getAuthUser(req).id, req.params.id, password);
    const registry = getSocketRegistry();
    if (registry) {
      registry.emitPlayerJoined(req.params.id, {
        id: result.member.user.id,
        username: result.member.user.username,
        displayName: result.member.user.displayName,
        avatar: result.member.user.avatar,
        score: result.member.score,
        isReady: result.member.isReady,
        role: result.member.role,
      });
      registry.emitRoomUpdated(req.params.id, { currentPlayers: result.room.currentPlayers });
      registry.emitRoomListUpdate(req.params.id, result.room.currentPlayers, result.room.status);
    }
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
    const result = await roomMembersService.joinRoomByCode(getAuthUser(req).id, roomCode, password);
    const registry = getSocketRegistry();
    if (registry) {
      registry.emitPlayerJoined(result.room.id, {
        id: result.member.user.id,
        username: result.member.user.username,
        displayName: result.member.user.displayName,
        avatar: result.member.user.avatar,
        score: result.member.score,
        isReady: result.member.isReady,
        role: result.member.role,
      });
      registry.emitRoomUpdated(result.room.id, { currentPlayers: result.room.currentPlayers });
      registry.emitRoomListUpdate(result.room.id, result.room.currentPlayers, result.room.status);
    }
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
    const result = await roomMembersService.leaveRoom(getAuthUser(req).id, req.params.id);
    const registry = getSocketRegistry();
    if (registry) {
      if (result.closed) {
        registry.emitRoomClosed(req.params.id, 'Host ended the room');
      } else {
        registry.emitPlayerLeft(req.params.id, getAuthUser(req).id);
      }
      registry.emitRoomListUpdate(req.params.id, result.currentPlayers, result.status);
    }

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
    const result = await roomMembersService.kickPlayer(getAuthUser(req).id, req.params.id, req.params.userId);
    const registry = getSocketRegistry();
    if (registry) {
      registry.emitPlayerKicked(req.params.id, req.params.userId, 'Kicked by room host');
      registry.emitRoomListUpdate(req.params.id, result.currentPlayers, result.status);
    }
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
    const room = await roomService.updateRoom(getAuthUser(req).id, req.params.id, req.body);
    getSocketRegistry()?.emitRoomUpdated(req.params.id, req.body);
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
    getSocketRegistry()?.emitRoomClosed(req.params.id, 'Room deleted by host');
    const result = await roomService.deleteRoom(
      getAuthUser(req).id,
      req.params.id,
      getAuthUser(req).role === 'ADMIN'
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
    const result = await roomMembersService.startGame(getAuthUser(req).id, req.params.id);
    getSocketRegistry()?.emitGameStarted(req.params.id);
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
    const rooms = await roomService.getUserRooms(getAuthUser(req).id);
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
    const member = await roomMembersService.setPlayerReady(getAuthUser(req).id, req.params.id, isReady);
    getSocketRegistry()?.emitPlayerReady(req.params.id, getAuthUser(req).id, isReady);
    res.json(successResponse(member, isReady ? 'You are ready' : 'You are not ready'));
  } catch (error) {
    next(error);
  }
}
