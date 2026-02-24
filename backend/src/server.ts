/**
 * Fahman Backend Server
 * Main entry point for the Express application
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { join } from 'path';
import logger from './utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { initializeSocket } from './socket';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
const VERSION = packageJson.version;

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ============================================================================
// MIDDLEWARE
// ============================================================================

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
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
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
        url: `${BASE_URL}/`,
        description: 'API information and public endpoints',
      },
      health: {
        url: `${BASE_URL}/health`,
        description: 'Health check endpoint',
      },
      docs: {
        url: `${BASE_URL}/api-docs`,
        description: 'Interactive API documentation (Swagger UI)',
      },
      openapi: {
        url: `${BASE_URL}/api-docs.json`,
        description: 'OpenAPI 3.0 specification (JSON)',
      },
      api: {
        url: `${BASE_URL}/api`,
        description: 'API endpoints',
        routes: {
          auth: `${BASE_URL}/api/auth`,
          packs: `${BASE_URL}/api/packs`,
          rooms: `${BASE_URL}/api/rooms`,
          friends: `${BASE_URL}/api/friends`,
          notifications: `${BASE_URL}/api/notifications`,
        },
      },
      websocket: {
        url: BASE_URL.replace('http', 'ws'),
        description: 'WebSocket connection for real-time events',
      },
    },
    documentation: {
      swagger: `${BASE_URL}/api-docs`,
      openapi: `${BASE_URL}/api-docs.json`,
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
    environment: process.env.NODE_ENV || 'development',
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
    // Connect to database
    await connectDatabase();

    // Initialize Socket.io
    initializeSocket(httpServer);

    // Start HTTP server (Express + Socket.io)
    server = httpServer.listen(PORT, () => {
      logger.info(
        `Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
      );
      logger.info(`🏠 Home: ${BASE_URL}/`);
      logger.info(`❤️  Health: ${BASE_URL}/health`);
      logger.info(`📚 API Docs: ${BASE_URL}/api-docs`);
      logger.info(`📄 OpenAPI Spec: ${BASE_URL}/api-docs.json`);
      logger.info(`🔌 WebSocket: ${BASE_URL.replace('http', 'ws')}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
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
