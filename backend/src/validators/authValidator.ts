/**
 * Authentication Validation Schemas
 */

import Joi from 'joi';

// =============================================================================
// REGISTRATION SCHEMAS
// =============================================================================

export const registerSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name must not exceed 100 characters',
    'any.required': 'Full name is required',
  }),

  email: Joi.string().email().max(255).required().messages({
    'string.email': 'Please provide a valid email address',
    'string.max': 'Email must not exceed 255 characters',
    'any.required': 'Email is required',
  }),

  password: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),

  avatar: Joi.string().uri().max(500).optional().messages({
    'string.uri': 'Avatar must be a valid URL',
    'string.max': 'Avatar URL must not exceed 500 characters',
  }),
});

/**
 * Register with phone number
 */
export const registerWithPhoneSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.alphanum': 'Username must only contain alphanumeric characters',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username must not exceed 50 characters',
    'any.required': 'Username is required',
  }),

  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number with country code',
      'any.required': 'Phone number is required',
    }),

  password: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),

  displayName: Joi.string().max(100).optional().messages({
    'string.max': 'Display name must not exceed 100 characters',
  }),

  avatar: Joi.string().uri().max(500).optional().messages({
    'string.uri': 'Avatar must be a valid URL',
    'string.max': 'Avatar URL must not exceed 500 characters',
  }),
});

// =============================================================================
// LOGIN SCHEMAS
// =============================================================================

/**
 * Login with email and password
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Login with phone number and password
 */
export const loginWithPhoneSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number with country code',
      'any.required': 'Phone number is required',
    }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Login with game ID and password
 */
export const loginWithGameIdSchema = Joi.object({
  gameId: Joi.number().integer().min(100000).required().messages({
    'number.base': 'Game ID must be a number',
    'number.integer': 'Game ID must be an integer',
    'number.min': 'Invalid Game ID',
    'any.required': 'Game ID is required',
  }),

  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * OAuth login (Google/Facebook)
 * Client sends the OAuth token/code, server verifies with provider
 */
export const oauthLoginSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'OAuth token is required',
  }),

  // Optional: client can provide these if already fetched
  email: Joi.string().email().optional(),
  displayName: Joi.string().max(100).optional(),
  avatar: Joi.string().uri().max(500).optional(),
  providerId: Joi.string().max(255).optional(),
});

// =============================================================================
// PHONE VERIFICATION SCHEMAS
// =============================================================================

/**
 * Send phone verification code
 */
export const sendPhoneVerificationSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number with country code',
      'any.required': 'Phone number is required',
    }),
});

/**
 * Verify phone with OTP code
 */
export const verifyPhoneSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number with country code',
      'any.required': 'Phone number is required',
    }),

  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must be 6 digits',
      'any.required': 'Verification code is required',
    }),
});

// =============================================================================
// TOKEN SCHEMAS
// =============================================================================

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

// =============================================================================
// PASSWORD RESET SCHEMAS
// =============================================================================

/**
 * Request password reset
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

/**
 * Reset password with code
 */
export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),

  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Reset code must be 6 digits',
      'string.pattern.base': 'Reset code must be 6 digits',
      'any.required': 'Reset code is required',
    }),

  newPassword: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must not exceed 100 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required',
    }),
});

// =============================================================================
// PROFILE MANAGEMENT SCHEMAS
// =============================================================================

/**
 * Update user profile
 */
export const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Display name must be at least 2 characters long',
    'string.max': 'Display name must not exceed 100 characters',
  }),

  bio: Joi.string().max(500).allow('').optional().messages({
    'string.max': 'Bio must not exceed 500 characters',
  }),

  avatar: Joi.string().uri().max(500).optional().messages({
    'string.uri': 'Avatar must be a valid URL',
    'string.max': 'Avatar URL must not exceed 500 characters',
  }),
});

/**
 * Update phone number
 */
export const updatePhoneNumberSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number with country code',
      'any.required': 'Phone number is required',
    }),
});

/**
 * Verify phone for authenticated user
 */
export const verifyUserPhoneSchema = Joi.object({
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.length': 'Verification code must be 6 digits',
      'string.pattern.base': 'Verification code must be 6 digits',
      'any.required': 'Verification code is required',
    }),
});
