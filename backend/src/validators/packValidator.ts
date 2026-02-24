/**
 * Pack Validation Schemas
 */

import Joi from 'joi';

export const createPackSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow('', null),
  imageUrl: Joi.string().uri().max(500).allow('', null),
  visibility: Joi.string().valid('PUBLIC', 'PRIVATE', 'FRIENDS').default('PUBLIC'),
  price: Joi.number().min(0).max(9999.99).default(0),
  category: Joi.string().max(50).allow(null),
  difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').allow(null),
});

export const updatePackSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  imageUrl: Joi.string().uri().max(500).allow('', null).optional(),
  visibility: Joi.string().valid('PUBLIC', 'PRIVATE', 'FRIENDS').optional(),
  price: Joi.number().min(0).max(9999.99).optional(),
  category: Joi.string().max(50).allow(null).optional(),
  difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').allow(null).optional(),
});

export const createQuestionSchema = Joi.object({
  text: Joi.string().min(1).max(1000).required(),
  options: Joi.array().items(Joi.string()).min(1).max(6).required(),
  correctAnswers: Joi.array().items(Joi.number().integer()).min(1).required(),
  questionType: Joi.string().valid('SINGLE', 'MULTIPLE', 'TRUE_FALSE').default('SINGLE'),
  mediaUrl: Joi.string().uri().allow(null),
  mediaType: Joi.string().valid('IMAGE', 'VIDEO', 'AUDIO').allow(null),
  timeLimit: Joi.number().integer().min(5).max(300).default(30),
  points: Joi.number().integer().min(1).max(1000).default(100),
  orderIndex: Joi.number().integer().min(1).required(),
});

export const updateQuestionSchema = Joi.object({
  text: Joi.string().min(1).max(1000).optional(),
  options: Joi.array().items(Joi.string()).min(1).max(6).optional(),
  correctAnswers: Joi.array().items(Joi.number().integer()).min(1).optional(),
  questionType: Joi.string().valid('SINGLE', 'MULTIPLE', 'TRUE_FALSE').optional(),
  mediaUrl: Joi.string().uri().allow(null).optional(),
  mediaType: Joi.string().valid('IMAGE', 'VIDEO', 'AUDIO').allow(null).optional(),
  timeLimit: Joi.number().integer().min(5).max(300).optional(),
  points: Joi.number().integer().min(1).max(1000).optional(),
  orderIndex: Joi.number().integer().min(1).optional(),
});
