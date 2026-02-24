/**
 * Store Validation Schemas
 */

import Joi from 'joi';

export const purchaseCoinsSchema = Joi.object({
  packageId: Joi.string()
    .valid('pack_50', 'pack_150', 'pack_500')
    .required()
    .messages({
      'any.only': 'Invalid package. Must be one of: pack_50, pack_150, pack_500',
      'any.required': 'packageId is required',
    }),
});
