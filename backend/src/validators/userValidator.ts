/**
 * User Validation Schemas
 */

import Joi from 'joi';

export const searchUsersSchema = Joi.object({
  q: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Search query must be at least 2 characters',
    'any.required': 'Search query is required',
  }),
  limit: Joi.number().integer().min(1).max(50).default(20),
});

export const recentGamesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10),
});
