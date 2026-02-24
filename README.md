# Fahman - Multiplayer Quiz/Party Game

A full-stack multiplayer quiz and party game application built with modern technologies.

## 🏗️ Project Structure

```
fahman/
├── backend/              # Backend API (Bun + Express + TypeScript + PostgreSQL)
├── frontend/            # Web frontend (Coming soon)
└── mobile/              # React Native mobile app (Coming soon)
```

## 🚀 Technology Stack

### Backend
- **Runtime**: Bun (ultra-fast JavaScript runtime)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Security**: Helmet.js, rate limiting, input validation

### Frontend (Planned)
- **Framework**: React + Vite or Next.js
- **Package Manager**: Bun
- **Language**: TypeScript

### Mobile (Planned)
- **Framework**: React Native + Expo
- **Package Manager**: Bun (for scripts)
- **Language**: TypeScript

## ✨ Features

### Current (Backend MVP)
- ✅ User authentication (register, login, JWT tokens)
- ✅ Pack management (create, update, delete quiz packs)
- ✅ Question CRUD (with 5-15 question validation)
- ✅ Pack publishing system
- ✅ RESTful API with TypeScript
- ✅ Database migrations and seeding
- ✅ Comprehensive API documentation

### Planned
- 🎮 Multiplayer rooms (public/private with passwords)
- 💬 Real-time chat (room chat + private messages)
- 👥 Friends system
- 🎯 Live quiz gameplay
- 🏆 Leaderboards and scoring
- 💰 Pack marketplace
- 📊 User statistics and achievements

## 📋 Prerequisites

- **Bun** >= 1.0.20 ([Install](https://bun.sh))
- **PostgreSQL** >= 14.x
- **Git**

## 🚀 Quick Start

### 1. Install Bun

```bash
# macOS, Linux, WSL
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd fahman
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
bun run prisma:generate
bun run prisma:migrate
bun run seed

# Start development server
bun run dev
```

Backend will be running at `http://localhost:3000`

See [backend/README.md](backend/README.md) for detailed documentation.

## 📚 Documentation

- [Backend API Documentation](backend/README.md)
- [Quick Start Guide](backend/QUICKSTART.md)
- [API Endpoints](backend/README.md#-api-documentation)

## 🧪 Testing

### Backend API Test

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!"}'

# Get public packs
curl http://localhost:3000/api/packs
```

### Test Users (from seed data)

```
Admin:
  Email: admin@fahman.com
  Password: Admin123!

User 1:
  Email: user1@test.com
  Password: Test123!

User 2:
  Email: user2@test.com
  Password: Test123!
```

## 📁 Project Details

### Backend Architecture

```
backend/
├── src/
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (errors, auth, logger)
│   ├── config/          # Configuration (database)
│   ├── middlewares/     # Express middlewares
│   ├── validators/      # Input validation schemas
│   ├── services/        # Business logic
│   ├── controllers/     # Route handlers
│   ├── routes/          # API routes
│   ├── seeds/           # Database seeds
│   └── server.ts        # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

### Database Schema

**10 Core Models:**
1. User - Authentication and profiles
2. Friendship - Friend connections
3. Pack - Quiz packs (5-15 questions)
4. Question - Quiz questions
5. Room - Game rooms
6. RoomMember - Room participation
7. Message - Chat messages
8. Transaction - Marketplace
9. PackPurchase - Ownership
10. GameSession - Game history

## 🛠️ Development Workflow

```bash
# Backend development
cd backend
bun run dev                 # Start with hot reload
bun run prisma:studio      # Open database GUI
bun test                   # Run tests

# Database management
bun run prisma:migrate     # Run migrations
bun run prisma:reset       # Reset database
bun run seed               # Seed test data

# Code quality
bun run lint               # Lint code
bun run format             # Format code
bun run typecheck          # Type checking
```

## 🚧 Roadmap

### Phase 1: Backend MVP ✅
- [x] Authentication system
- [x] Pack & question management
- [x] Database schema
- [x] RESTful API

### Phase 2: Multiplayer Backend (In Progress)
- [ ] Room system
- [ ] Game session management
- [ ] Real-time gameplay logic
- [ ] Chat system
- [ ] Friends system

### Phase 3: Frontend Web App
- [ ] UI/UX design
- [ ] Authentication pages
- [ ] Pack browser and creator
- [ ] Game room interface
- [ ] Real-time game play

### Phase 4: Mobile App
- [ ] React Native + Expo setup
- [ ] Cross-platform UI components
- [ ] Mobile game interface
- [ ] Push notifications

### Phase 5: Advanced Features
- [ ] WebSocket integration
- [ ] Redis caching
- [ ] Leaderboards
- [ ] Pack marketplace
- [ ] Achievements system
- [ ] Analytics dashboard

## 🤝 Contributing

1. Use Bun for all package management
2. Follow TypeScript best practices
3. Write tests for new features
4. Follow the existing code structure
5. Update documentation

## 📄 License

MIT

## 🔗 Links

- [Bun Documentation](https://bun.sh/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com)

---

**Built with ❤️ using Bun, TypeScript, and modern web technologies**
