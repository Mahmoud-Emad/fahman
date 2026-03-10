/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

import rateLimit from 'express-rate-limit';
import { config } from '../../config/env';

// General rate limiter for most routes
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 300000, // 5 minutes
  max: config.rateLimit.authMaxRequests,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
