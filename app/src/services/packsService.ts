/**
 * Packs Service
 * API methods for pack management
 */

import { api, ApiResponse } from './api';

export interface Pack {
  id: string;
  title: string;
  description: string | null;
  textHint: string | null;
  imageUrl: string | null;
  category: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  isPublished: boolean;
  isStandard: boolean;
  timesPlayed: number;
  rating: number;
  createdAt: string;
  creator?: {
    id: string;
    username: string;
    avatar: string | null;
  };
  _count?: {
    questions: number;
    rooms?: number;
  };
}

export interface FreeStorePack {
  id: string;
  name: string;
  description: string;
  author: string;
  coverUrl: string | null;
  textHint: string;
  price: number;
  free: boolean;
  category: string;
  numberOfQuestions: number;
  previewQuestions: { number: number; question: string; answers: string[]; coverUrl: string | null }[];
}

export interface PackSelectionResponse {
  systemPacks: Pack[];
  userPacks: Pack[];
  popularPacks: Pack[];
  freeStorePacks: FreeStorePack[];
  paidStorePacks: FreeStorePack[];
  ownedStorePacks: FreeStorePack[];
}

export interface Question {
  id: string;
  packId: string;
  text: string;
  options: string[];
  correctAnswers: number[];
  questionType: 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE';
  mediaUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | null;
  timeLimit: number;
  points: number;
  orderIndex: number;
}

export interface PackWithQuestions extends Pack {
  questions: Question[];
}

export interface CreatePackData {
  title: string;
  description?: string;
  textHint?: string;
  imageUrl?: string;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
}

export interface CreateQuestionData {
  text: string;
  options: string[];
  correctAnswers: number[];
  questionType?: 'SINGLE' | 'MULTIPLE' | 'TRUE_FALSE';
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'AUDIO';
  timeLimit?: number;
  points?: number;
}

export interface PacksListResponse {
  packs: Pack[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class PacksService {
  /**
   * Get public packs list (paginated)
   */
  async getPublicPacks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    search?: string;
  }): Promise<ApiResponse<PacksListResponse>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.category) query.append('category', params.category);
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return api.get<PacksListResponse>(`/packs${queryString ? `?${queryString}` : ''}`, false);
  }

  /**
   * Get user's own packs
   */
  async getMyPacks(): Promise<ApiResponse<Pack[]>> {
    return api.get<Pack[]>('/packs/my');
  }

  /**
   * Get a specific pack by ID
   */
  async getPack(packId: string): Promise<ApiResponse<PackWithQuestions>> {
    return api.get<PackWithQuestions>(`/packs/${packId}`);
  }

  /**
   * Create a new pack
   */
  async createPack(data: CreatePackData): Promise<ApiResponse<Pack>> {
    return api.post<Pack>('/packs', data);
  }

  /**
   * Update a pack
   */
  async updatePack(packId: string, data: Partial<CreatePackData>): Promise<ApiResponse<Pack>> {
    return api.put<Pack>(`/packs/${packId}`, data);
  }

  /**
   * Delete a pack
   */
  async deletePack(packId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/packs/${packId}`);
  }

  /**
   * Publish a pack
   */
  async publishPack(packId: string): Promise<ApiResponse<Pack>> {
    return api.post<Pack>(`/packs/${packId}/publish`);
  }

  /**
   * Add a question to a pack
   */
  async addQuestion(packId: string, data: CreateQuestionData): Promise<ApiResponse<Question>> {
    return api.post<Question>(`/packs/${packId}/questions`, data);
  }

  /**
   * Add multiple questions to a pack
   */
  async addQuestionsBulk(
    packId: string,
    questions: CreateQuestionData[]
  ): Promise<ApiResponse<Question[]>> {
    return api.post<Question[]>(`/packs/${packId}/questions/bulk`, { questions });
  }

  /**
   * Update a question
   */
  async updateQuestion(
    questionId: string,
    data: Partial<CreateQuestionData>
  ): Promise<ApiResponse<Question>> {
    return api.put<Question>(`/packs/questions/${questionId}`, data);
  }

  /**
   * Delete a question
   */
  async deleteQuestion(questionId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/packs/questions/${questionId}`);
  }

  /**
   * Get system/standard packs (created by admins)
   */
  async getSystemPacks(): Promise<ApiResponse<Pack[]>> {
    return api.get<Pack[]>('/packs/system', false);
  }

  /**
   * Get popular packs (top by room usage)
   */
  async getPopularPacks(limit: number = 5): Promise<ApiResponse<Pack[]>> {
    return api.get<Pack[]>(`/packs/popular?limit=${limit}`, false);
  }

  /**
   * Get all packs for selection modal (system, user's, popular)
   */
  async getPacksForSelection(): Promise<ApiResponse<PackSelectionResponse>> {
    return api.get<PackSelectionResponse>('/packs/selection');
  }
}

export const packsService = new PacksService();
