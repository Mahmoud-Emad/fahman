/**
 * Message Validation Schemas
 */

import Joi from 'joi';

/**
 * Send direct message validation
 */
export const sendMessageSchema = Joi.object({
  recipientId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid recipient ID format',
    'any.required': 'Recipient ID is required',
  }),
  text: Joi.string().min(1).max(2000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message cannot exceed 2000 characters',
    'any.required': 'Message text is required',
  }),
});

/**
 * Send room invite validation
 */
export const sendRoomInviteSchema = Joi.object({
  recipientIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one recipient is required',
      'array.max': 'Cannot invite more than 20 users at once',
      'any.required': 'Recipient IDs are required',
    }),
  roomCode: Joi.string().length(6).required().messages({
    'string.length': 'Room code must be 6 characters',
    'any.required': 'Room code is required',
  }),
  roomTitle: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Room title cannot be empty',
    'string.max': 'Room title cannot exceed 200 characters',
    'any.required': 'Room title is required',
  }),
});

/**
 * Mark messages as read validation
 */
export const markAsReadSchema = Joi.object({
  messageIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one message ID is required',
      'array.max': 'Cannot mark more than 100 messages at once',
      'any.required': 'Message IDs are required',
    }),
});

/**
 * Query params for getting messages
 */
export const getMessagesQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  before: Joi.string().uuid().optional(),
});
