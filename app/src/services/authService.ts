/**
 * Authentication service
 * Handles all auth-related API calls
 */

import { api, ApiResponse } from './api';
import { storage } from './storage';

// Types
export interface User {
  id: string;
  gameId: number;
  username: string;
  displayName: string | null;
  bio: string | null;
  email: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  avatar: string | null;
  role: 'NORMAL' | 'ADMIN' | 'MODERATOR';
  authProvider: 'LOCAL' | 'GOOGLE' | 'FACEBOOK';
  createdAt: string;
  coins: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  isNewUser?: boolean;
}

export interface RegisterData {
  displayName: string;
  email: string;
  password: string;
  avatar?: string;
}

export interface RegisterWithPhoneData {
  username: string;
  phoneNumber: string;
  password: string;
  displayName?: string;
  avatar?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginWithPhoneData {
  phoneNumber: string;
  password: string;
}

export interface LoginWithGameIdData {
  gameId: number;
  password: string;
}

export interface OAuthData {
  token: string;
  email?: string;
  displayName?: string;
  avatar?: string;
  providerId?: string;
}

export interface PhoneVerificationData {
  phoneNumber: string;
  code: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatar?: string;
}

export interface UpdatePhoneData {
  phoneNumber: string;
}

export interface VerifyUserPhoneData {
  code: string;
}

// Auth Service
export const authService = {
  // ============================================
  // Registration
  // ============================================

  /**
   * Register with email and password
   */
  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/register', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  /**
   * Register with phone number and password
   */
  async registerWithPhone(data: RegisterWithPhoneData): Promise<ApiResponse<{ user: User; message: string }>> {
    return api.post('/auth/register/phone', data, false);
  },

  // ============================================
  // Login Methods
  // ============================================

  /**
   * Login with email and password
   */
  async loginWithEmail(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  /**
   * Login with phone number and password
   */
  async loginWithPhone(data: LoginWithPhoneData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login/phone', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  /**
   * Login with Game ID and password
   */
  async loginWithGameId(data: LoginWithGameIdData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login/game-id', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  // ============================================
  // OAuth Login
  // ============================================

  /**
   * Login/Register with Google
   */
  async loginWithGoogle(data: OAuthData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/google', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  /**
   * Login/Register with Facebook
   */
  async loginWithFacebook(data: OAuthData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/facebook', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  // ============================================
  // Phone Verification
  // ============================================

  /**
   * Send phone verification code
   */
  async sendPhoneVerification(phoneNumber: string): Promise<ApiResponse<{ message: string; expiresAt: string; code?: string }>> {
    return api.post('/auth/phone/send-code', { phoneNumber }, false);
  },

  /**
   * Verify phone with OTP code
   */
  async verifyPhone(data: PhoneVerificationData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/phone/verify', data, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      await storage.setUser(response.data.user);
    }
    return response;
  },

  // ============================================
  // Token & Session Management
  // ============================================

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ tokens: AuthTokens }>('/auth/refresh', { refreshToken }, false);
    if (response.data) {
      await storage.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    return response;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return api.get<User>('/auth/me');
  },

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors, clear local data anyway
    }
    await storage.clearAll();
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAccessToken();
    return !!token;
  },

  /**
   * Get stored user
   */
  async getStoredUser(): Promise<User | null> {
    return storage.getUser<User>();
  },

  // ============================================
  // Password Reset
  // ============================================

  /**
   * Request password reset code
   */
  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse<{ message: string; expiresAt: string; code?: string }>> {
    return api.post('/auth/forgot-password', data, false);
  },

  /**
   * Reset password with code
   */
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<null>> {
    return api.post('/auth/reset-password', data, false);
  },

  // ============================================
  // Profile Management
  // ============================================

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    const response = await api.patch<User>('/auth/profile', data);
    if (response.data) {
      await storage.setUser(response.data);
    }
    return response;
  },

  /**
   * Add or update phone number
   */
  async updatePhoneNumber(data: UpdatePhoneData): Promise<ApiResponse<{ user: User; message: string; expiresAt: string; code?: string }>> {
    const response = await api.post<{ user: User; message: string; expiresAt: string; code?: string }>('/auth/phone', data);
    if (response.data?.user) {
      await storage.setUser(response.data.user);
    }
    return response;
  },

  /**
   * Verify phone for authenticated user
   */
  async verifyUserPhone(data: VerifyUserPhoneData): Promise<ApiResponse<User>> {
    const response = await api.post<User>('/auth/phone/verify-user', data);
    if (response.data) {
      await storage.setUser(response.data);
    }
    return response;
  },
};
