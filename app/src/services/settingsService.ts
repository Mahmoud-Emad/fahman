/**
 * Settings Service
 * Handles user settings API operations
 */

import { api, ApiResponse } from './api';
import { getErrorMessage } from '@/utils/errorUtils';

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
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(data: UpdateSettingsData): Promise<ApiResponse<UserSettings>> {
    try {
      return await api.put<UserSettings>('/settings', data);
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  async resetSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      return await api.post<UserSettings>('/settings/reset');
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
        error: getErrorMessage(error),
      };
    }
  }

  /**
   * Delete user account (requires password confirmation)
   */
  async deleteAccount(password?: string): Promise<ApiResponse<void>> {
    try {
      return await api.delete<void>('/settings/delete-account', password ? { password } : undefined);
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error),
        error: getErrorMessage(error),
      };
    }
  }
}

export const settingsService = new SettingsService();
