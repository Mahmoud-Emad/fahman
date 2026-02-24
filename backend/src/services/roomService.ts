/**
 * Room Service
 * Business logic for room management
 */

import { prisma } from '../config/database';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { PaginationParams, RoomSettings } from '../types';
import { hashPassword } from '../utils/passwordUtils';
import { emitRoomUpdated } from '../socket';

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars like 0, O, I, 1
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export class RoomService {
  /**
   * Create a new room
   */
  async createRoom(userId: string, roomData: {
    packId: string;
    title: string;
    description?: string;
    maxPlayers?: number;
    isPublic?: boolean;
    password?: string;
    settings?: RoomSettings;
  }) {
    // Verify pack exists and is accessible
    const pack = await prisma.pack.findUnique({
      where: { id: roomData.packId },
    });

    if (!pack) {
      throw new NotFoundError('Pack not found');
    }

    // Check if pack is published or belongs to creator
    if (!pack.isPublished && pack.creatorId !== userId) {
      throw new ForbiddenError('Pack is not available for use');
    }

    // Generate unique room code
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    if (attempts >= 10) {
      throw new Error('Failed to generate unique room code');
    }

    // Hash password if provided
    const passwordHash = roomData.password
      ? await hashPassword(roomData.password)
      : null;

    // Create room with creator as first member
    const room = await prisma.room.create({
      data: {
        code,
        creatorId: userId,
        selectedPackId: roomData.packId,
        title: roomData.title,
        description: roomData.description,
        maxPlayers: roomData.maxPlayers || 8,
        isPublic: roomData.isPublic ?? true,
        passwordHash,
        settings: roomData.settings || {},
        currentPlayers: 1,
        members: {
          create: {
            userId,
            role: 'CREATOR',
            isReady: true,
          },
        },
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        selectedPack: {
          select: { id: true, title: true, category: true, difficulty: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return room;
  }

  /**
   * Get public rooms with pagination
   */
  async getPublicRooms(pagination: PaginationParams = {}, filters: { status?: string } = {}) {
    const { page = 1, limit = 20 } = pagination;
    const { status } = filters;

    const where: any = {
      isPublic: true,
      status: status || 'WAITING',
    };

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          selectedPack: {
            select: { id: true, title: true, category: true, difficulty: true },
          },
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.room.count({ where }),
    ]);

    return { rooms, total, page, limit };
  }

  /**
   * Get popular/active rooms
   */
  async getPopularRooms(limit: number = 10) {
    return await prisma.room.findMany({
      where: {
        isPublic: true,
        status: 'WAITING',
      },
      take: limit,
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        selectedPack: {
          select: { id: true, title: true, category: true, difficulty: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: [
        { currentPlayers: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get room by ID
   */
  async getRoomById(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        selectedPack: {
          include: {
            questions: {
              orderBy: { orderIndex: 'asc' },
            },
            _count: {
              select: { questions: true },
            },
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
          orderBy: { score: 'desc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return room;
  }

  /**
   * Get room by code
   */
  async getRoomByCode(code: string) {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        selectedPack: {
          select: { id: true, title: true, category: true, difficulty: true },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return room;
  }

  /**
   * Update room settings
   */
  async updateRoom(userId: string, roomId: string, updateData: {
    title?: string;
    description?: string;
    maxPlayers?: number;
    isPublic?: boolean;
    settings?: RoomSettings;
  }) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.creatorId !== userId) {
      throw new ForbiddenError('Only the room creator can update settings');
    }

    if (room.status !== 'WAITING') {
      throw new ValidationError('Cannot update room while game is in progress');
    }

    // Validate maxPlayers doesn't go below current players
    if (updateData.maxPlayers && updateData.maxPlayers < room.currentPlayers) {
      throw new ValidationError(`Cannot set max players below current player count (${room.currentPlayers})`);
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        selectedPack: {
          select: { id: true, title: true, category: true, difficulty: true },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    emitRoomUpdated(roomId, updateData);

    return updatedRoom;
  }

  /**
   * Delete/close a room
   */
  async deleteRoom(userId: string, roomId: string, isAdmin: boolean = false) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.creatorId !== userId && !isAdmin) {
      throw new ForbiddenError('Only the room creator can delete the room');
    }

    // Mark all members as inactive and close room
    await prisma.$transaction([
      prisma.roomMember.updateMany({
        where: { roomId, isActive: true },
        data: { isActive: false, leftAt: new Date() },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { status: 'CLOSED', currentPlayers: 0 },
      }),
    ]);

    return { success: true, message: 'Room closed successfully' };
  }

  /**
   * Start the game
   */
  async startGame(userId: string, roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: { where: { isActive: true } },
        selectedPack: {
          include: { _count: { select: { questions: true } } },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (room.creatorId !== userId) {
      throw new ForbiddenError('Only the room creator can start the game');
    }

    if (room.status !== 'WAITING') {
      throw new ValidationError('Game has already started or room is closed');
    }

    if (room.members.length < 2) {
      throw new ValidationError('At least 2 players are required to start');
    }

    if (!room.selectedPack || room.selectedPack._count.questions < 5) {
      throw new ValidationError('Pack must have at least 5 questions');
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        status: 'PLAYING',
        startedAt: new Date(),
        currentQuestionIndex: 0,
      },
      include: {
        creator: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        selectedPack: {
          include: {
            questions: { orderBy: { orderIndex: 'asc' } },
          },
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
          },
        },
      },
    });

    return { room: updatedRoom, gameStarted: true };
  }

  /**
   * Get user's active rooms
   */
  async getUserRooms(userId: string) {
    const memberships = await prisma.roomMember.findMany({
      where: { userId, isActive: true },
      include: {
        room: {
          include: {
            creator: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
            selectedPack: {
              select: { id: true, title: true, category: true, difficulty: true, imageUrl: true },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => m.room);
  }
}

export default new RoomService();
