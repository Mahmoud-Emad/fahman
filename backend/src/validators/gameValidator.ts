/**
 * Game Validation Schemas
 */

import Joi from 'joi';

export const submitAnswerSchema = Joi.object({
  answer: Joi.alternatives()
    .try(
      Joi.number().integer().min(0),
      Joi.array().items(Joi.number().integer().min(0)).min(1)
    )
    .required()
    .messages({
      'any.required': 'Answer is required',
    }),
  betAmount: Joi.number().integer().min(0).required().messages({
    'number.min': 'Bet amount cannot be negative',
    'any.required': 'Bet amount is required',
  }),
  timeRemaining: Joi.number().min(0).required().messages({
    'any.required': 'Time remaining is required',
  }),
});
