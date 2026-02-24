/**
 * Friend Validation Schemas
 */

import Joi from 'joi';

export const sendFriendRequestSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

export const sendFriendRequestByIdentifierSchema = Joi.object({
  identifier: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'Identifier must be at least 2 characters',
      'string.max': 'Identifier must be at most 50 characters',
    }),
});

export const searchUsersQuerySchema = Joi.object({
  q: Joi.string().min(2).max(50).required(),
  limit: Joi.number().integer().min(1).max(50).default(20),
});
