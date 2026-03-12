/**
 * Settings Controller
 * Handles user settings requests
 */

import { Response, NextFunction } from 'express';
import * as settingsService from './settingsService';
import { successResponse } from '@shared/utils/responseFormatter';
import { AuthRequest } from '@shared/types/index';

/**
 * Get user settings
 */
export async function getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsService.getUserSettings(req.user.id);
    res.json(successResponse(settings, 'Settings retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Update user settings
 */
export async function updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsService.updateUserSettings(req.user.id, req.body);
    res.json(successResponse(settings, 'Settings updated successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await settingsService.resetUserSettings(req.user.id);
    res.json(successResponse(settings, 'Settings reset to defaults'));
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user account (requires password confirmation)
 */
export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { password } = req.body;
    await settingsService.deleteUserAccount(req.user.id, password);
    res.json(successResponse('Account deleted successfully'));
  } catch (error) {
    next(error);
  }
}
