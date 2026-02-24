/**
 * Settings Service
 * Handles user settings API operations
 */

import { api, ApiResponse } from './api';

export interface UserSettings {
  id: string;
  userId: string;

  // Sound settings
  gameSound: boolean;
  userSound: boolean;
  notificationSound: boolean;
  appSound: boolean;

  // Privacy settings
  onlineStatus: boolean;
  roomVisibility: boolean;
  readReceipts: boolean;

  // Language
  language: 'en' | 'ar';

  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  gameSound?: boolean;
  userSound?: boolean;
  notificationSound?: boolean;
  appSound?: boolean;
  onlineStatus?: boolean;
  roomVisibility?: boolean;
  readReceipts?: boolean;
  language?: 'en' | 'ar';
}

class SettingsService {
  /**
   * Get user settings
   */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      return await api.get<UserSettings>('/settings');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to get settings',
        error: error.message,
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(data: UpdateSettingsData): Promise<ApiResponse<UserSettings>> {
    try {
      return await api.put<UserSettings>('/settings', data);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update settings',
        error: error.message,
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      return await api.post<UserSettings>('/settings/reset');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reset settings',
        error: error.message,
      };
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    try {
      return await api.delete<void>('/settings/delete-account');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete account',
        error: error.message,
      };
    }
  }
}

export const settingsService = new SettingsService();
