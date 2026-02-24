# Backend Implementation Plan

## Progress Tracker

### Phase 1: Core Game - COMPLETED
- [x] Room CRUD endpoints
- [x] Room membership (join/leave/kick)
- [x] Room code generation
- [x] **Game Service** - Answer submission, scoring, question progression
- [x] **Game Controller** - Game state endpoints
- [x] **PlayerAnswer model** - Track individual answers
- [x] **Game Routes** - All game endpoints

### Phase 2: Social - COMPLETED
- [x] Friends list and requests
- [x] User search
- [x] Friend status tracking
- [x] Block/unblock users

### Phase 3: Communication - COMPLETED
- [x] Notifications system
- [x] Room invitations
- [x] **Message Service** - Direct messages, room chat
- [x] **Message Controller** - HTTP handlers for messaging
- [x] **Message Routes** - Conversation endpoints
- [x] **DM WebSocket Events** - Real-time direct messaging

### Phase 4: Real-Time (WebSocket) - COMPLETED
- [x] Socket.io setup with JWT authentication
- [x] Room events (join/leave/player updates/ready status)
- [x] Game events (question, timer, answers, results, finished)
- [x] Chat events (messages, typing indicators)
- [x] Friend status (online/offline notifications)

### Phase 5: Testing & Polish - COMPLETED
- [x] **Unit tests** - 113 tests passing
  - Game service scoring logic
  - Auth validators
  - Message validators
  - Response formatter
  - Custom error classes
- [x] Test infrastructure with Bun test runner
- [ ] Integration tests (optional future work)
- [ ] Rate limiting tuning (optional future work)
- [ ] Security audit (optional future work)

---

## API Endpoints Summary

### Implemented
| Module | Endpoints |
|--------|-----------|
| Auth | `/api/auth/*` - Login, register, OAuth, profile |
| Packs | `/api/packs/*` - CRUD, questions, publish |
| Rooms | `/api/rooms/*` - CRUD, join, leave, start |
| Game | `/api/rooms/:id/game/*` - Answer, next, results, leaderboard |
| Friends | `/api/friends/*` - Requests, accept, block |
| Users | `/api/users/search` - User search |
| Notifications | `/api/notifications/*` - CRUD, room invites |
| Messages | `/api/messages/*` - DMs, room chat, invites |

---

## Database Models

### Implemented
- User, Pack, Question, Room, RoomMember
- Friendship, Notification, Transaction, PackPurchase, GameSession
- **PlayerAnswer** - Individual game answers with scoring
- **Message** - Direct messages and room chat (existing model, extended)

---

## Game Logic (COMPLETED)

### Game Flow
1. Creator starts game → Room status = PLAYING
2. Server sends first question to all players
3. Players submit answers with bet amounts
4. After time limit or all answered → Show results
5. Update scores and move to next question
6. After last question → Show final leaderboard

### Game Endpoints
```
GET  /api/rooms/:id/game                     - Get current game state
POST /api/rooms/:id/game/answer              - Submit answer
POST /api/rooms/:id/game/next                - Move to next question (creator)
GET  /api/rooms/:id/game/results             - Get final results
GET  /api/rooms/:id/game/question/:qid/results - Get question results
GET  /api/rooms/:id/leaderboard              - Get current scores
```

### Scoring Logic
- **Correct answer**: (basePoints + betAmount) × speedMultiplier
- **Wrong answer**: -betAmount
- **Speed multiplier**: 1.0 to 2.0 based on answer speed
- Formula: `speedMultiplier = 1 + (1 - timeTaken/timeLimit)`

---

## WebSocket Events (COMPLETED)

### Server Setup
- Socket.io initialized with HTTP server
- JWT authentication via handshake
- Online user tracking (in-memory, Redis recommended for production)

### Room Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client→Server | Join room socket channel |
| `room:leave` | Client→Server | Leave room socket channel |
| `room:ready` | Client→Server | Set ready status |
| `room:joined` | Server→Client | Room join confirmation |
| `room:playerJoined` | Server→Client | New player joined |
| `room:playerLeft` | Server→Client | Player left |
| `room:playerReady` | Server→Client | Player ready status changed |
| `room:updated` | Server→Client | Room settings updated |
| `room:closed` | Server→Client | Room was closed |
| `room:kicked` | Server→Client | You were kicked |

### Game Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `game:answer` | Client→Server | Submit answer |
| `game:next` | Client→Server | Move to next question |
| `game:started` | Server→Client | Game started |
| `game:question` | Server→Client | New question |
| `game:timerTick` | Server→Client | Timer countdown |
| `game:playerAnswered` | Server→Client | Player submitted answer |
| `game:questionResults` | Server→Client | Question results |
| `game:scoreUpdate` | Server→Client | Updated scores |
| `game:finished` | Server→Client | Game finished with winner |

### Chat Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `chat:message` | Both | Send/receive chat message |
| `chat:typing` | Both | Typing indicator |
| `chat:stopTyping` | Both | Stopped typing |

### Friend Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `friend:status` | Client→Server | Request friends status |
| `friend:statusList` | Server→Client | List of online friends |
| `friend:online` | Server→Client | Friend came online |
| `friend:offline` | Server→Client | Friend went offline |

### Direct Message Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `dm:send` | Client→Server | Send direct message |
| `dm:typing` | Client→Server | Typing indicator |
| `dm:stopTyping` | Client→Server | Stopped typing |
| `dm:read` | Client→Server | Mark messages as read |
| `dm:message` | Server→Client | New DM received |
| `dm:typing` | Server→Client | Sender is typing |
| `dm:stopTyping` | Server→Client | Sender stopped typing |
| `dm:read` | Server→Client | Your messages were read |

---

## Messaging Endpoints (COMPLETED)

```
GET    /api/messages/conversations              - Get all DM conversations
GET    /api/messages/conversations/:userId      - Get messages with a user
PATCH  /api/messages/conversations/:userId/read - Mark conversation as read
POST   /api/messages                            - Send direct message
POST   /api/messages/room-invite                - Send room invite to users
PATCH  /api/messages/read                       - Mark specific messages as read
GET    /api/messages/unread-count               - Get unread message count
GET    /api/messages/room/:roomId               - Get room chat messages
DELETE /api/messages/:id                        - Delete a message
```

---

## Testing (COMPLETED)

### Test Files
```
src/__tests__/
├── utils/
│   └── testSetup.ts           # Test fixtures and helpers
├── unit/
│   ├── gameService.test.ts    # Scoring and answer logic tests
│   ├── authValidators.test.ts # Auth validation schema tests
│   ├── validators.test.ts     # Message validation tests
│   ├── responseFormatter.test.ts # Response utility tests
│   └── errors.test.ts         # Custom error class tests
```

### Test Summary
- **Total tests**: 113
- **Passing**: 113
- **Coverage areas**:
  - Game scoring algorithm (speed bonus, bet multipliers)
  - Answer correctness checking (SINGLE, MULTIPLE, TRUE_FALSE)
  - Auth validation (registration, login, password rules)
  - Message validation (DMs, room invites)
  - Response formatting utilities
  - Custom error classes

### Run Tests
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
```

---

## Implementation Complete

All 5 phases are now complete:
1. ✅ Core Game - Rooms, game logic, scoring
2. ✅ Social - Friends, user search
3. ✅ Communication - Messaging, notifications
4. ✅ Real-Time - WebSocket events
5. ✅ Testing - 113 unit tests

### Optional Future Enhancements
- Integration tests with test database
- Redis adapter for Socket.io (multi-server scaling)
- Load testing and performance optimization
- Security audit and penetration testing
- Error monitoring setup (Sentry, etc.)
