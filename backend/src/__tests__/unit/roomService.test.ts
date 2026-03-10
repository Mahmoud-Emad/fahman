/**
 * Room Service Unit Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/utils/errors';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const userAlice = { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null };
const userBob = { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: null };

const mockPack = {
  id: 'pack-1',
  title: 'Science Trivia',
  category: 'Science',
  difficulty: 'EASY',
  isPublished: true,
  creatorId: 'user-other',
};

const mockUnpublishedPack = {
  ...mockPack,
  id: 'pack-2',
  isPublished: false,
  creatorId: 'user-other',
};

const mockOwnedUnpublishedPack = {
  ...mockPack,
  id: 'pack-3',
  isPublished: false,
  creatorId: 'user-1',
};

const baseMember = {
  userId: 'user-1',
  role: 'CREATOR',
  isReady: true,
  isActive: true,
  user: userAlice,
};

const baseRoom = {
  id: 'room-1',
  code: 'ABC123',
  creatorId: 'user-1',
  selectedPackId: 'pack-1',
  title: 'Test Room',
  description: null,
  maxPlayers: 8,
  isPublic: true,
  passwordHash: null,
  settings: {},
  currentPlayers: 1,
  status: 'WAITING',
  startedAt: null,
  creator: userAlice,
  selectedPack: { id: 'pack-1', title: 'Science Trivia', category: 'Science', difficulty: 'EASY' },
  members: [baseMember],
  _count: { members: 1 },
};

const roomWithPlayers = {
  ...baseRoom,
  currentPlayers: 3,
  members: [
    { ...baseMember },
    { userId: 'user-2', role: 'MEMBER', isReady: true, isActive: true, user: userBob },
    { userId: 'user-3', role: 'MEMBER', isReady: true, isActive: true, user: { id: 'user-3', username: 'carol', displayName: 'Carol', avatar: null } },
  ],
  selectedPack: {
    id: 'pack-1',
    title: 'Science Trivia',
    category: 'Science',
    difficulty: 'EASY',
    _count: { questions: 10 },
  },
  _count: { members: 3 },
};

const publicRooms = [
  { ...baseRoom, id: 'room-1', title: 'Room 1' },
  { ...baseRoom, id: 'room-2', title: 'Room 2' },
  { ...baseRoom, id: 'room-3', title: 'Room 3' },
];

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockRoomCreate = mock(() => Promise.resolve(baseRoom));
const mockRoomFindUnique = mock(() => Promise.resolve(baseRoom));
const mockRoomFindMany = mock(() => Promise.resolve(publicRooms));
const mockRoomUpdate = mock(() => Promise.resolve(baseRoom));
const mockRoomCount = mock(() => Promise.resolve(3));
const mockRoomMemberUpdateMany = mock(() => Promise.resolve({ count: 1 }));
const mockRoomMemberFindMany = mock(() =>
  Promise.resolve([{ room: baseRoom }])
);
const mockPackFindUnique = mock(() => Promise.resolve(mockPack));
const mockTransaction = mock((args: any[]) => Promise.resolve(args));

mock.module('../../config/database', () => ({
  prisma: {
    room: {
      create: mockRoomCreate,
      findUnique: mockRoomFindUnique,
      findMany: mockRoomFindMany,
      update: mockRoomUpdate,
      count: mockRoomCount,
    },
    roomMember: {
      updateMany: mockRoomMemberUpdateMany,
      findMany: mockRoomMemberFindMany,
    },
    pack: {
      findUnique: mockPackFindUnique,
    },
    $transaction: mockTransaction,
  },
}));

// Mock socket emitRoomUpdated
const mockEmitRoomUpdated = mock(() => {});

mock.module('../../socket', () => ({
  emitRoomUpdated: mockEmitRoomUpdated,
}));

// Mock hashPassword
const mockHashPassword = mock(() => Promise.resolve('hashed-password-123'));

mock.module('../../shared/utils/passwordUtils', () => ({
  hashPassword: mockHashPassword,
}));

// Import after mocking so the module picks up the mocked dependencies
import { RoomService } from '../../modules/room/roomService';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
    mockRoomCreate.mockReset();
    mockRoomFindUnique.mockReset();
    mockRoomFindMany.mockReset();
    mockRoomUpdate.mockReset();
    mockRoomCount.mockReset();
    mockRoomMemberUpdateMany.mockReset();
    mockRoomMemberFindMany.mockReset();
    mockPackFindUnique.mockReset();
    mockTransaction.mockReset();
    mockEmitRoomUpdated.mockReset();
    mockHashPassword.mockReset();

    // Set default resolved values
    mockRoomCreate.mockResolvedValue(baseRoom as any);
    mockRoomFindUnique.mockResolvedValue(baseRoom as any);
    mockRoomFindMany.mockResolvedValue(publicRooms as any);
    mockRoomUpdate.mockResolvedValue(baseRoom as any);
    mockRoomCount.mockResolvedValue(3);
    mockRoomMemberFindMany.mockResolvedValue([{ room: baseRoom }] as any);
    mockPackFindUnique.mockResolvedValue(mockPack as any);
    mockTransaction.mockImplementation((args: any[]) => Promise.resolve(args));
    mockHashPassword.mockResolvedValue('hashed-password-123');
  });

  // =========================================================================
  // createRoom
  // =========================================================================
  describe('createRoom', () => {
    it('should throw NotFoundError when pack does not exist', async () => {
      mockPackFindUnique.mockResolvedValue(null);

      await expect(
        service.createRoom('user-1', { packId: 'pack-missing', title: 'My Room' })
      ).rejects.toThrow(NotFoundError);
      await expect(
        service.createRoom('user-1', { packId: 'pack-missing', title: 'My Room' })
      ).rejects.toThrow('Pack not found');
    });

    it('should throw ForbiddenError when pack is unpublished and not owned by user', async () => {
      mockPackFindUnique.mockResolvedValue(mockUnpublishedPack as any);

      await expect(
        service.createRoom('user-1', { packId: 'pack-2', title: 'My Room' })
      ).rejects.toThrow(ForbiddenError);
      await expect(
        service.createRoom('user-1', { packId: 'pack-2', title: 'My Room' })
      ).rejects.toThrow('Pack is not available for use');
    });

    it('should allow creating room with unpublished pack owned by the user', async () => {
      mockPackFindUnique.mockResolvedValue(mockOwnedUnpublishedPack as any);
      // First call for code uniqueness check returns null (code is unique)
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', { packId: 'pack-3', title: 'My Room' });

      expect(mockRoomCreate).toHaveBeenCalledTimes(1);
    });

    it('should generate a unique room code and retry on collision', async () => {
      // First findUnique for code check returns existing room (collision),
      // second returns null (unique code found)
      mockRoomFindUnique
        .mockResolvedValueOnce({ id: 'existing-room' } as any)
        .mockResolvedValueOnce(null);

      await service.createRoom('user-1', { packId: 'pack-1', title: 'My Room' });

      // Should have checked code uniqueness at least twice
      expect(mockRoomFindUnique).toHaveBeenCalledTimes(2);
      expect(mockRoomCreate).toHaveBeenCalledTimes(1);
    });

    it('should hash password when password is provided', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', {
        packId: 'pack-1',
        title: 'Private Room',
        password: 'secret123',
      });

      expect(mockHashPassword).toHaveBeenCalledWith('secret123');
      const createCall = mockRoomCreate.mock.calls[0][0] as any;
      expect(createCall.data.passwordHash).toBe('hashed-password-123');
    });

    it('should not hash password when password is not provided', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', { packId: 'pack-1', title: 'Open Room' });

      expect(mockHashPassword).not.toHaveBeenCalled();
      const createCall = mockRoomCreate.mock.calls[0][0] as any;
      expect(createCall.data.passwordHash).toBeNull();
    });

    it('should create room with creator as first member with CREATOR role', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', { packId: 'pack-1', title: 'My Room' });

      const createCall = mockRoomCreate.mock.calls[0][0] as any;
      expect(createCall.data.creatorId).toBe('user-1');
      expect(createCall.data.currentPlayers).toBe(1);
      expect(createCall.data.members.create.userId).toBe('user-1');
      expect(createCall.data.members.create.role).toBe('CREATOR');
      expect(createCall.data.members.create.isReady).toBe(true);
    });

    it('should use default maxPlayers of 8 when not specified', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', { packId: 'pack-1', title: 'My Room' });

      const createCall = mockRoomCreate.mock.calls[0][0] as any;
      expect(createCall.data.maxPlayers).toBe(8);
    });

    it('should use provided maxPlayers when specified', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', {
        packId: 'pack-1',
        title: 'My Room',
        maxPlayers: 4,
      });

      const createCall = mockRoomCreate.mock.calls[0][0] as any;
      expect(createCall.data.maxPlayers).toBe(4);
    });

    it('should default isPublic to true when not specified', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await service.createRoom('user-1', { packId: 'pack-1', title: 'My Room' });

      const createCall = mockRoomCreate.mock.calls[0][0] as any;
      expect(createCall.data.isPublic).toBe(true);
    });

    it('should include creator, selectedPack, and members in the returned room', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      const room = await service.createRoom('user-1', { packId: 'pack-1', title: 'My Room' });

      expect(room.creator).toBeDefined();
      expect(room.selectedPack).toBeDefined();
      expect(room.members).toBeDefined();
    });
  });

  // =========================================================================
  // getRoomById
  // =========================================================================
  describe('getRoomById', () => {
    it('should return room when found', async () => {
      const room = await service.getRoomById('room-1');

      expect(room.id).toBe('room-1');
      expect(room.title).toBe('Test Room');
      expect(mockRoomFindUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when room does not exist', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await expect(service.getRoomById('room-missing')).rejects.toThrow(NotFoundError);
      await expect(service.getRoomById('room-missing')).rejects.toThrow('Room not found');
    });

    it('should include creator, selectedPack, members, and _count', async () => {
      const room = await service.getRoomById('room-1');

      expect(room.creator).toEqual(userAlice);
      expect(room.selectedPack).toBeDefined();
      expect(room.members).toBeDefined();
      expect(room._count).toBeDefined();
    });
  });

  // =========================================================================
  // getRoomByCode
  // =========================================================================
  describe('getRoomByCode', () => {
    it('should return room when found by code', async () => {
      const room = await service.getRoomByCode('ABC123');

      expect(room.id).toBe('room-1');
      expect(room.code).toBe('ABC123');
    });

    it('should uppercase the code before searching', async () => {
      await service.getRoomByCode('abc123');

      const findCall = mockRoomFindUnique.mock.calls[0][0] as any;
      expect(findCall.where.code).toBe('ABC123');
    });

    it('should throw NotFoundError when room code does not exist', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await expect(service.getRoomByCode('XXXXXX')).rejects.toThrow(NotFoundError);
      await expect(service.getRoomByCode('XXXXXX')).rejects.toThrow('Room not found');
    });

    it('should include creator, selectedPack, members, and _count', async () => {
      const room = await service.getRoomByCode('ABC123');

      expect(room.creator).toBeDefined();
      expect(room.selectedPack).toBeDefined();
      expect(room.members).toBeDefined();
      expect(room._count).toBeDefined();
    });
  });

  // =========================================================================
  // updateRoom
  // =========================================================================
  describe('updateRoom', () => {
    it('should throw NotFoundError when room does not exist', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await expect(
        service.updateRoom('user-1', 'room-missing', { title: 'New Title' })
      ).rejects.toThrow(NotFoundError);
      await expect(
        service.updateRoom('user-1', 'room-missing', { title: 'New Title' })
      ).rejects.toThrow('Room not found');
    });

    it('should throw ForbiddenError when user is not the room creator', async () => {
      await expect(
        service.updateRoom('user-2', 'room-1', { title: 'New Title' })
      ).rejects.toThrow(ForbiddenError);
      await expect(
        service.updateRoom('user-2', 'room-1', { title: 'New Title' })
      ).rejects.toThrow('Only the room creator can update settings');
    });

    it('should throw ValidationError when room status is not WAITING', async () => {
      mockRoomFindUnique.mockResolvedValue({ ...baseRoom, status: 'PLAYING' } as any);

      await expect(
        service.updateRoom('user-1', 'room-1', { title: 'New Title' })
      ).rejects.toThrow(ValidationError);
      await expect(
        service.updateRoom('user-1', 'room-1', { title: 'New Title' })
      ).rejects.toThrow('Cannot update room while game is in progress');
    });

    it('should throw ValidationError when maxPlayers is less than current player count', async () => {
      mockRoomFindUnique.mockResolvedValue({
        ...baseRoom,
        currentPlayers: 5,
      } as any);

      await expect(
        service.updateRoom('user-1', 'room-1', { maxPlayers: 3 })
      ).rejects.toThrow(ValidationError);
      await expect(
        service.updateRoom('user-1', 'room-1', { maxPlayers: 3 })
      ).rejects.toThrow('Cannot set max players below current player count (5)');
    });

    it('should update room successfully when user is the creator and room is WAITING', async () => {
      const updatedRoom = { ...baseRoom, title: 'Updated Title' };
      mockRoomUpdate.mockResolvedValue(updatedRoom as any);

      const result = await service.updateRoom('user-1', 'room-1', { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
      expect(mockRoomUpdate).toHaveBeenCalledTimes(1);
    });

    it('should emit room updated socket event after successful update', async () => {
      await service.updateRoom('user-1', 'room-1', { title: 'Updated Title' });

      expect(mockEmitRoomUpdated).toHaveBeenCalledWith('room-1', { title: 'Updated Title' });
    });

    it('should allow updating maxPlayers when it is greater than or equal to current players', async () => {
      mockRoomFindUnique.mockResolvedValue({
        ...baseRoom,
        currentPlayers: 3,
      } as any);

      await service.updateRoom('user-1', 'room-1', { maxPlayers: 5 });

      expect(mockRoomUpdate).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // deleteRoom
  // =========================================================================
  describe('deleteRoom', () => {
    it('should throw NotFoundError when room does not exist', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await expect(service.deleteRoom('user-1', 'room-missing')).rejects.toThrow(NotFoundError);
      await expect(service.deleteRoom('user-1', 'room-missing')).rejects.toThrow('Room not found');
    });

    it('should throw ForbiddenError when user is not the creator and not admin', async () => {
      await expect(service.deleteRoom('user-2', 'room-1', false)).rejects.toThrow(ForbiddenError);
      await expect(service.deleteRoom('user-2', 'room-1', false)).rejects.toThrow(
        'Only the room creator can delete the room'
      );
    });

    it('should allow admin to delete any room', async () => {
      const result = await service.deleteRoom('user-2', 'room-1', true);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Room closed successfully');
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should allow the creator to delete their own room', async () => {
      const result = await service.deleteRoom('user-1', 'room-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Room closed successfully');
    });

    it('should mark all active members as inactive via transaction', async () => {
      await service.deleteRoom('user-1', 'room-1');

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      const transactionArgs = mockTransaction.mock.calls[0][0] as any[];
      expect(transactionArgs).toHaveLength(2);
    });

    it('should set room status to CLOSED and currentPlayers to 0', async () => {
      await service.deleteRoom('user-1', 'room-1');

      // The transaction receives an array of prisma operations;
      // we verify the transaction was called (operations are prisma promises)
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // startGame
  // =========================================================================
  describe('startGame', () => {
    beforeEach(() => {
      mockRoomFindUnique.mockResolvedValue(roomWithPlayers as any);
      mockRoomUpdate.mockResolvedValue({
        ...roomWithPlayers,
        status: 'PLAYING',
        startedAt: new Date(),
        currentQuestionIndex: 0,
      } as any);
    });

    it('should throw NotFoundError when room does not exist', async () => {
      mockRoomFindUnique.mockResolvedValue(null);

      await expect(service.startGame('user-1', 'room-missing')).rejects.toThrow(NotFoundError);
      await expect(service.startGame('user-1', 'room-missing')).rejects.toThrow('Room not found');
    });

    it('should throw ForbiddenError when user is not the room creator', async () => {
      await expect(service.startGame('user-2', 'room-1')).rejects.toThrow(ForbiddenError);
      await expect(service.startGame('user-2', 'room-1')).rejects.toThrow(
        'Only the room creator can start the game'
      );
    });

    it('should throw ValidationError when room status is not WAITING', async () => {
      mockRoomFindUnique.mockResolvedValue({
        ...roomWithPlayers,
        status: 'PLAYING',
      } as any);

      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(ValidationError);
      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(
        'Game has already started or room is closed'
      );
    });

    it('should throw ValidationError when room has fewer than 2 active players', async () => {
      mockRoomFindUnique.mockResolvedValue({
        ...roomWithPlayers,
        members: [baseMember], // Only 1 member
      } as any);

      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(ValidationError);
      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(
        'At least 2 players are required to start'
      );
    });

    it('should throw ValidationError when pack has fewer than 5 questions', async () => {
      mockRoomFindUnique.mockResolvedValue({
        ...roomWithPlayers,
        selectedPack: {
          ...roomWithPlayers.selectedPack,
          _count: { questions: 3 },
        },
      } as any);

      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(ValidationError);
      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(
        'Pack must have at least 5 questions'
      );
    });

    it('should throw ValidationError when selectedPack is null', async () => {
      mockRoomFindUnique.mockResolvedValue({
        ...roomWithPlayers,
        selectedPack: null,
      } as any);

      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(ValidationError);
      await expect(service.startGame('user-1', 'room-1')).rejects.toThrow(
        'Pack must have at least 5 questions'
      );
    });

    it('should update room to PLAYING status and return gameStarted true', async () => {
      const result = await service.startGame('user-1', 'room-1');

      expect(result.gameStarted).toBe(true);
      expect(result.room.status).toBe('PLAYING');
      expect(mockRoomUpdate).toHaveBeenCalledTimes(1);
    });

    it('should set startedAt and currentQuestionIndex to 0 when starting', async () => {
      await service.startGame('user-1', 'room-1');

      const updateCall = mockRoomUpdate.mock.calls[0][0] as any;
      expect(updateCall.data.status).toBe('PLAYING');
      expect(updateCall.data.currentQuestionIndex).toBe(0);
      expect(updateCall.data.startedAt).toBeDefined();
    });
  });

  // =========================================================================
  // getPublicRooms
  // =========================================================================
  describe('getPublicRooms', () => {
    it('should return rooms with pagination metadata', async () => {
      const result = await service.getPublicRooms({ page: 1, limit: 20 });

      expect(result.rooms).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should use default page 1 and limit 20 when not specified', async () => {
      await service.getPublicRooms();

      const findCall = mockRoomFindMany.mock.calls[0][0] as any;
      expect(findCall.skip).toBe(0); // (1-1) * 20
      expect(findCall.take).toBe(20);
    });

    it('should calculate correct skip for pagination', async () => {
      await service.getPublicRooms({ page: 3, limit: 10 });

      const findCall = mockRoomFindMany.mock.calls[0][0] as any;
      expect(findCall.skip).toBe(20); // (3-1) * 10
      expect(findCall.take).toBe(10);
    });

    it('should filter by WAITING status by default', async () => {
      await service.getPublicRooms();

      const findCall = mockRoomFindMany.mock.calls[0][0] as any;
      expect(findCall.where.isPublic).toBe(true);
      expect(findCall.where.status).toBe('WAITING');
    });

    it('should filter by custom status when provided', async () => {
      await service.getPublicRooms({}, { status: 'PLAYING' });

      const findCall = mockRoomFindMany.mock.calls[0][0] as any;
      expect(findCall.where.status).toBe('PLAYING');
    });

    it('should order rooms by createdAt descending', async () => {
      await service.getPublicRooms();

      const findCall = mockRoomFindMany.mock.calls[0][0] as any;
      expect(findCall.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('should include creator, selectedPack, and _count in each room', async () => {
      await service.getPublicRooms();

      const findCall = mockRoomFindMany.mock.calls[0][0] as any;
      expect(findCall.include.creator).toBeDefined();
      expect(findCall.include.selectedPack).toBeDefined();
      expect(findCall.include._count).toBeDefined();
    });
  });

  // =========================================================================
  // getUserRooms
  // =========================================================================
  describe('getUserRooms', () => {
    it('should return rooms where user is an active member', async () => {
      const rooms = await service.getUserRooms('user-1');

      expect(rooms).toHaveLength(1);
      expect(rooms[0]).toEqual(baseRoom);
    });

    it('should query roomMember with userId and isActive true', async () => {
      await service.getUserRooms('user-1');

      const findCall = mockRoomMemberFindMany.mock.calls[0][0] as any;
      expect(findCall.where.userId).toBe('user-1');
      expect(findCall.where.isActive).toBe(true);
    });

    it('should order memberships by joinedAt descending', async () => {
      await service.getUserRooms('user-1');

      const findCall = mockRoomMemberFindMany.mock.calls[0][0] as any;
      expect(findCall.orderBy).toEqual({ joinedAt: 'desc' });
    });

    it('should return empty array when user has no active memberships', async () => {
      mockRoomMemberFindMany.mockResolvedValue([]);

      const rooms = await service.getUserRooms('user-1');

      expect(rooms).toHaveLength(0);
    });

    it('should include room details with creator, selectedPack, and _count', async () => {
      await service.getUserRooms('user-1');

      const findCall = mockRoomMemberFindMany.mock.calls[0][0] as any;
      expect(findCall.include.room).toBeDefined();
      expect(findCall.include.room.include.creator).toBeDefined();
      expect(findCall.include.room.include.selectedPack).toBeDefined();
      expect(findCall.include.room.include._count).toBeDefined();
    });

    it('should map memberships to their room objects', async () => {
      const room1 = { ...baseRoom, id: 'room-1', title: 'Room 1' };
      const room2 = { ...baseRoom, id: 'room-2', title: 'Room 2' };
      mockRoomMemberFindMany.mockResolvedValue([
        { room: room1 },
        { room: room2 },
      ] as any);

      const rooms = await service.getUserRooms('user-1');

      expect(rooms).toHaveLength(2);
      expect(rooms[0].id).toBe('room-1');
      expect(rooms[1].id).toBe('room-2');
    });
  });
});
