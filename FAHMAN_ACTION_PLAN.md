# Fahman App - Structured Action Plan
**Generated:** February 15, 2026
**Goal:** Complete missing features, fix integration gaps, and improve code quality

---

## Overview

This action plan is organized into **4 sprints** (2 weeks each) to bring Fahman from 70% to 95% completion.

**Current Status:**
- Backend: 90% complete (missing admin features, Redis integration)
- Mobile: 80% complete (missing UI for backend features)
- Integration: 70% (30% of backend features not integrated)
- Testing: 10% (critical gap)

**Target Status After Plan:**
- Backend: 95% complete
- Mobile: 95% complete
- Integration: 95%
- Testing: 70%

---

## Sprint 1: Critical Integrations (Week 1-2)

**Goal:** Connect all existing backend features to mobile app

### Task 1.1: Implement Missing Service Methods (Backend ✅ → Mobile ⚠️)
**Duration:** 2 days | **Priority:** 🔴 Critical

**File:** `/app/src/services/roomsService.ts`
- [ ] Add `getMyRooms()` method to fetch user's active rooms
  ```typescript
  async getMyRooms(): Promise<ApiResponse<Room[]>> {
    return api.get<Room[]>('/rooms/my');
  }
  ```

**File:** `/app/src/services/friendsService.ts`
- [ ] Add `getBlockedUsers()` method
  ```typescript
  async getBlockedUsers(): Promise<ApiResponse<User[]>> {
    return api.get<User[]>('/friends/blocked');
  }
  ```
- [ ] Add `getFriendshipStatus(userId: string)` method
  ```typescript
  async getFriendshipStatus(userId: string): Promise<ApiResponse<FriendshipStatus>> {
    return api.get<FriendshipStatus>(`/friends/status/${userId}`);
  }
  ```
- [ ] Add `sendFriendRequestByIdentifier(identifier: string)` method
  ```typescript
  async sendFriendRequestByIdentifier(identifier: string): Promise<ApiResponse<void>> {
    return api.post<void>('/friends/request/find', { identifier });
  }
  ```

**File:** `/app/src/services/messagesService.ts`
- [ ] Add `deleteNotification(notificationId: string)` method
  ```typescript
  async deleteNotification(notificationId: string): Promise<ApiResponse<null>> {
    return api.delete<null>(`/notifications/${notificationId}`);
  }
  ```
- [ ] Add `clearReadNotifications()` method
  ```typescript
  async clearReadNotifications(): Promise<ApiResponse<null>> {
    return api.delete<null>('/notifications/clear-read');
  }
  ```
- [ ] Add `getNotification(notificationId: string)` method
  ```typescript
  async getNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    return api.get<Notification>(`/notifications/${notificationId}`);
  }
  ```

**Acceptance Criteria:**
- All service methods have TypeScript types
- Methods follow existing naming conventions
- Error handling consistent with existing patterns

---

### Task 1.2: Create Sent Friend Requests UI
**Duration:** 1 day | **Priority:** 🔴 Critical

**File:** Create `/app/src/screens/SentFriendRequestsScreen.tsx`
- [ ] Create new screen to display sent friend requests
- [ ] Show request status (pending, accepted, declined)
- [ ] Add "Cancel Request" button using `cancelFriendRequest()`
- [ ] Show empty state when no sent requests
- [ ] Add to navigation stack

**File:** Update `/app/src/components/friends/FriendsListModal.tsx`
- [ ] Add third tab: "Sent Requests"
- [ ] Display sent requests using `getSentRequests()` from friendsService
- [ ] Show timestamp and request status
- [ ] Add cancel button for each request

**Acceptance Criteria:**
- Users can view all sent friend requests
- Users can cancel pending requests
- UI updates after cancel action
- Loading states and error handling

---

### Task 1.3: Create Blocked Users Management UI
**Duration:** 1 day | **Priority:** 🔴 Critical

**File:** Create `/app/src/screens/BlockedUsersScreen.tsx`
- [ ] Create screen to display blocked users
- [ ] Show user avatar, username, game ID
- [ ] Add "Unblock" button using `unblockUser()`
- [ ] Show empty state with helpful message
- [ ] Add to settings screen

**File:** Update `/app/src/screens/SettingsScreen.tsx`
- [ ] Add "Blocked Users" option in Privacy section
- [ ] Link to BlockedUsersScreen

**Acceptance Criteria:**
- Users can view all blocked users
- Users can unblock users
- Confirmation dialog before unblock
- UI updates after unblock action

---

### Task 1.4: Implement Message Deletion
**Duration:** 1 day | **Priority:** 🔴 Critical

**File:** Update `/app/src/components/messaging/DirectMessageBubble.tsx`
- [ ] Add long-press gesture detector
- [ ] Show action sheet menu with "Delete Message" option (only for own messages)
- [ ] Call `deleteMessage()` from messagesService
- [ ] Show confirmation dialog before deletion
- [ ] Remove message from UI after deletion

**File:** Update `/app/src/components/messaging/ChatDetailsModal.tsx`
- [ ] Pass message deletion handler to DirectMessageBubble
- [ ] Update messages state after deletion
- [ ] Show toast notification on success/error

**Acceptance Criteria:**
- Users can long-press own messages
- Action sheet appears with "Delete" option
- Confirmation dialog prevents accidental deletion
- Message removed from UI immediately
- Toast notification confirms action

---

### Task 1.5: Implement Notification Deletion
**Duration:** 1 day | **Priority:** 🟡 High

**File:** Update `/app/src/components/messaging/NotificationItem.tsx`
- [ ] Add swipe-to-delete gesture
- [ ] Show delete confirmation
- [ ] Call `deleteNotification()` from messagesService
- [ ] Remove from UI after deletion

**File:** Update `/app/src/components/messaging/NotificationsModal.tsx`
- [ ] Add "Clear All Read" button in header
- [ ] Call `clearReadNotifications()` from messagesService
- [ ] Update notification list after clearing
- [ ] Show confirmation dialog

**Acceptance Criteria:**
- Users can swipe to delete individual notifications
- Users can clear all read notifications
- Confirmation prevents accidental deletion
- UI updates correctly after deletion

---

### Task 1.6: Add My Active Rooms Feature
**Duration:** 0.5 days | **Priority:** 🟡 High

**File:** Update `/app/src/screens/RoomsScreen.tsx`
- [ ] Add "My Rooms" filter option
- [ ] Call `getMyRooms()` from roomsService
- [ ] Display user's active rooms separately
- [ ] Add quick rejoin functionality

**Acceptance Criteria:**
- Users can view their active rooms
- List shows room status (waiting, playing, finished)
- Users can rejoin rooms quickly

---

### Sprint 1 Summary
- **Duration:** 2 weeks
- **Tasks:** 6
- **Files Modified/Created:** 10
- **Priority:** 🔴 Critical
- **Outcome:** 90% backend integration complete

---

## Sprint 2: Real-time & Socket Improvements (Week 3-4)

**Goal:** Fix REST/Socket integration gaps and improve real-time features

### Task 2.1: Broadcast Room Updates from REST Endpoints
**Duration:** 1 day | **Priority:** 🔴 Critical

**File:** `/backend/src/routes/roomRoutes.ts`
- [ ] Import `getRoomSockets()` helper from socket utils
- [ ] After successful PATCH `/rooms/:id`, emit `room:updated` to room
  ```typescript
  // After room update
  const io = req.app.get('io');
  io.to(roomId).emit('room:updated', updatedRoom);
  ```

**File:** `/backend/src/socket/utils/roomUtils.ts` (create if needed)
- [ ] Create helper to get all sockets in a room
- [ ] Create helper to broadcast to room

**Acceptance Criteria:**
- Room updates via REST trigger socket broadcast
- All players in room receive update immediately
- Mobile app reflects changes without refresh

---

### Task 2.2: Add Friend Request Socket Events
**Duration:** 1 day | **Priority:** 🟡 High

**File:** Create `/backend/src/socket/handlers/friendHandlers.ts`
- [ ] Move friend online/offline logic from `socket/index.ts`
- [ ] Add new events:
  - `friend:requestSent` - Notify when friend request received
  - `friend:requestAccepted` - Notify when request accepted
  - `friend:requestDeclined` - Notify when request declined

**File:** `/backend/src/routes/friendRoutes.ts`
- [ ] After sending friend request, emit `friend:requestSent` to recipient
- [ ] After accepting request, emit `friend:requestAccepted` to both users
- [ ] After declining request, emit `friend:requestDeclined` to requester

**File:** `/app/src/services/socketService.ts`
- [ ] Add listeners for new friend events
- [ ] Update friend request state in real-time
- [ ] Show toast notification when request received

**Acceptance Criteria:**
- Friend requests appear in real-time (no refresh needed)
- Accepted requests show immediately
- Declined requests remove from UI

---

### Task 2.3: Implement Real-time Score Updates
**Duration:** 1 day | **Priority:** 🟡 High

**File:** `/backend/src/socket/handlers/gameHandlers.ts`
- [ ] Emit `game:scoreUpdate` immediately after each answer submission
- [ ] Include current rankings in payload
- [ ] Currently only broadcasts after question ends - change to broadcast on each answer

**File:** `/app/src/components/game/phases/AnsweringPhase.tsx`
- [ ] Update leaderboard when `game:scoreUpdate` received
- [ ] Show animation when player answers

**Acceptance Criteria:**
- Leaderboard updates as each player answers
- Smooth animation for score changes
- No lag in score display

---

### Task 2.4: Add Friend Online Status REST Endpoint
**Duration:** 1 day | **Priority:** 🟡 High

**File:** `/backend/src/routes/friendRoutes.ts`
- [ ] Update `GET /friends` to include `isOnline` field
- [ ] Query online users from socket server
- [ ] Return list with online status

**File:** `/app/src/services/friendsService.ts`
- [ ] Update `getFriends()` response type to include `isOnline: boolean`
- [ ] Display online status in friends list

**Acceptance Criteria:**
- Friends list shows online/offline on cold start
- No need to wait for socket connection
- Real-time updates still work via socket

---

### Task 2.5: Add Ready Status REST Endpoint
**Duration:** 0.5 days | **Priority:** 🟡 High

**File:** `/backend/src/routes/roomRoutes.ts`
- [ ] Add `POST /rooms/:id/ready` endpoint (currently only socket event)
- [ ] Set player ready status
- [ ] Emit `room:playerReady` socket event

**Acceptance Criteria:**
- Players can set ready status via REST if socket fails
- Fallback mechanism for connection issues

---

### Sprint 2 Summary
- **Duration:** 2 weeks
- **Tasks:** 5
- **Files Modified/Created:** 8
- **Priority:** 🔴 Critical + 🟡 High
- **Outcome:** Real-time features fully functional

---

## Sprint 3: Testing & Quality (Week 5-6)

**Goal:** Add comprehensive testing for backend and mobile

### Task 3.1: Backend Socket Handler Tests
**Duration:** 3 days | **Priority:** 🔴 Critical

**Files:** Create test files in `/backend/src/__tests__/socket/`
- [ ] `roomHandlers.test.ts` - Test all room events (join, leave, ready, kick)
- [ ] `gameHandlers.test.ts` - Test game events (start, answer, next, finish)
- [ ] `chatHandlers.test.ts` - Test chat and typing indicators
- [ ] `dmHandlers.test.ts` - Test direct messaging and read receipts
- [ ] `friendHandlers.test.ts` - Test friend online/offline notifications

**Test Coverage:**
- [ ] Socket authentication middleware
- [ ] Event payloads validation
- [ ] Error handling (invalid data, unauthorized)
- [ ] Broadcast to correct recipients
- [ ] State changes in database

**Acceptance Criteria:**
- All socket handlers have unit tests
- Test coverage > 70% for socket layer
- All tests pass in CI/CD

---

### Task 3.2: Backend Integration Tests
**Duration:** 2 days | **Priority:** 🔴 Critical

**Files:** Create test files in `/backend/src/__tests__/integration/`
- [ ] `auth.integration.test.ts` - Test complete auth flow (register → login → refresh → logout)
- [ ] `rooms.integration.test.ts` - Test room creation → join → start → play → finish flow
- [ ] `friends.integration.test.ts` - Test friend request flow (send → accept → message)
- [ ] `packs.integration.test.ts` - Test pack creation → add questions → publish flow

**Test Coverage:**
- [ ] Full API workflows end-to-end
- [ ] Database state verification
- [ ] Error scenarios (duplicate, not found, unauthorized)

**Acceptance Criteria:**
- Critical flows have integration tests
- Tests use real database (test environment)
- All tests pass consistently

---

### Task 3.3: Mobile Service Layer Tests
**Duration:** 2 days | **Priority:** 🔴 Critical

**Files:** Create test files in `/app/src/__tests__/services/`
- [ ] `authService.test.ts` - Test all auth methods with mocked API
- [ ] `roomsService.test.ts` - Test room operations
- [ ] `friendsService.test.ts` - Test friend operations
- [ ] `messagesService.test.ts` - Test messaging and notifications
- [ ] `packsService.test.ts` - Test pack operations
- [ ] `socketService.test.ts` - Test connection, reconnection, event listeners

**Test Coverage:**
- [ ] Mock API responses with Jest
- [ ] Test error handling
- [ ] Test token injection
- [ ] Test response parsing

**Acceptance Criteria:**
- All services have unit tests
- Test coverage > 60% for services
- Mock backend responses (no real API calls)

---

### Task 3.4: Mobile Hook Tests
**Duration:** 1 day | **Priority:** 🟡 High

**Files:** Create test files in `/app/src/__tests__/hooks/`
- [ ] `useMessaging.test.ts` - Test messaging state management
- [ ] `useFriends.test.ts` - Test friends state management
- [ ] `useGameState.test.ts` - Test game state transitions

**Test Coverage:**
- [ ] State updates correctly
- [ ] Callbacks work as expected
- [ ] Loading states

**Acceptance Criteria:**
- All custom hooks have tests
- Use React Testing Library
- Test coverage > 50%

---

### Task 3.5: E2E User Flow Tests
**Duration:** 2 days | **Priority:** 🟡 High

**Setup:** Install Detox for React Native E2E testing

**Files:** Create test files in `/app/e2e/`
- [ ] `auth.e2e.test.ts` - Test login → home → logout
- [ ] `createRoom.e2e.test.ts` - Test create room → lobby → start game
- [ ] `joinRoom.e2e.test.ts` - Test join by code → lobby → play
- [ ] `friendRequest.e2e.test.ts` - Test search user → send request → accept

**Acceptance Criteria:**
- Key user flows tested end-to-end
- Tests run on iOS and Android simulators
- Tests pass in CI/CD

---

### Sprint 3 Summary
- **Duration:** 2 weeks
- **Tasks:** 5 (10 days of work)
- **Test Files Created:** 20+
- **Priority:** 🔴 Critical
- **Outcome:** Test coverage 70% overall (60% backend, 50% mobile, 30% E2E)

---

## Sprint 4: Polish & Optimization (Week 7-8)

**Goal:** Remove mock data, add Redis, polish UX

### Task 4.1: Replace Mock Data with Real API
**Duration:** 3 days | **Priority:** 🔴 Critical

**File:** `/app/src/mocks/messaging.ts`
- [ ] Remove all mock notifications and conversations
- [ ] Update `useMessaging` hook to fetch from API on mount
- [ ] Add loading states

**File:** `/app/src/mocks/rooms.ts`
- [ ] Remove mock rooms
- [ ] Update RoomsScreen to fetch from API only
- [ ] Add infinite scroll with real pagination

**File:** `/app/src/mocks/packs.ts`
- [ ] Remove mock packs
- [ ] Update PackSelectionModal to fetch from API
- [ ] Add search functionality with API

**File:** `/app/src/mocks/friends.ts`
- [ ] Remove mock friends and requests
- [ ] Update `useFriends` hook to fetch from API
- [ ] Add refresh functionality

**Acceptance Criteria:**
- No mock data remaining in production code
- All screens fetch from backend API
- Loading states show skeleton screens
- Error states handled gracefully
- Pull-to-refresh works on all lists

---

### Task 4.2: Add Redis for Online User Tracking
**Duration:** 2 days | **Priority:** 🟡 High

**Setup:**
- [ ] Install Redis (Docker or cloud service)
- [ ] Install `ioredis` npm package
- [ ] Install `@socket.io/redis-adapter`

**File:** `/backend/src/config/redis.ts`
- [ ] Create Redis client configuration
- [ ] Create connection manager
- [ ] Add health check

**File:** `/backend/src/socket/index.ts`
- [ ] Configure Socket.io Redis adapter
- [ ] Store online users in Redis (replace in-memory)
- [ ] Add TTL for user presence (30 seconds)
- [ ] Refresh TTL on socket activity

**File:** `/backend/src/routes/friendRoutes.ts`
- [ ] Query Redis for friend online status
- [ ] Return in `GET /friends` response

**Acceptance Criteria:**
- Online users stored in Redis
- Multiple server instances can share state
- Online status accurate within 30 seconds
- Redis failover handling

---

### Task 4.3: Add Loading States & Skeleton Screens
**Duration:** 1 day | **Priority:** 🟡 High

**Files:** Update all screens with loading states
- [ ] RoomsScreen - Add RoomCardSkeleton while fetching
- [ ] NotificationsModal - Add notification skeletons
- [ ] ChatsListModal - Add conversation skeletons
- [ ] FriendsListModal - Add FriendItemSkeleton while fetching
- [ ] PackSelectionModal - Add PackCardSkeleton while fetching

**Acceptance Criteria:**
- All API calls show loading states
- Skeleton screens match final layout
- Smooth transition from skeleton to content

---

### Task 4.4: Add Error Handling & Retry Logic
**Duration:** 1 day | **Priority:** 🟡 High

**File:** `/app/src/services/api.ts`
- [ ] Add automatic retry for failed requests (max 3 attempts)
- [ ] Add exponential backoff (1s, 2s, 4s)
- [ ] Add network error detection
- [ ] Show toast notification on persistent errors

**File:** `/app/src/services/socketService.ts`
- [ ] Improve reconnection logic
- [ ] Add connection quality indicator
- [ ] Show banner when offline

**Acceptance Criteria:**
- Failed requests retry automatically
- Users see clear error messages
- Connection issues don't crash app
- Offline mode shows helpful message

---

### Task 4.5: Performance Optimization
**Duration:** 2 days | **Priority:** 🟡 High

**Backend:**
- [ ] Add database indexes review (Prisma schema)
- [ ] Add query optimization (N+1 query detection)
- [ ] Add response caching for public packs
- [ ] Add rate limiting per user (not just IP)

**Mobile:**
- [ ] Add React.memo to expensive components
- [ ] Add useMemo/useCallback where needed
- [ ] Optimize FlatList rendering (windowSize, getItemLayout)
- [ ] Add image lazy loading
- [ ] Profile render performance with React DevTools

**Acceptance Criteria:**
- Room list loads in <500ms
- Pack search results in <300ms
- Chat messages render smoothly (60fps)
- Image loading doesn't block UI

---

### Task 4.6: UX Polish
**Duration:** 1 day | **Priority:** 🟢 Low

**Mobile:**
- [ ] Add haptic feedback to important actions (answer submit, friend request sent)
- [ ] Add success animations (checkmark on answer, confetti on game win)
- [ ] Add empty states with helpful CTAs
- [ ] Add pull-to-refresh on all lists
- [ ] Add optimistic UI updates (friend request sent shows immediately)

**Acceptance Criteria:**
- App feels responsive and polished
- Users get immediate feedback on actions
- Empty states guide users to next action

---

### Sprint 4 Summary
- **Duration:** 2 weeks
- **Tasks:** 6 (10 days of work)
- **Files Modified:** 30+
- **Priority:** 🔴 Critical + 🟡 High
- **Outcome:** Production-ready app with no mock data, Redis scaling, polished UX

---

## Post-Sprint: Ongoing Improvements

### Monitoring & Logging
- [ ] Add Sentry for error tracking (backend + mobile)
- [ ] Add performance monitoring (DataDog or New Relic)
- [ ] Add request correlation IDs
- [ ] Add structured logging
- [ ] Add analytics (user events, game metrics)

### Security Hardening
- [ ] Security audit (OWASP top 10)
- [ ] Penetration testing
- [ ] Add CSRF protection
- [ ] Add IP-based rate limiting
- [ ] Add audit logging for sensitive operations
- [ ] Add content security policy for uploads

### Admin Panel
- [ ] Create admin API endpoints (user management, content moderation)
- [ ] Create admin web dashboard
- [ ] Add analytics dashboard
- [ ] Add user reports and flagging system

### Documentation
- [ ] API documentation (expand Swagger)
- [ ] Mobile app documentation
- [ ] Deployment guide (Docker, CI/CD)
- [ ] Runbook for common issues
- [ ] Contributing guide

---

## Summary

### Timeline
- **Sprint 1 (Week 1-2):** Critical integrations → 90% integration complete
- **Sprint 2 (Week 3-4):** Real-time improvements → 95% real-time features
- **Sprint 3 (Week 5-6):** Testing → 70% test coverage
- **Sprint 4 (Week 7-8):** Polish & optimization → Production ready

**Total Duration:** 8 weeks (2 months)

---

### Milestones

**End of Sprint 1:**
- ✅ All backend features accessible in mobile
- ✅ Users can manage sent requests, blocked users, delete messages

**End of Sprint 2:**
- ✅ Real-time updates work consistently
- ✅ REST/Socket integration seamless
- ✅ Friend requests appear instantly

**End of Sprint 3:**
- ✅ 70% test coverage
- ✅ CI/CD pipeline green
- ✅ Confidence in code quality

**End of Sprint 4:**
- ✅ No mock data in production
- ✅ Redis for scalability
- ✅ Polished UX
- ✅ **Production ready! 🚀**

---

### Resource Allocation

**Team Composition (Recommended):**
- 1 Backend Developer (Node.js, TypeScript, Socket.io)
- 1 Mobile Developer (React Native, TypeScript)
- 1 QA Engineer (Testing, automation)
- 1 DevOps Engineer (part-time, Sprint 4)

**Alternative (Solo Developer):**
- Sprints extend to 3-4 weeks each
- Total timeline: 12-16 weeks

---

### Risk Mitigation

**Risk:** Testing takes longer than planned
**Mitigation:** Reduce E2E tests, focus on unit and integration tests

**Risk:** Redis integration has issues
**Mitigation:** Keep in-memory fallback, add Redis in Sprint 4 instead of Sprint 2

**Risk:** Real-time features break existing functionality
**Mitigation:** Feature flags to disable socket events if needed

**Risk:** Mock data removal causes missing data
**Mitigation:** Seed database with sample data for testing

---

### Success Metrics

**Sprint 1:**
- ✅ 0 backend endpoints unused in mobile
- ✅ All UI features connected to backend

**Sprint 2:**
- ✅ <1 second latency for real-time events
- ✅ 0 manual refresh needed for updates

**Sprint 3:**
- ✅ 70% test coverage
- ✅ 0 failing tests in CI/CD

**Sprint 4:**
- ✅ 0 mock data in production
- ✅ <500ms average API response time
- ✅ 60fps UI rendering

---

## Getting Started

1. **Review this plan with the team**
2. **Set up project management tool** (Jira, Linear, GitHub Projects)
3. **Create tickets for each task**
4. **Assign priorities and owners**
5. **Start Sprint 1!**

**Questions?** Refer to [FAHMAN_COMPREHENSIVE_REVIEW.md](./FAHMAN_COMPREHENSIVE_REVIEW.md) for detailed analysis.
