# Fahman Backend API

Backend API for Fahman - A Multiplayer Quiz/Party Game built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Pack Management**: Create, publish, and manage quiz packs (5-15 questions enforced)
- **Question System**: Full CRUD operations for questions with validation
- **Room System**: Public/private rooms with password protection (planned)
- **Chat System**: Room chat and private messaging (planned)
- **Friends System**: Friend requests and connections (planned)
- **Marketplace**: Pack buying/selling infrastructure (planned)
- **TypeScript**: Full type safety and modern JavaScript features
- **Security**: Helmet.js, rate limiting, input validation
- **Database**: PostgreSQL with Prisma ORM

## 📋 Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/fahman_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Bcrypt
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX_REQUESTS=5

# Logging
LOG_LEVEL=debug
```

### 4. Database Setup

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed the database with test data:

```bash
npm run seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!",
  "avatar": "https://example.com/avatar.jpg" // optional
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Pack Endpoints

#### Get Public Packs
```http
GET /api/packs?page=1&limit=20&category=trivia&difficulty=EASY&search=quiz
```

#### Get My Packs
```http
GET /api/packs/my
Authorization: Bearer <access_token>
```

#### Get Pack by ID
```http
GET /api/packs/:id
```

#### Create Pack
```http
POST /api/packs
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Science Quiz",
  "description": "Test your science knowledge",
  "category": "science",
  "difficulty": "MEDIUM",
  "visibility": "PUBLIC",
  "price": 0
}
```

#### Update Pack
```http
PUT /api/packs/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Publish Pack
```http
POST /api/packs/:id/publish
Authorization: Bearer <access_token>
```
Note: Pack must have 5-15 questions to be published.

#### Delete Pack
```http
DELETE /api/packs/:id
Authorization: Bearer <access_token>
```

### Question Endpoints

#### Get Pack Questions
```http
GET /api/packs/:packId/questions
```

#### Create Question
```http
POST /api/packs/:packId/questions
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "What is 2 + 2?",
  "options": ["3", "4", "5", "6"],
  "correctAnswers": [1],
  "questionType": "SINGLE",
  "timeLimit": 30,
  "points": 100,
  "orderIndex": 1
}
```

#### Update Question
```http
PUT /api/packs/questions/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Updated question text",
  "timeLimit": 45
}
```

#### Delete Question
```http
DELETE /api/packs/questions/:id
Authorization: Bearer <access_token>
```

#### Bulk Create Questions
```http
POST /api/packs/:packId/questions/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "questions": [
    {
      "text": "Question 1?",
      "options": ["A", "B", "C", "D"],
      "correctAnswers": [0],
      "questionType": "SINGLE",
      "orderIndex": 1
    },
    {
      "text": "Question 2?",
      "options": ["A", "B", "C", "D"],
      "correctAnswers": [1],
      "questionType": "SINGLE",
      "orderIndex": 2
    }
  ]
}
```

## 🗄️ Database Schema

### Core Models

- **User**: Authentication, profiles, roles
- **Friendship**: Friend connections
- **Pack**: Quiz packs (5-15 questions enforced)
- **Question**: Questions with options and answers
- **Room**: Game rooms
- **RoomMember**: User-room relationships
- **Message**: Chat messages
- **Transaction**: Pack purchases
- **PackPurchase**: Ownership tracking
- **GameSession**: Game history

### Key Constraints

- **Pack Question Count**: 5-15 questions required for publishing
- **Unique Constraints**: username, email, room-user pairs
- **Cascade Deletes**: Deleting a pack deletes all its questions
- **Foreign Keys**: Enforced referential integrity

## 📝 Scripts

```bash
# Development
npm run dev                 # Start development server with auto-reload

# Build
npm run build              # Compile TypeScript to JavaScript

# Production
npm start                  # Start production server

# Database
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run database migrations
npm run prisma:studio      # Open Prisma Studio GUI
npm run seed               # Seed database with test data

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier

# Testing
npm test                   # Run tests with coverage
npm run test:watch         # Run tests in watch mode
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with configurable rounds
- **Rate Limiting**:
  - General: 100 requests/15min
  - Auth: 5 requests/15min
- **Helmet.js**: Security headers
- **CORS**: Configured origins
- **Input Validation**: Joi schemas on all endpoints
- **SQL Injection Prevention**: Prisma ORM with parameterized queries

## 📊 Project Structure

```
backend/
├── src/
│   ├── config/           # Database and configuration
│   ├── controllers/      # Request handlers
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── validators/       # Joi validation schemas
│   ├── seeds/            # Database seeds
│   └── server.ts         # Application entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── dist/                 # Compiled JavaScript
├── logs/                 # Log files (production)
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## 🧪 Testing

### Test Users (from seed)

```
Admin:
  Email: admin@fahman.com
  Password: Admin123!

Test User 1:
  Email: user1@test.com
  Password: Test123!

Test User 2:
  Email: user2@test.com
  Password: Test123!
```

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚧 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication
- [x] Pack management
- [x] Question CRUD
- [x] Pack validation (5-15 questions)

### Phase 2: Multiplayer (Planned)
- [ ] Room system
- [ ] Room members and roles
- [ ] Game session management
- [ ] Real-time game logic

### Phase 3: Social Features (Planned)
- [ ] Friends system
- [ ] Private messaging
- [ ] Room chat

### Phase 4: Marketplace (Planned)
- [ ] Pack transactions
- [ ] Payment integration
- [ ] Revenue tracking

### Phase 5: Enhancements (Future)
- [ ] WebSocket integration (Socket.io)
- [ ] Redis caching
- [ ] File uploads (avatars, media)
- [ ] Leaderboards
- [ ] Pack ratings & reviews
- [ ] Achievement system

## 🤝 Contributing

1. Follow TypeScript best practices
2. Write clear, concise code with comments
3. Validate all inputs with Joi schemas
4. Use Prisma for database operations
5. Handle errors properly with custom error classes
6. Follow the existing project structure

## 📄 License

MIT

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npm run prisma:migrate reset
```

### TypeScript Errors

```bash
# Regenerate Prisma Client
npm run prisma:generate

# Clean and rebuild
rm -rf dist && npm run build
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## 📞 Support

For issues and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed information

---

**Built with ❤️ using Node.js, Express, TypeScript, and Prisma**
