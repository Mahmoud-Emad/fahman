/**
 * Pagination Validation Schemas
 */

import Joi from 'joi';

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().max(50).optional(),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  unreadOnly: Joi.boolean().default(false),
});

export const cursorPaginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  before: Joi.string().uuid().optional().messages({
    'string.guid': 'before must be a valid message ID',
  }),
});
