/**
 * Room Members Service
 * Business logic for room membership operations (join, leave, kick, ready)
 */

import { prisma } from '@config/database';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '@shared/utils/errors';
import { comparePassword } from '@shared/utils/passwordUtils';
import roomCoreService from './roomCoreService';

export class RoomMembersService {
  /**
   * Join a room
   */
  async joinRoom(userId: string, roomId: string, password?: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { userId, isActive: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if already a member
    if (room.members.length > 0) {
      throw new ConflictError('You are already in this room');
    }

    // Check room status (early exit before password check / DB write)
    if (room.status !== 'WAITING') {
      throw new ValidationError('Room is not accepting new players');
    }

    if (room.currentPlayers >= room.maxPlayers) {
      throw new ValidationError('Room is full');
    }

    // Check password for private rooms
    if (!room.isPublic && room.passwordHash) {
      if (!password) {
        throw new ValidationError('Password required to join this room');
      }
      const isValid = await comparePassword(password, room.passwordHash);
      if (!isValid) {
        throw new ValidationError('Invalid room password');
      }
    }

    // Atomic: increment currentPlayers only if room is still WAITING and not full.
    // This eliminates the TOCTOU race between the check above and the write below.
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.room.updateMany({
        where: {
          id: roomId,
          status: 'WAITING',
          currentPlayers: { lt: room.maxPlayers },
        },
        data: { currentPlayers: { increment: 1 } },
      });

      if (updated.count === 0) {
        throw new ValidationError('Room is full or no longer accepting players');
      }

      const member = await tx.roomMember.upsert({
        where: { roomId_userId: { roomId, userId } },
        create: {
          roomId,
          userId,
          role: 'MEMBER',
        },
        update: {
          isActive: true,
          leftAt: null,
          score: 0,
          isReady: false,
          role: 'MEMBER',
        },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
        },
      });

      return member;
    });

    const member = result;

    const updatedRoom = await roomCoreService.getRoomById(roomId);

    return { room: updatedRoom, member };
  }

  /**
   * Join a room by code
   */
  async joinRoomByCode(userId: string, code: string, password?: string) {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return this.joinRoom(userId, room.id, password);
  }

  /**
   * Leave a room
   */
  async leaveRoom(userId: string, roomId: string) {
    const member = await prisma.roomMember.findFirst({
      where: { roomId, userId, isActive: true },
    });

    if (!member) {
      throw new NotFoundError('You are not in this room');
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // If creator is leaving, close the room regardless of status
    if (room.creatorId === userId) {
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
      return { closed: true, currentPlayers: 0, status: 'CLOSED' };
    }

    // Regular member leaving
    const newPlayerCount = Math.max(0, room.currentPlayers - 1);
    await prisma.$transaction([
      prisma.roomMember.update({
        where: { id: member.id },
        data: { isActive: false, leftAt: new Date() },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { currentPlayers: { decrement: 1 } },
      }),
    ]);

    return { closed: false, currentPlayers: newPlayerCount, status: room.status };
  }

  /**
   * Kick a player from the room
   */
  async kickPlayer(creatorId: string, roomId: string, targetUserId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    // Check if requester is the creator
    if (room.creatorId !== creatorId) {
      throw new ForbiddenError('Only the room creator can kick players');
    }

    // Can't kick yourself
    if (creatorId === targetUserId) {
      throw new ValidationError('You cannot kick yourself');
    }

    const member = await prisma.roomMember.findFirst({
      where: { roomId, userId: targetUserId, isActive: true },
    });

    if (!member) {
      throw new NotFoundError('Player not found in this room');
    }

    const newPlayerCount = Math.max(0, room.currentPlayers - 1);
    await prisma.$transaction([
      prisma.roomMember.update({
        where: { id: member.id },
        data: { isActive: false, leftAt: new Date() },
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { currentPlayers: { decrement: 1 } },
      }),
    ]);

    return { success: true, currentPlayers: newPlayerCount, status: room.status };
  }

  /**
   * Set player ready status
   */
  async setPlayerReady(userId: string, roomId: string, isReady: boolean) {
    const member = await prisma.roomMember.findFirst({
      where: { roomId, userId, isActive: true },
    });

    if (!member) {
      throw new NotFoundError('You are not in this room');
    }

    const updatedMember = await prisma.roomMember.update({
      where: { id: member.id },
      data: { isReady },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return updatedMember;
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
}

export default new RoomMembersService();
