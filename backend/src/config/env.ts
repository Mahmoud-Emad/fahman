/**
 * Centralized Environment Configuration
 * Validates all required environment variables at startup using Joi
 */

import Joi from 'joi';

const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  BASE_URL: Joi.string().uri().optional(),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT — HMAC-SHA256 needs at least 32 bytes of key material
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Bcrypt
  BCRYPT_ROUNDS: Joi.number().integer().min(4).max(20).default(10),

  // CORS — required in production to prevent localhost default
  CORS_ORIGIN: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('http://localhost:3001'),
  }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  RATE_LIMIT_AUTH_MAX_REQUESTS: Joi.number().default(10),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // OAuth — empty strings fail validation; omit the var entirely if unused
  GOOGLE_CLIENT_ID: Joi.string().min(1).optional(),
  FACEBOOK_APP_ID: Joi.string().min(1).optional(),
  FACEBOOK_APP_SECRET: Joi.string().min(1).optional(),

  // Redis — required in production to prevent silent localhost fallback
  REDIS_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('redis://localhost:6379'),
  }),

  // Payment verification — must be enabled in production
  PAYMENT_VERIFICATION_ENABLED: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.boolean().required().valid(true),
    otherwise: Joi.boolean().default(false),
  }),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const missingVars = error.details.map((d) => d.message).join('\n  - ');
  throw new Error(`Environment validation failed:\n  - ${missingVars}`);
}

export const config = {
  env: envVars.NODE_ENV as string,
  isDev: envVars.NODE_ENV === 'development',
  isProd: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',

  port: envVars.PORT as number,
  baseUrl: (envVars.BASE_URL || `http://localhost:${envVars.PORT}`) as string,

  db: {
    url: envVars.DATABASE_URL as string,
  },

  jwt: {
    secret: envVars.JWT_SECRET as string,
    refreshSecret: envVars.JWT_REFRESH_SECRET as string,
    expiresIn: envVars.JWT_EXPIRES_IN as string,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN as string,
  },

  bcrypt: {
    rounds: envVars.BCRYPT_ROUNDS as number,
  },

  cors: {
    origins: (envVars.CORS_ORIGIN as string).split(',').map((o: string) => o.trim()).filter(Boolean),
  },

  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS as number,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS as number,
    authMaxRequests: envVars.RATE_LIMIT_AUTH_MAX_REQUESTS as number,
  },

  log: {
    level: envVars.LOG_LEVEL as string,
  },

  oauth: {
    googleClientId: envVars.GOOGLE_CLIENT_ID as string,
    facebookAppId: envVars.FACEBOOK_APP_ID as string,
    facebookAppSecret: envVars.FACEBOOK_APP_SECRET as string,
  },

  redis: {
    url: envVars.REDIS_URL as string,
  },

  payment: {
    verificationEnabled: envVars.PAYMENT_VERIFICATION_ENABLED as boolean,
  },
} as const;
