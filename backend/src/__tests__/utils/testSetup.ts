/**
 * Test Setup and Utilities
 * Common test helpers, mocks, and fixtures for Bun test runner
 */

import { mock } from 'bun:test';

// Create mock functions
function createMockFn() {
  const fn = mock(() => Promise.resolve());
  return fn;
}

// Mock Prisma client
export const mockPrismaClient = {
  user: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  room: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  roomMember: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    updateMany: createMockFn(),
    delete: createMockFn(),
    deleteMany: createMockFn(),
    count: createMockFn(),
  },
  pack: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  question: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  playerAnswer: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  friendship: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  message: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    updateMany: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  notification: {
    findUnique: createMockFn(),
    findFirst: createMockFn(),
    findMany: createMockFn(),
    create: createMockFn(),
    update: createMockFn(),
    updateMany: createMockFn(),
    delete: createMockFn(),
    count: createMockFn(),
  },
  $transaction: createMockFn(),
};

// Test fixtures
export const testUsers = {
  user1: {
    id: 'user-1-uuid',
    gameId: 100001,
    username: 'testuser1',
    displayName: 'Test User 1',
    email: 'test1@example.com',
    passwordHash: '$2b$10$hashedpassword',
    avatar: 'https://example.com/avatar1.png',
    phoneNumber: null,
    phoneVerified: false,
    authProvider: 'LOCAL',
    role: 'NORMAL',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  user2: {
    id: 'user-2-uuid',
    gameId: 100002,
    username: 'testuser2',
    displayName: 'Test User 2',
    email: 'test2@example.com',
    passwordHash: '$2b$10$hashedpassword',
    avatar: 'https://example.com/avatar2.png',
    phoneNumber: null,
    phoneVerified: false,
    authProvider: 'LOCAL',
    role: 'NORMAL',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  user3: {
    id: 'user-3-uuid',
    gameId: 100003,
    username: 'testuser3',
    displayName: 'Test User 3',
    email: 'test3@example.com',
    passwordHash: '$2b$10$hashedpassword',
    avatar: null,
    phoneNumber: null,
    phoneVerified: false,
    authProvider: 'LOCAL',
    role: 'NORMAL',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const testPacks = {
  pack1: {
    id: 'pack-1-uuid',
    creatorId: testUsers.user1.id,
    title: 'Test Quiz Pack',
    description: 'A test pack for unit tests',
    isStandard: false,
    visibility: 'PUBLIC',
    price: 0,
    category: 'General',
    difficulty: 'MEDIUM',
    timesPlayed: 0,
    rating: 0,
    isPublished: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const testQuestions = {
  question1: {
    id: 'question-1-uuid',
    packId: testPacks.pack1.id,
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswers: [1], // Index 1 = '4'
    questionType: 'SINGLE',
    mediaUrl: null,
    mediaType: null,
    timeLimit: 30,
    points: 100,
    orderIndex: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  question2: {
    id: 'question-2-uuid',
    packId: testPacks.pack1.id,
    text: 'Which are prime numbers?',
    options: ['2', '4', '5', '6'],
    correctAnswers: [0, 2], // Indices 0 and 2 = '2' and '5'
    questionType: 'MULTIPLE',
    mediaUrl: null,
    mediaType: null,
    timeLimit: 30,
    points: 150,
    orderIndex: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  question3: {
    id: 'question-3-uuid',
    packId: testPacks.pack1.id,
    text: 'Is the sky blue?',
    options: ['True', 'False'],
    correctAnswers: [0],
    questionType: 'TRUE_FALSE',
    mediaUrl: null,
    mediaType: null,
    timeLimit: 15,
    points: 50,
    orderIndex: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const testRooms = {
  room1: {
    id: 'room-1-uuid',
    code: 'ABC123',
    creatorId: testUsers.user1.id,
    title: 'Test Room',
    description: 'A test room',
    isPublic: true,
    passwordHash: null,
    maxPlayers: 8,
    currentPlayers: 2,
    status: 'WAITING',
    settings: {},
    selectedPackId: testPacks.pack1.id,
    currentQuestionIndex: 0,
    startedAt: null,
    finishedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  playingRoom: {
    id: 'room-2-uuid',
    code: 'XYZ789',
    creatorId: testUsers.user1.id,
    title: 'Playing Room',
    description: 'A room in playing state',
    isPublic: true,
    passwordHash: null,
    maxPlayers: 8,
    currentPlayers: 2,
    status: 'PLAYING',
    settings: {},
    selectedPackId: testPacks.pack1.id,
    currentQuestionIndex: 0,
    startedAt: new Date('2024-01-01T10:00:00'),
    finishedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

export const testRoomMembers = {
  member1: {
    id: 'member-1-uuid',
    roomId: testRooms.room1.id,
    userId: testUsers.user1.id,
    role: 'CREATOR',
    score: 0,
    isReady: true,
    isActive: true,
    joinedAt: new Date('2024-01-01'),
    leftAt: null,
    user: testUsers.user1,
  },
  member2: {
    id: 'member-2-uuid',
    roomId: testRooms.room1.id,
    userId: testUsers.user2.id,
    role: 'MEMBER',
    score: 0,
    isReady: true,
    isActive: true,
    joinedAt: new Date('2024-01-01'),
    leftAt: null,
    user: testUsers.user2,
  },
};

export const testFriendships = {
  accepted: {
    id: 'friendship-1-uuid',
    userId: testUsers.user1.id,
    friendId: testUsers.user2.id,
    status: 'ACCEPTED',
    requestedAt: new Date('2024-01-01'),
    respondedAt: new Date('2024-01-02'),
  },
  pending: {
    id: 'friendship-2-uuid',
    userId: testUsers.user1.id,
    friendId: testUsers.user3.id,
    status: 'PENDING',
    requestedAt: new Date('2024-01-03'),
    respondedAt: null,
  },
  blocked: {
    id: 'friendship-3-uuid',
    userId: testUsers.user2.id,
    friendId: testUsers.user3.id,
    status: 'BLOCKED',
    requestedAt: new Date('2024-01-01'),
    respondedAt: new Date('2024-01-02'),
  },
};

export const testMessages = {
  dm1: {
    id: 'message-1-uuid',
    senderId: testUsers.user1.id,
    recipientId: testUsers.user2.id,
    roomId: null,
    text: 'Hello there!',
    messageType: 'PRIVATE',
    isRead: false,
    createdAt: new Date('2024-01-01T10:00:00'),
    sender: testUsers.user1,
    recipient: testUsers.user2,
  },
  dm2: {
    id: 'message-2-uuid',
    senderId: testUsers.user2.id,
    recipientId: testUsers.user1.id,
    roomId: null,
    text: 'Hi! How are you?',
    messageType: 'PRIVATE',
    isRead: true,
    createdAt: new Date('2024-01-01T10:01:00'),
    sender: testUsers.user2,
    recipient: testUsers.user1,
  },
  roomChat: {
    id: 'message-3-uuid',
    senderId: testUsers.user1.id,
    recipientId: null,
    roomId: testRooms.room1.id,
    text: 'Ready to play!',
    messageType: 'ROOM',
    isRead: false,
    createdAt: new Date('2024-01-01T10:05:00'),
    sender: testUsers.user1,
  },
};

// Helper to create a mock Express request
export function createMockRequest(overrides: any = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    user: testUsers.user1,
    headers: {},
    ...overrides,
  };
}

// Helper to create a mock Express response
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
  };
  res.status = mock((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = mock((data: any) => {
    res.body = data;
    return res;
  });
  res.send = mock((data: any) => {
    res.body = data;
    return res;
  });
  return res;
}

// Helper to create a mock next function
export function createMockNext(): any {
  return mock((err?: any) => err);
}

// Helper to wait for async operations
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
