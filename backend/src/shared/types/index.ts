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
  email: string | null;
  role: Role;
  avatar: string | null;
  isActive: boolean;
}

export interface JWTPayload {
  userId: string;
  role: Role;
  jti?: string;
  iat?: number;
  exp?: number;
}

// Extended Express Request with authenticated user
export interface AuthRequest extends Request {
  user: AuthUser;
}

// API Response types
export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, unknown>;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// Re-export pagination types from dedicated module
export type { PaginationParams, PaginationMeta, PaginatedResult } from './pagination';

export interface PaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: import('./pagination').PaginationMeta;
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
  [key: string]: unknown;
}
