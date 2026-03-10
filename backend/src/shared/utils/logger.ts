/**
 * Logger Configuration using Winston
 * Provides structured logging for the application
 */

import winston from 'winston';
import { config } from '../../config/env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) {
      msg += ` [${requestId}]`;
    }
    msg += `: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: config.isDev ? consoleFormat : logFormat,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: config.isDev ? consoleFormat : logFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: config.isDev ? consoleFormat : logFormat,
    }),
  ],
});

// Add file transports in production
if (config.isProd) {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

export default logger;
