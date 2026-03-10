/**
 * Rooms Service
 * API methods for room management and game operations
 */

import { api, ApiResponse } from './api';

export interface RoomMember {
  id: string;
  role: 'CREATOR' | 'ADMIN' | 'MEMBER';
  score: number;
  isReady: boolean;
  isActive: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  joinedAt: string;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  maxPlayers: number;
  currentPlayers: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'CLOSED';
  settings: Record<string, any>;
  currentQuestionIndex: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  creator: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  selectedPack: {
    id: string;
    title: string;
    description?: string | null;
    category: string | null;
    difficulty: string | null;
    imageUrl: string | null;
    _count?: { questions: number };
  } | null;
  members?: RoomMember[];
}

export interface CreateRoomData {
  packId: string;
  title: string;
  description?: string;
  maxPlayers?: number;
  isPublic?: boolean;
  password?: string;
  settings?: Record<string, any>;
}

export interface JoinRoomData {
  password?: string;
}

export interface RoomsListResponse {
  rooms: Room[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Game-related types
export interface GameState {
  roomId: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: {
    id: string;
    text: string;
    options: string[];
    questionType: string;
    mediaUrl: string | null;
    mediaType: string | null;
    timeLimit: number;
    points: number;
  } | null;
  players: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    score: number;
    hasAnswered: boolean;
  }[];
  startedAt: string | null;
}

export interface SubmitAnswerData {
  answer: number | number[];
  betAmount: number;
  timeRemaining: number;
}

export interface AnswerResult {
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer: number[];
  newScore: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
  };
  score: number;
  isYou?: boolean;
}

class RoomsService {
  /**
   * Search rooms by name, code, or ID
   */
  async searchRooms(query: string): Promise<ApiResponse<Room[]>> {
    return api.get<Room[]>(`/rooms/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get public rooms list (paginated)
   */
  async getPublicRooms(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<RoomsListResponse>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.status) query.append('status', params.status);

    const queryString = query.toString();
    return api.get<RoomsListResponse>(`/rooms${queryString ? `?${queryString}` : ''}`, false);
  }

  /**
   * Get popular/active rooms
   */
  async getPopularRooms(limit: number = 10): Promise<ApiResponse<Room[]>> {
    return api.get<Room[]>(`/rooms/popular?limit=${limit}`, false);
  }

  /**
   * Get authenticated user's active rooms
   */
  async getMyRooms(): Promise<ApiResponse<Room[]>> {
    return api.get<Room[]>('/rooms/my');
  }

  /**
   * Get a room by ID
   */
  async getRoom(roomId: string): Promise<ApiResponse<Room>> {
    return api.get<Room>(`/rooms/${roomId}`);
  }

  /**
   * Get a room by code
   */
  async getRoomByCode(code: string): Promise<ApiResponse<Room>> {
    return api.get<Room>(`/rooms/code/${code}`);
  }

  /**
   * Create a new room
   */
  async createRoom(data: CreateRoomData): Promise<ApiResponse<Room>> {
    return api.post<Room>('/rooms', data);
  }

  /**
   * Join a room by ID
   */
  async joinRoom(roomId: string, data?: JoinRoomData): Promise<ApiResponse<{ room: Room; member: RoomMember }>> {
    return api.post<{ room: Room; member: RoomMember }>(`/rooms/${roomId}/join`, data);
  }

  /**
   * Join a room by code
   */
  async joinRoomByCode(code: string, password?: string): Promise<ApiResponse<{ room: Room; member: RoomMember }>> {
    return api.post<{ room: Room; member: RoomMember }>('/rooms/join', { roomCode: code, password });
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/rooms/${roomId}/leave`);
  }

  /**
   * Start the game (creator only)
   */
  async startGame(roomId: string): Promise<ApiResponse<GameState>> {
    return api.post<GameState>(`/rooms/${roomId}/start`);
  }

  /**
   * Kick a player from the room (creator only)
   */
  async kickPlayer(roomId: string, userId: string): Promise<ApiResponse<null>> {
    return api.post<null>(`/rooms/${roomId}/kick/${userId}`);
  }

  /**
   * Update room settings
   */
  async updateRoom(roomId: string, data: Partial<CreateRoomData>): Promise<ApiResponse<Room>> {
    return api.patch<Room>(`/rooms/${roomId}`, data);
  }

  // ============================================
  // Game Operations
  // ============================================

  /**
   * Get current game state
   */
  async getGameState(roomId: string): Promise<ApiResponse<GameState>> {
    return api.get<GameState>(`/rooms/${roomId}/game`);
  }

  /**
   * Submit an answer
   */
  async submitAnswer(roomId: string, data: SubmitAnswerData): Promise<ApiResponse<AnswerResult>> {
    return api.post<AnswerResult>(`/rooms/${roomId}/game/answer`, data);
  }

  /**
   * Move to next question (creator only)
   */
  async nextQuestion(roomId: string): Promise<ApiResponse<{ finished: boolean; question?: any }>> {
    return api.post<{ finished: boolean; question?: any }>(`/rooms/${roomId}/game/next`);
  }

  /**
   * Get game results
   */
  async getGameResults(roomId: string): Promise<ApiResponse<any>> {
    return api.get<any>(`/rooms/${roomId}/game/results`);
  }

  /**
   * Get current leaderboard
   */
  async getLeaderboard(roomId: string): Promise<ApiResponse<{ players: LeaderboardEntry[] }>> {
    return api.get<{ players: LeaderboardEntry[] }>(`/rooms/${roomId}/leaderboard`);
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`/rooms/${roomId}`);
  }
}

export const roomsService = new RoomsService();
