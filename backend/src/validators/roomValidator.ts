/**
 * Room Validation Schemas
 */

import Joi from 'joi';

export const createRoomSchema = Joi.object({
  packId: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow('', null),
  maxPlayers: Joi.number().integer().min(2).max(20).default(8),
  isPublic: Joi.boolean().default(true),
  password: Joi.string().min(4).max(50).allow(null),
  settings: Joi.object({
    timePerQuestion: Joi.number().integer().min(5).max(300),
    scoreVisibility: Joi.string().valid('all', 'end', 'hidden'),
    allowLateJoin: Joi.boolean(),
  }).default({}),
});

export const updateRoomSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  maxPlayers: Joi.number().integer().min(2).max(20).optional(),
  isPublic: Joi.boolean().optional(),
  settings: Joi.object({
    timePerQuestion: Joi.number().integer().min(5).max(300),
    scoreVisibility: Joi.string().valid('all', 'end', 'hidden'),
    allowLateJoin: Joi.boolean(),
  }).optional(),
});

export const joinRoomSchema = Joi.object({
  password: Joi.string().max(50).allow('', null),
});

export const joinRoomByCodeSchema = Joi.object({
  roomCode: Joi.string().length(6).uppercase().required(),
  password: Joi.string().max(50).allow('', null),
});

export const setReadySchema = Joi.object({
  isReady: Joi.boolean().required(),
});

export const roomCodeParamSchema = Joi.object({
  code: Joi.string().length(6).uppercase().required(),
});
