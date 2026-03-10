/**
 * Settings validation schemas
 */

import Joi from 'joi';

/**
 * Update settings schema
 */
export const updateSettingsSchema = Joi.object({
  // Sound settings
  gameSound: Joi.boolean(),
  userSound: Joi.boolean(),
  notificationSound: Joi.boolean(),
  appSound: Joi.boolean(),

  // Privacy settings
  onlineStatus: Joi.boolean(),
  roomVisibility: Joi.boolean(),
  readReceipts: Joi.boolean(),

  // Language
  language: Joi.string().valid('en', 'ar'),
}).min(1); // At least one field required
