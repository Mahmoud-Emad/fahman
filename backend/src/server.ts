/**
 * Fahman Backend Server
 * Main entry point for the Express application
 */

import 'dotenv/config';
import { config } from './config/env';
import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join } from 'path';
import logger from './shared/utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';
import { generalLimiter } from './shared/middleware/rateLimiter';
import { requestId } from './shared/middleware/requestId';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { initializeSocket } from './socket';
import { runAchievementJob } from './modules/game/achievementJob';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Request ID tracking
app.use(requestId);

// Security middleware - configure CSP for Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing middleware (increased limit for base64 image uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (pack images, etc.)
app.use('/uploads', express.static(join(__dirname, 'uploads'), {
  maxAge: '30d', // Cache uploads for 30 days
  etag: true,
}));

// Serve store files (avatars, sounds from marketplace)
app.use('/store', express.static(join(__dirname, 'store'), {
  maxAge: '30d', // Cache store items for 30 days
  etag: true,
}));

// Rate limiting
app.use(generalLimiter);

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.requestId,
  });
  next();
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Home
 *     summary: API Home - List all public endpoints
 *     description: Returns information about the API and links to all public endpoints
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Welcome to Fahman API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 endpoints:
 *                   type: object
 */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Fahman API',
    version: '1.0.0',
    description: 'Backend API for Fahman - Multiplayer Quiz/Party Game',
    endpoints: {
      home: {
        url: `${config.baseUrl}/`,
        description: 'API information and public endpoints',
      },
      health: {
        url: `${config.baseUrl}/health`,
        description: 'Health check endpoint',
      },
      docs: {
        url: `${config.baseUrl}/api-docs`,
        description: 'Interactive API documentation (Swagger UI)',
      },
      openapi: {
        url: `${config.baseUrl}/api-docs.json`,
        description: 'OpenAPI 3.0 specification (JSON)',
      },
      api: {
        url: `${config.baseUrl}/api`,
        description: 'API endpoints',
        routes: {
          auth: `${config.baseUrl}/api/auth`,
          packs: `${config.baseUrl}/api/packs`,
          rooms: `${config.baseUrl}/api/rooms`,
          friends: `${config.baseUrl}/api/friends`,
          notifications: `${config.baseUrl}/api/notifications`,
        },
      },
      websocket: {
        url: config.baseUrl.replace('http', 'ws'),
        description: 'WebSocket connection for real-time events',
      },
    },
    documentation: {
      swagger: `${config.baseUrl}/api-docs`,
      openapi: `${config.baseUrl}/api-docs.json`,
      postman: 'Import OpenAPI spec into Postman',
    },
  });
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Home
 *     summary: Health Check
 *     description: Check if the server is running and responsive
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Fahman API Documentation',
  })
);

// OpenAPI JSON spec
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api', routes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

let server: ReturnType<typeof httpServer.listen>;

async function startServer() {
  try {
    // Connect to database and Redis
    await connectDatabase();
    await connectRedis();

    // Initialize Socket.io and store registry on app
    const socketRegistry = initializeSocket(httpServer);
    app.set('socketRegistry', socketRegistry);

    // Start HTTP server (Express + Socket.io)
    server = httpServer.listen(config.port, () => {
      logger.info(
        `Server running on port ${config.port} in ${config.env} mode`
      );
      logger.info(`Home: ${config.baseUrl}/`);
      logger.info(`Health: ${config.baseUrl}/health`);
      logger.info(`API Docs: ${config.baseUrl}/api-docs`);
      logger.info(`OpenAPI Spec: ${config.baseUrl}/api-docs.json`);
      logger.info(`WebSocket: ${config.baseUrl.replace('http', 'ws')}`);
    });

    // Schedule daily achievement job at 3:00 AM
    scheduleAchievementJob();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// ACHIEVEMENT CRON JOB
// ============================================================================

let achievementTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAchievementJob() {
  function scheduleNext() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(3, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const delay = next.getTime() - now.getTime();
    logger.info(`Achievement job scheduled for ${next.toISOString()} (in ${Math.round(delay / 60000)}min)`);

    achievementTimer = setTimeout(async () => {
      try {
        await runAchievementJob();
      } catch (error) {
        logger.error('Achievement cron failed:', error);
      }
      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (achievementTimer) {
    clearTimeout(achievementTimer);
    achievementTimer = null;
  }

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await disconnectRedis();
      await disconnectDatabase();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  }

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer();

export default app;
