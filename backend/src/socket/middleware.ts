/**
 * Socket.io Middleware
 * Authentication and connection handling
 */

import { Socket } from 'socket.io';
import { prisma } from '../config/database';
import { verifyToken } from '../utils/tokenUtils';
import { AuthenticatedSocket } from './types';
import logger from '../utils/logger';

/**
 * Authenticate socket connection using JWT token
 */
export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // Get token from handshake auth or query
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Verify token
    const decoded = verifyToken(token as string);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    if (!user.isActive) {
      return next(new Error('User account is deactivated'));
    }

    // Attach user data to socket
    const authSocket = socket as AuthenticatedSocket;
    authSocket.userId = user.id;
    authSocket.username = user.username;
    authSocket.roomIds = new Set();

    logger.info(`Socket authenticated: ${user.username} (${socket.id})`);
    next();
  } catch (error: any) {
    logger.error(`Socket auth error: ${error.message}`);
    next(new Error('Invalid token'));
  }
}

/**
 * Error handling middleware
 */
export function handleSocketError(socket: AuthenticatedSocket, error: Error): void {
  logger.error(`Socket error for ${socket.userId}: ${error.message}`);
  socket.emit('error', { message: error.message });
}

/**
 * Log socket events (for debugging)
 */
export function logSocketEvent(
  socket: AuthenticatedSocket,
  event: string,
  data?: any
): void {
  logger.debug(`Socket event [${socket.userId}] ${event}`, data);
}
