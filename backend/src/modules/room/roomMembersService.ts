/**
 * Room Members Service
 * Business logic for room membership operations (join, leave, kick, ready)
 */

import { prisma } from '../../config/database';
import { ValidationError, NotFoundError, ForbiddenError, ConflictError } from '../../shared/utils/errors';
import { comparePassword } from '../../shared/utils/passwordUtils';
import { emitPlayerJoined, emitRoomUpdated, emitPlayerReady } from '../../socket';
import roomService from './roomService';

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

    // Check room status
    if (room.status !== 'WAITING') {
      throw new ValidationError('Room is not accepting new players');
    }

    // Check if room is full
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

    // Add member to room (upsert handles rejoining after a previous leave)
    const [member] = await prisma.$transaction([
      prisma.roomMember.upsert({
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
      }),
      prisma.room.update({
        where: { id: roomId },
        data: { currentPlayers: { increment: 1 } },
      }),
    ]);

    const updatedRoom = await roomService.getRoomById(roomId);

    // Emit socket event to notify other players
    emitPlayerJoined(roomId, {
      id: member.user.id,
      username: member.user.username,
      displayName: member.user.displayName,
      avatar: member.user.avatar,
      score: member.score,
      isReady: member.isReady,
      role: member.role,
    });

    // Emit room updated event with new player count
    emitRoomUpdated(roomId, { currentPlayers: room.currentPlayers + 1 });

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

    emitPlayerReady(roomId, userId, isReady);

    return updatedMember;
  }
}

export default new RoomMembersService();
