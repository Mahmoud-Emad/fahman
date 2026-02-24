/**
 * Swagger/OpenAPI Configuration
 * Auto-generates API documentation from JSDoc comments
 */

import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fahman API',
      version: '1.0.0',
      description: 'Backend API for Fahman - Multiplayer Quiz/Party Game',
      contact: {
        name: 'API Support',
        email: 'support@fahman.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: 'Development server',
      },
      {
        url: 'https://api.fahman.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            avatar: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            role: {
              type: 'string',
              enum: ['NORMAL', 'ADMIN'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pack: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            category: {
              type: 'string',
              nullable: true,
            },
            difficulty: {
              type: 'string',
              enum: ['EASY', 'MEDIUM', 'HARD'],
              nullable: true,
            },
            visibility: {
              type: 'string',
              enum: ['PUBLIC', 'PRIVATE', 'FRIENDS'],
            },
            price: {
              type: 'number',
              format: 'decimal',
            },
            isPublished: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            packId: {
              type: 'string',
              format: 'uuid',
            },
            text: {
              type: 'string',
            },
            options: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            correctAnswers: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
            questionType: {
              type: 'string',
              enum: ['SINGLE', 'MULTIPLE', 'TRUE_FALSE'],
            },
            timeLimit: {
              type: 'integer',
            },
            points: {
              type: 'integer',
            },
            orderIndex: {
              type: 'integer',
            },
          },
        },
        UserBasic: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            displayName: {
              type: 'string',
              nullable: true,
            },
            avatar: {
              type: 'string',
              format: 'uri',
              nullable: true,
            },
            gameId: {
              type: 'integer',
            },
          },
        },
        Room: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            code: {
              type: 'string',
              description: '6-character join code',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            isPublic: {
              type: 'boolean',
            },
            maxPlayers: {
              type: 'integer',
            },
            currentPlayers: {
              type: 'integer',
            },
            status: {
              type: 'string',
              enum: ['WAITING', 'PLAYING', 'FINISHED', 'CLOSED'],
            },
            settings: {
              type: 'object',
            },
            creator: {
              $ref: '#/components/schemas/UserBasic',
            },
            selectedPack: {
              $ref: '#/components/schemas/Pack',
            },
            members: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/RoomMember',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RoomMember: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            role: {
              type: 'string',
              enum: ['CREATOR', 'ADMIN', 'MEMBER'],
            },
            score: {
              type: 'integer',
            },
            isReady: {
              type: 'boolean',
            },
            isActive: {
              type: 'boolean',
            },
            user: {
              $ref: '#/components/schemas/UserBasic',
            },
            joinedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            type: {
              type: 'string',
              enum: ['ROOM_INVITE', 'FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'SYSTEM'],
            },
            title: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
            sender: {
              $ref: '#/components/schemas/UserBasic',
              nullable: true,
            },
            actionData: {
              type: 'object',
              nullable: true,
            },
            isRead: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Friendship: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'],
            },
            user: {
              $ref: '#/components/schemas/UserBasic',
            },
            friend: {
              $ref: '#/components/schemas/UserBasic',
            },
            requestedAt: {
              type: 'string',
              format: 'date-time',
            },
            respondedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
            },
            limit: {
              type: 'integer',
            },
            total: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
            hasNext: {
              type: 'boolean',
            },
            hasPrev: {
              type: 'boolean',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Home',
        description: 'API information and public endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Packs',
        description: 'Quiz pack management',
      },
      {
        name: 'Questions',
        description: 'Question management',
      },
      {
        name: 'Rooms',
        description: 'Game room management',
      },
      {
        name: 'Game',
        description: 'Game state, answers, and scoring',
      },
      {
        name: 'Friends',
        description: 'Friend management',
      },
      {
        name: 'Users',
        description: 'User search and profiles',
      },
      {
        name: 'Notifications',
        description: 'Notification management',
      },
      {
        name: 'Messages',
        description: 'Direct messaging and conversations',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
