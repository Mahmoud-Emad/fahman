# 🚀 Quick Start with Bun

## Install Bun

### macOS, Linux, and WSL
```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows (PowerShell)
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

Verify installation:
```bash
bun --version
```

## Setup Backend

```bash
# Navigate to backend directory
cd /Users/mahmoud/work/research/fahman/backend

# Install dependencies (super fast with Bun!)
bun install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# Update DATABASE_URL to your PostgreSQL connection string

# Generate Prisma Client
bun run prisma:generate

# Run database migrations
bun run prisma:migrate

# Seed the database with test data
bun run seed

# Start development server with hot reload 🔥
bun run dev
```

Your server will start at `http://localhost:3000`

## Test the API

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Login (save the token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Use the token from login response
export TOKEN="your_access_token_here"

# Get current user
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Get all public packs
curl http://localhost:3000/api/packs

# Create a new pack
curl -X POST http://localhost:3000/api/packs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Quiz",
    "description": "A test quiz pack",
    "category": "general",
    "difficulty": "EASY"
  }'
```

## Available Scripts

```bash
bun run dev              # Development with hot reload
bun run build            # Build for production
bun start                # Start production server
bun run prisma:studio    # Open Prisma Studio (database GUI)
bun run seed             # Reseed database
bun test                 # Run tests
```

## Common Issues

### TypeScript error "Cannot find type definition file for 'bun-types'"
**Solution**: Run `bun install` to install all dependencies including bun-types.

### Database connection error
**Solution**:
1. Make sure PostgreSQL is running: `pg_isready`
2. Check your DATABASE_URL in `.env`
3. Create the database if it doesn't exist: `createdb fahman_dev`

### Port 3000 already in use
**Solution**:
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>
```

Or change the PORT in your `.env` file.

## Why Bun?

- ⚡ **4x faster** package installation than npm
- 🔥 **Native TypeScript** support - no compilation needed for development
- 🎯 **Built-in watch mode** with `--watch` flag
- 📦 **All-in-one** - runtime, bundler, package manager, test runner
- 🔄 **Hot reload** out of the box
- 💯 **100% compatible** with Node.js packages

## Next Steps

1. ✅ Backend is ready
2. 📱 Set up React Native app (use Bun for scripts)
3. 🌐 Set up frontend (use Bun + Vite/Next.js)
4. 🔌 Connect all three together

---

**Happy coding with Bun! 🥟**
