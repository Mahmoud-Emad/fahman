/**
 * Database Configuration
 * Prisma Client initialization and connection management
 */

import { PrismaClient } from '@prisma/client';
import logger from '../shared/utils/logger';
import { config } from './env';

const prisma = new PrismaClient({
  log: config.isDev ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

/**
 * Test database connection
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
}

export { prisma };
