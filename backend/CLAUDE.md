# Fahman Backend - Development Guidelines
**Runtime:** Bun | **Framework:** Express.js | **Database:** PostgreSQL + Prisma | **Real-time:** Socket.io

---

## Project Overview

Fahman backend is a **multiplayer trivia game API** built with Bun, TypeScript, Express.js, PostgreSQL (Prisma ORM), and Socket.io for real-time features.

**Key Features:**
- Multi-method authentication (email, phone, OAuth)
- Room-based multiplayer gameplay with real-time events
- Question pack creation and management
- Friend system with online status
- Direct messaging and notifications
- JWT authentication with refresh tokens

---

## Architecture

### Folder Structure
```
/backend
  /src
    /routes           # API route definitions (auth, rooms, packs, friends, etc.)
    /controllers      # Request handlers (business logic entry points)
    /services         # Business logic layer (reusable services)
    /middlewares      # Express middleware (auth, validation, error handling, rate limiting)
    /validators       # Joi validation schemas
    /socket           # Socket.io setup and event handlers
      /handlers       # Organized socket event handlers (room, game, chat, dm)
    /utils            # Utility functions (tokens, passwords, errors, response formatter)
    /config           # Configuration files (database, swagger)
    /__tests__        # Test files (unit, integration)
      /unit           # Unit tests
      /integration    # Integration tests
    /types            # TypeScript type definitions
    server.ts         # Application entry point
  /prisma
    schema.prisma     # Database schema
    /migrations       # Database migration files
  package.json
  tsconfig.json
```

---

## Database Schema (Prisma)

### Core Models

**User**
- UUID primary key + autoincrement Game ID (numeric, starts at 100000)
- Multi-auth support: email, phone (with OTP verification), OAuth (Google, Facebook)
- Profile fields: displayName, bio, avatar
- Timestamps: createdAt, lastLogin

**Pack**
- User-created question sets
- Visibility: PUBLIC, PRIVATE, FRIENDS
- Difficulty: EASY, MEDIUM, HARD
- Published flag (requires 5-15 questions to publish)
- Category, rating, times played

**Question**
- Belongs to Pack
- Types: SINGLE (single choice), MULTIPLE (multiple choice), TRUE_FALSE
- Options and correct answers stored as JSON
- Media support: IMAGE, VIDEO, AUDIO
- Time limit and point value per question

**Room**
- 6-character join code (unique, collision handling)
- Status: WAITING, PLAYING, FINISHED, CLOSED
- Creator + members with roles (CREATOR, ADMIN, MEMBER)
- Selected pack reference
- Optional password (bcrypt hashed)
- Settings as JSON

**RoomMember**
- Links User to Room
- Score tracking
- Ready status
- Active flag
- Role assignment

**PlayerAnswer**
- Tracks each player's answer per question
- Bet amount (confidence points 1-10)
- Correctness, points earned, time to answer

**Friendship**
- Bidirectional relationship
- Status: PENDING, ACCEPTED, REJECTED, BLOCKED
- Request and response timestamps

**Message**
- Types: ROOM (room chat), PRIVATE (DM), SYSTEM, ROOM_INVITE
- Read status tracking
- Timestamp

**Notification**
- Types: ROOM_INVITE, FRIEND_REQUEST, FRIEND_ACCEPTED, SYSTEM
- Action data as JSON
- Read status

---

## API Design Standards

### 1. RESTful Conventions

**HTTP Methods:**
- `GET` - Retrieve resources (no side effects)
- `POST` - Create new resources
- `PUT` - Full update (replace entire resource)
- `PATCH` - Partial update (update specific fields)
- `DELETE` - Remove resources

**URL Structure:**
```
/api/[resource]              # Collection
/api/[resource]/:id          # Specific item
/api/[resource]/:id/[sub]    # Nested resource
```

**Examples:**
```
GET    /api/packs           # List packs
POST   /api/packs           # Create pack
GET    /api/packs/:id       # Get specific pack
PUT    /api/packs/:id       # Update pack
DELETE /api/packs/:id       # Delete pack
POST   /api/packs/:id/publish  # Publish pack (action)
```

---

### 2. Response Format

**All responses use standardized format** via `responseFormatter.ts`:

**Success Response:**
```typescript
{
  success: true,
  data: { /* actual data */ },
  message: "Optional success message",
  meta?: { /* pagination, etc. */ }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    message: "Human-readable error message",
    code: "ERROR_CODE",
    details?: { /* validation errors, etc. */ }
  }
}
```

**Usage:**
```typescript
import { successResponse, errorResponse } from '@/utils/responseFormatter';

// Success
return res.json(successResponse(data, 'Pack created successfully'));

// Error (handled by error middleware automatically)
throw new NotFoundError('Pack not found');
```

---

### 3. Pagination

**Query Parameters:**
```typescript
?page=1&limit=20&sortBy=createdAt&order=desc
```

**Response includes meta:**
```typescript
{
  success: true,
  data: [...],
  meta: {
    page: 1,
    limit: 20,
    total: 156,
    totalPages: 8
  }
}
```

**Cursor-based pagination** for messages:
```typescript
?cursor=lastMessageId&limit=50
```

---

### 4. Filtering & Search

**Query Parameters:**
```typescript
?search=trivia
&category=science
&difficulty=EASY
&status=WAITING
```

**Example:**
```typescript
GET /api/packs?search=science&difficulty=EASY&page=1&limit=10
```

---

## Authentication & Authorization

### Authentication Methods

1. **Email/Password**
   ```
   POST /api/auth/register
   POST /api/auth/login
   ```

2. **Phone/Password with OTP**
   ```
   POST /api/auth/register/phone
   POST /api/auth/phone/send-code
   POST /api/auth/phone/verify
   POST /api/auth/login/phone
   ```

3. **Game ID + Password**
   ```
   POST /api/auth/login/game-id
   ```

4. **OAuth (Google, Facebook)**
   ```
   POST /api/auth/google
   POST /api/auth/facebook
   ```

---

### JWT Token Management

**Access Token:**
- Short-lived (1-2 hours recommended)
- Stored in `Authorization: Bearer <token>` header
- Contains userId payload

**Refresh Token:**
- Long-lived (7-30 days)
- Used to get new access token
- Endpoint: `POST /api/auth/refresh`

**Token Utilities:**
```typescript
import { generateAccessToken, generateRefreshToken, verifyToken } from '@/utils/tokenUtils';

// Generate tokens
const accessToken = generateAccessToken(user.id);
const refreshToken = generateRefreshToken(user.id);

// Verify token
const payload = verifyToken(token);
```

---

### Middleware

**1. authenticate** - Require valid JWT
```typescript
import { authenticate } from '@/middlewares/auth';

router.get('/protected', authenticate, handler);
```

**2. optionalAuth** - Optional JWT (loads user if present)
```typescript
import { optionalAuth } from '@/middlewares/auth';

router.get('/public', optionalAuth, handler);
// req.user is populated if token provided
```

**3. requireAdmin** - Require admin role
```typescript
import { requireAdmin } from '@/middlewares/auth';

router.delete('/admin/users/:id', authenticate, requireAdmin, handler);
```

**4. requireOwnership** - Resource owner validation
```typescript
import { requireOwnership } from '@/middlewares/auth';

router.delete('/packs/:id', authenticate, requireOwnership('Pack'), handler);
```

---

## Input Validation

**All inputs MUST be validated** using Joi schemas.

**Validator Location:** `/src/validators/[resource]Validator.ts`

**Example Validator:**
```typescript
// /src/validators/packValidator.ts
import Joi from 'joi';

export const createPackSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  category: Joi.string().required(),
  difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').required(),
  visibility: Joi.string().valid('PUBLIC', 'PRIVATE', 'FRIENDS').default('PUBLIC'),
});
```

**Usage in Routes:**
```typescript
import { validate } from '@/middlewares/validation';
import { createPackSchema } from '@/validators/packValidator';

router.post('/packs', authenticate, validate(createPackSchema), createPack);
```

**Validation Middleware** automatically returns:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "title", "message": "Title is required" }
    ]
  }
}
```

---

## Error Handling

### Error Classes

**Import from:** `/src/utils/errors.ts`

```typescript
import { AppError, ValidationError, UnauthorizedError, NotFoundError, ConflictError } from '@/utils/errors';

// Usage
throw new NotFoundError('Pack not found');
throw new UnauthorizedError('Invalid credentials');
throw new ConflictError('Email already exists');
throw new ValidationError('Invalid input data');
```

**Available Error Classes:**
- `AppError` - Base class (custom status codes 200-599)
- `ValidationError` - 400
- `UnauthorizedError` - 401
- `ForbiddenError` - 403
- `NotFoundError` - 404
- `ConflictError` - 409
- `InternalServerError` - 500

---

### Global Error Handler

**Location:** `/src/middlewares/errorHandler.ts`

**Handles:**
- Custom AppError instances
- Prisma errors (unique constraint, not found)
- Validation errors
- Unexpected errors

**Automatically formats errors:**
```typescript
// Production mode
{
  "success": false,
  "error": {
    "message": "Pack not found",
    "code": "NOT_FOUND"
  }
}

// Development mode (includes stack trace)
{
  "success": false,
  "error": {
    "message": "Pack not found",
    "code": "NOT_FOUND",
    "stack": "..."
  }
}
```

**Never catch errors manually** - throw and let global handler manage:
```typescript
// ✅ GOOD
if (!pack) {
  throw new NotFoundError('Pack not found');
}

// ❌ BAD - Don't catch manually
try {
  // ...
} catch (error) {
  return res.status(404).json({ error: 'Not found' });
}
```

---

## Service Layer Pattern

**Business logic belongs in services, NOT controllers.**

**Controller (Thin):**
```typescript
// /src/controllers/packController.ts
import { PackService } from '@/services/packService';

export async function createPack(req: Request, res: Response) {
  const pack = await PackService.createPack(req.user!.id, req.body);
  return res.json(successResponse(pack, 'Pack created successfully'));
}
```

**Service (Business Logic):**
```typescript
// /src/services/packService.ts
import { prisma } from '@/config/database';

export class PackService {
  static async createPack(userId: string, data: CreatePackDto) {
    // Validation, business rules, database operations
    const pack = await prisma.pack.create({
      data: {
        ...data,
        creatorId: userId,
        published: false,
      },
    });

    return pack;
  }

  static async publishPack(packId: string, userId: string) {
    // Validation: must have 5-15 questions
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      include: { questions: true },
    });

    if (!pack) throw new NotFoundError('Pack not found');
    if (pack.creatorId !== userId) throw new ForbiddenError('Not pack owner');
    if (pack.questions.length < 5 || pack.questions.length > 15) {
      throw new ValidationError('Pack must have 5-15 questions to publish');
    }

    return prisma.pack.update({
      where: { id: packId },
      data: { published: true },
    });
  }
}
```

---

## Real-time (Socket.io)

### Connection Setup

**Location:** `/src/socket/index.ts`

**Authentication Middleware:**
```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new Error('User not found'));

    socket.data.userId = user.id;
    socket.data.username = user.username;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});
```

---

### Event Handlers

**Organize handlers by feature** in `/src/socket/handlers/`

**Files:**
- `roomHandlers.ts` - Room events (join, leave, ready, kick)
- `gameHandlers.ts` - Game events (start, answer, next, finish)
- `chatHandlers.ts` - Room chat and typing indicators
- `dmHandlers.ts` - Direct messaging
- `friendHandlers.ts` - Friend online/offline status (TODO: create this file)

**Handler Structure:**
```typescript
// /src/socket/handlers/roomHandlers.ts
import { Server, Socket } from 'socket.io';
import { prisma } from '@/config/database';

export function registerRoomHandlers(io: Server, socket: Socket) {
  // Join room
  socket.on('room:join', async (roomId: string) => {
    try {
      const userId = socket.data.userId;

      // Join socket room
      await socket.join(roomId);

      // Notify others
      socket.to(roomId).emit('room:playerJoined', {
        userId,
        username: socket.data.username,
      });

      // Confirm to sender
      socket.emit('room:joined', { roomId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('room:leave', async (roomId: string) => {
    await socket.leave(roomId);
    socket.to(roomId).emit('room:playerLeft', { userId: socket.data.userId });
  });

  // On disconnect
  socket.on('disconnect', async () => {
    // Clean up rooms
    const rooms = Array.from(socket.rooms);
    for (const roomId of rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('room:playerLeft', { userId: socket.data.userId });
      }
    }
  });
}
```

---

### Broadcasting Events

**To specific room:**
```typescript
io.to(roomId).emit('room:updated', updatedRoom);
```

**To specific user:**
```typescript
const userSockets = await io.in(userId).fetchSockets();
userSockets.forEach(s => s.emit('notification:new', notification));
```

**To all except sender:**
```typescript
socket.to(roomId).emit('game:playerAnswered', { userId: socket.data.userId });
```

**To everyone:**
```typescript
io.emit('system:announcement', message);
```

---

### REST + Socket Integration

**IMPORTANT:** When REST endpoints modify shared state, MUST emit socket events.

**Example:**
```typescript
// /src/routes/roomRoutes.ts
router.patch('/:id', authenticate, async (req, res) => {
  const room = await RoomService.updateRoom(req.params.id, req.body);

  // ✅ IMPORTANT: Broadcast update to room members
  const io = req.app.get('io');
  io.to(room.id).emit('room:updated', room);

  return res.json(successResponse(room));
});
```

**Checklist for REST endpoints:**
- [ ] Room created/updated → emit `room:updated`
- [ ] Player kicked → emit `room:kicked`
- [ ] Friend request sent → emit `friend:requestSent`
- [ ] Message sent → emit `dm:message` or `chat:message`
- [ ] Notification created → emit `notification:new`

---

## Rate Limiting

**General Rate Limiter:**
- 100 requests per 15 minutes
- Applied to all routes by default

**Strict Auth Rate Limiter:**
- 5 requests per 15 minutes
- Applied to auth routes (login, register, password reset)

**Configuration:** `/src/middlewares/rateLimiter.ts`

**Environment Variables:**
```
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
```

**Custom Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit';

const customLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests from this IP',
});

router.post('/send-message', customLimiter, sendMessage);
```

---

## Security Best Practices

### 1. Password Hashing
**Always use bcrypt** via `passwordUtils.ts`:
```typescript
import { hashPassword, comparePassword } from '@/utils/passwordUtils';

// Hash before saving
const hashedPassword = await hashPassword(plainPassword);

// Compare on login
const isValid = await comparePassword(plainPassword, hashedPassword);
```

---

### 2. Input Sanitization
- ✅ Use Joi validation on ALL inputs
- ✅ Never trust user input
- ✅ Validate UUIDs with `isValidUuid()` helper
- ✅ Trim strings, lowercase emails

---

### 3. SQL Injection Prevention
- ✅ Use Prisma ORM (parameterized queries)
- ❌ Never concatenate SQL strings

---

### 4. Authentication
- ✅ Use JWT with short expiry
- ✅ Store tokens securely (httpOnly cookies for web, secure storage for mobile)
- ✅ Refresh tokens for long sessions
- ❌ Never expose sensitive data in JWT payload

---

### 5. Authorization
- ✅ Check ownership before modification
- ✅ Use `requireOwnership` middleware
- ✅ Verify user roles (admin, creator)
- ❌ Never trust client-provided user IDs

---

### 6. Error Messages
- ✅ Generic error messages in production ("Invalid credentials" not "Email not found")
- ✅ Detailed errors in development only
- ❌ Never leak system details (database errors, file paths)

---

### 7. CORS
- ✅ Configure allowed origins explicitly
- ❌ Never use `*` in production

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));
```

---

### 8. Headers
**Helmet.js** configured for security headers:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
    },
  },
}));
```

---

## Testing Standards

### Test Organization

**Unit Tests:** `/src/__tests__/unit/`
- Test individual functions/methods in isolation
- Mock dependencies (database, external APIs)
- Fast execution

**Integration Tests:** `/src/__tests__/integration/`
- Test complete workflows (register → login → create room)
- Use real database (test environment)
- Verify database state

**Socket Tests:** `/src/__tests__/socket/`
- Test socket event handlers
- Mock socket connections
- Verify broadcasts

---

### Test File Naming

```
[filename].test.ts         # Unit tests
[feature].integration.test.ts   # Integration tests
```

**Examples:**
```
authValidators.test.ts
gameService.test.ts
rooms.integration.test.ts
roomHandlers.test.ts
```

---

### Test Structure

**Use Bun's built-in test runner:**
```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { AppError } from '@/utils/errors';

describe('AppError', () => {
  it('should create error with message and status code', () => {
    const error = new AppError('Test error', 500);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.stack).toBeDefined();
  });

  it('should default to status code 500', () => {
    const error = new AppError('Test error');

    expect(error.statusCode).toBe(500);
  });
});
```

---

### Testing Services

**Mock Prisma client:**
```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PackService } from '@/services/packService';
import { prisma } from '@/config/database';

// Mock prisma
mock.module('@/config/database', () => ({
  prisma: {
    pack: {
      create: mock(() => Promise.resolve({ id: '123', title: 'Test' })),
      findUnique: mock(() => Promise.resolve(null)),
    },
  },
}));

describe('PackService', () => {
  it('should create pack', async () => {
    const pack = await PackService.createPack('user-id', {
      title: 'Test Pack',
      category: 'Science',
      difficulty: 'EASY',
    });

    expect(pack.title).toBe('Test');
  });
});
```

---

### Integration Test Setup

**Test database:**
```typescript
import { beforeAll, afterAll } from 'bun:test';
import { prisma } from '@/config/database';

beforeAll(async () => {
  // Reset database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  // Seed test data if needed
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

---

## Logging

**Use Winston logger** from `/src/utils/logger.ts`

```typescript
import { logger } from '@/utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Failed to create pack', { error: error.message, userId });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

**Log Levels:**
- `error` - Errors that need attention
- `warn` - Warnings (rate limits, deprecated features)
- `info` - General information (user actions)
- `debug` - Debugging information (development only)

**Structured Logging:**
```typescript
logger.info('Pack created', {
  userId: user.id,
  packId: pack.id,
  packTitle: pack.title,
  timestamp: new Date(),
});
```

---

## Environment Variables

**Required Environment Variables:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fahman"

# Server
PORT=3000
BASE_URL="http://localhost:3000"
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3001"

# JWT (add these!)
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_REFRESH_EXPIRES_IN="7d"

# OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
FACEBOOK_APP_ID="your-facebook-app-id"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Redis (optional, for production)
REDIS_URL="redis://localhost:6379"
```

**Access in code:**
```typescript
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
```

---

## Database Migrations (Prisma)

### Common Commands

**Create migration:**
```bash
bun prisma migrate dev --name add-user-bio
```

**Apply migrations:**
```bash
bun prisma migrate deploy
```

**Reset database (dev only):**
```bash
bun prisma migrate reset
```

**Generate Prisma Client:**
```bash
bun prisma generate
```

**Open Prisma Studio:**
```bash
bun prisma studio
```

---

### Schema Changes

**Always create migrations for schema changes:**

1. Edit `prisma/schema.prisma`
2. Run `bun prisma migrate dev --name descriptive-name`
3. Commit migration files to git
4. Never edit migration files manually

**Example Migration:**
```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  bio         String?  // New field
  createdAt   DateTime @default(now())
}
```

---

## API Documentation (Swagger)

**Access:** `http://localhost:3000/api-docs`

**Configuration:** `/src/config/swagger.ts`

**Document endpoints with JSDoc:**
```typescript
/**
 * @swagger
 * /api/packs:
 *   post:
 *     summary: Create a new pack
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [EASY, MEDIUM, HARD]
 *     responses:
 *       200:
 *         description: Pack created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/packs', authenticate, validate(createPackSchema), createPack);
```

---

## Coding Standards

### 1. TypeScript
- ✅ Use strict mode
- ✅ Type all function parameters and return values
- ✅ Use interfaces for DTOs
- ❌ Avoid `any` type

```typescript
// ✅ GOOD
interface CreatePackDto {
  title: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

async function createPack(data: CreatePackDto): Promise<Pack> {
  // ...
}

// ❌ BAD
async function createPack(data: any) {
  // ...
}
```

---

### 2. Async/Await
- ✅ Use async/await, not callbacks or `.then()`
- ✅ Let error handler catch errors (don't catch manually)
- ❌ Don't nest promises

```typescript
// ✅ GOOD
async function getPackWithQuestions(packId: string) {
  const pack = await prisma.pack.findUnique({
    where: { id: packId },
    include: { questions: true },
  });

  if (!pack) {
    throw new NotFoundError('Pack not found');
  }

  return pack;
}

// ❌ BAD
function getPackWithQuestions(packId: string) {
  return prisma.pack.findUnique({ where: { id: packId } })
    .then(pack => {
      if (!pack) throw new Error('Not found');
      return pack;
    })
    .catch(error => {
      console.error(error);
      throw error;
    });
}
```

---

### 3. File Organization
- Max 300 lines per file - split into smaller modules if exceeded
- One resource per route file (e.g., `packRoutes.ts`, `roomRoutes.ts`)
- Group related functions in services

---

### 4. Naming Conventions
- Files: `camelCase.ts` (e.g., `packService.ts`, `roomHandlers.ts`)
- Classes: `PascalCase` (e.g., `PackService`, `RoomService`)
- Functions: `camelCase` (e.g., `createPack`, `joinRoom`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_PLAYERS`, `DEFAULT_LIMIT`)

---

### 5. Import Order
1. Node.js built-ins
2. Third-party packages
3. Local imports (utils, services, types)
4. Types

```typescript
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { PackService } from '@/services/packService';
import { successResponse } from '@/utils/responseFormatter';
import { NotFoundError } from '@/utils/errors';
import type { Pack } from '@prisma/client';
```

---

### 6. Comments
- Add JSDoc for public functions and services
- Explain complex business logic
- Document "why" not "what"

```typescript
/**
 * Publishes a pack after validating it has 5-15 questions.
 * Only the pack creator can publish their own packs.
 *
 * @param packId - UUID of the pack to publish
 * @param userId - UUID of the user requesting publish
 * @throws NotFoundError if pack doesn't exist
 * @throws ForbiddenError if user is not the pack creator
 * @throws ValidationError if pack doesn't have 5-15 questions
 * @returns Published pack
 */
static async publishPack(packId: string, userId: string): Promise<Pack> {
  // ...
}
```

---

## Common Patterns

### 1. Create Resource
```typescript
async function createPack(req: Request, res: Response) {
  const userId = req.user!.id;
  const pack = await PackService.createPack(userId, req.body);
  return res.json(successResponse(pack, 'Pack created successfully'));
}
```

---

### 2. Get Resource by ID
```typescript
async function getPack(req: Request, res: Response) {
  const pack = await PackService.getPackById(req.params.id);
  if (!pack) throw new NotFoundError('Pack not found');
  return res.json(successResponse(pack));
}
```

---

### 3. Update Resource (Owner Only)
```typescript
async function updatePack(req: Request, res: Response) {
  const userId = req.user!.id;
  const pack = await PackService.updatePack(req.params.id, userId, req.body);
  return res.json(successResponse(pack, 'Pack updated successfully'));
}

// In service:
static async updatePack(packId: string, userId: string, data: UpdatePackDto) {
  const pack = await prisma.pack.findUnique({ where: { id: packId } });
  if (!pack) throw new NotFoundError('Pack not found');
  if (pack.creatorId !== userId) throw new ForbiddenError('Not pack owner');

  return prisma.pack.update({
    where: { id: packId },
    data,
  });
}
```

---

### 4. Delete Resource (Owner Only)
```typescript
async function deletePack(req: Request, res: Response) {
  const userId = req.user!.id;
  await PackService.deletePack(req.params.id, userId);
  return res.json(successResponse(null, 'Pack deleted successfully'));
}
```

---

### 5. List with Pagination
```typescript
async function listPacks(req: Request, res: Response) {
  const { page = 1, limit = 20, search, category, difficulty } = req.query;

  const result = await PackService.listPacks({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    category: category as string,
    difficulty: difficulty as Difficulty,
  });

  return res.json(successResponse(result.data, undefined, result.meta));
}
```

---

## Performance Optimization

### 1. Database Queries
- ✅ Use indexes on frequently queried fields
- ✅ Use `select` to limit returned fields
- ✅ Use `include` carefully (avoid N+1 queries)
- ✅ Paginate large datasets
- ❌ Don't fetch unnecessary relations

```typescript
// ✅ GOOD - Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    avatar: true,
  },
});

// ❌ BAD - Fetches all fields
const users = await prisma.user.findMany();
```

---

### 2. Caching (Redis)
**TODO:** Implement Redis caching for:
- Friend online status
- Public packs list
- Popular rooms

---

### 3. Socket.io Optimization
- ✅ Use rooms for targeted broadcasts
- ✅ Disconnect idle connections
- ❌ Don't broadcast to all users

---

## Deployment

### Build
```bash
bun build src/server.ts --outdir dist --target bun
```

### Run Production
```bash
NODE_ENV=production bun run dist/server.js
```

### Docker
```dockerfile
FROM imbios/bun-node:latest
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun prisma generate
RUN bun build src/server.ts --outdir dist --target bun
CMD ["bun", "run", "dist/server.js"]
```

---

## Remember

- ✅ Validate ALL inputs with Joi
- ✅ Use service layer for business logic
- ✅ Throw errors, let middleware handle them
- ✅ Broadcast socket events when REST endpoints modify shared state
- ✅ Test critical flows (auth, rooms, gameplay)
- ✅ Document APIs with Swagger
- ✅ Use TypeScript strict mode
- ✅ Keep files under 300 lines
- ❌ Never trust user input
- ❌ Never expose sensitive data in errors
- ❌ Never skip authentication/authorization checks

---

## Questions?

- Check Swagger docs: `http://localhost:3000/api-docs`
- Review test examples: `/src/__tests__/`
- See Prisma schema: `/prisma/schema.prisma`
