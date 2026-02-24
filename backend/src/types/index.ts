/**
 * TypeScript Type Definitions
 * Centralized type exports for the application
 */

import { Role } from '@prisma/client';
import { Request } from 'express';

// User-related types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatar: string | null;
  isActive: boolean;
}

export interface JWTPayload {
  userId: string;
  role: Role;
}

// Extended Express Request with authenticated user
export interface AuthRequest extends Request {
  user: AuthUser;
}

// API Response types
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PackFilters {
  category?: string;
  difficulty?: string;
  search?: string;
}

// Room types
export interface RoomSettings {
  timePerQuestion?: number;
  scoreVisibility?: 'all' | 'end' | 'hidden';
  allowLateJoin?: boolean;
  [key: string]: any;
}
