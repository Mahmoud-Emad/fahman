/**
 * Notification Validation Schemas
 */

import Joi from 'joi';

export const sendRoomInvitesSchema = Joi.object({
  recipientIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one recipient is required',
      'array.max': 'Maximum 20 recipients allowed',
    }),
  roomCode: Joi.string().length(6).uppercase().required(),
  roomTitle: Joi.string().min(1).max(200).required(),
  packTitle: Joi.string().max(200).allow('', null),
});
