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
  receiptToken: Joi.string()
    .required()
    .messages({
      'any.required': 'receiptToken is required',
      'string.empty': 'receiptToken cannot be empty',
    }),
  platform: Joi.string()
    .valid('ios', 'android', 'web')
    .required()
    .messages({
      'any.only': 'platform must be one of: ios, android, web',
      'any.required': 'platform is required',
    }),
});
