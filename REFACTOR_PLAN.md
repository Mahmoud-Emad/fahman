# Fahman App Refactor Plan

## Executive Summary
A comprehensive refactor plan to improve code reusability, reduce duplication, and create a more scalable component architecture. This plan identifies 15+ duplication patterns and proposes new reusable components.

---

## Phase 1: Core UI Primitives (Foundation)

### 1.1 Create `SearchInput` Component
**Location:** `/src/components/ui/SearchInput.tsx`

**Reason:** Search input pattern is duplicated in 4+ places with nearly identical code.

**Current duplication found in:**
- `ChatsListModal.tsx` (lines 57-85)
- `FriendsListModal.tsx` (lines 108-137)
- `UserSelectModal.tsx` (lines 178-203)
- Can be used in future: RoomsScreen search, PackSelectionModal

**Proposed API:**
```typescript
interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
}

<SearchInput
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search friends..."
/>
```

---

### 1.2 Create `EmptyState` Component
**Location:** `/src/components/ui/EmptyState.tsx`

**Reason:** Empty state pattern (icon + title + description + optional action) is duplicated 8+ times.

**Current duplication found in:**
- `ChatsListModal.tsx` (lines 97-110, 113-121)
- `FriendsListModal.tsx` (lines 184-209, 212-220)
- `NotificationsModal.tsx` (lines 121-135)
- `UserSelectModal.tsx` (lines 268-275)
- `PlayersModal.tsx` (potential)

**Proposed API:**
```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  variant?: 'default' | 'search'; // search = no results
}

<EmptyState
  icon="chatbubbles"
  title="No conversations yet"
  description="Start a conversation by inviting friends"
  action={{ label: "Add Friends", onPress: handleAddFriend }}
/>
```

---

### 1.3 Create `SegmentedControl` / `TabBar` Component
**Location:** `/src/components/ui/SegmentedControl.tsx`

**Reason:** Tab switching UI pattern used in FriendsListModal, can be reused elsewhere.

**Current duplication found in:**
- `FriendsListModal.tsx` (lines 140-173) - All/Online tabs
- Can be used in: Filter UIs, Settings sections, Room filters

**Proposed API:**
```typescript
interface SegmentedControlProps {
  segments: Array<{
    id: string;
    label: string;
    count?: number;
    color?: string;
  }>;
  activeSegment: string;
  onChange: (segmentId: string) => void;
  variant?: 'filled' | 'outlined';
}

<SegmentedControl
  segments={[
    { id: 'all', label: 'All', count: friends.length },
    { id: 'online', label: 'Online', count: onlineCount, color: colors.success },
  ]}
  activeSegment={activeTab}
  onChange={setActiveTab}
/>
```

---

### 1.4 Create `SkeletonBox` Primitive
**Location:** `/src/components/ui/Skeleton.tsx`

**Reason:** Multiple skeleton components share the same animated shimmer pattern.

**Current duplication found in:**
- `ConversationItemSkeleton.tsx`
- `FriendItemSkeleton.tsx`
- `NotificationItemSkeleton.tsx`
- `PackCardSkeleton.tsx`
- `SkeletonCard.tsx` (rooms)

**Proposed API:**
```typescript
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  variant?: 'text' | 'circle' | 'rect';
}

// Primitives
<Skeleton.Box width={100} height={16} />
<Skeleton.Circle size={40} />
<Skeleton.Text lines={2} />

// Pre-built skeletons
<Skeleton.ListItem avatar lines={2} />
<Skeleton.Card />
```

---

## Phase 2: List Modal System (High Impact)

### 2.1 Create `ListModal` Base Component
**Location:** `/src/components/ui/ListModal.tsx`

**Reason:** 5+ modals share identical structure: search + loading + empty + list + footer.

**Consolidates patterns from:**
- `ChatsListModal.tsx`
- `FriendsListModal.tsx`
- `NotificationsModal.tsx`
- `PlayersModal.tsx`
- `UserSelectModal.tsx`

**Proposed API:**
```typescript
interface ListModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;

  // Data
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;

  // Search (optional)
  searchable?: boolean;
  searchPlaceholder?: string;
  filterFn?: (item: T, query: string) => boolean;

  // States
  isLoading?: boolean;
  loadingSkeleton?: ReactNode;
  emptyState?: EmptyStateProps;
  noResultsState?: EmptyStateProps;

  // Header extras (tabs, banners)
  headerContent?: ReactNode;

  // Footer action
  footerAction?: {
    icon?: string;
    label: string;
    onPress: () => void;
  };

  // Multi-select mode
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}
```

**Usage Example (Chats):**
```typescript
<ListModal
  visible={visible}
  onClose={onClose}
  title="Chats"
  data={conversations}
  renderItem={(conv) => <ConversationItem conversation={conv} />}
  keyExtractor={(conv) => conv.id}
  searchable
  searchPlaceholder="Search conversations..."
  filterFn={(conv, q) => conv.participants.some(p => p.name.includes(q))}
  isLoading={isLoading}
  loadingSkeleton={<ConversationSkeletonList count={6} />}
  emptyState={{ icon: "chatbubbles", title: "No conversations yet" }}
  footerAction={{ icon: "add-circle", label: "New Conversation", onPress: onNewChat }}
/>
```

---

### 2.2 Refactor `FriendsListModal` using `ListModal`
**Impact:** Reduces ~180 lines to ~60 lines

---

### 2.3 Refactor `ChatsListModal` using `ListModal`
**Impact:** Reduces ~120 lines to ~40 lines

---

### 2.4 Refactor `NotificationsModal` using `ListModal`
**Impact:** Reduces ~140 lines to ~50 lines (with grouping logic extracted)

---

## Phase 3: Selection Components

### 3.1 Create `SelectableItem` Component
**Location:** `/src/components/ui/SelectableItem.tsx`

**Reason:** Selection card pattern (checkbox + avatar + info) duplicated in multiple places.

**Current duplication found in:**
- `UserSelectModal.tsx` - `UserCard` component (lines 31-101)
- `FriendItem.tsx` - similar pattern
- `PlayerListItem` in `PlayersModal.tsx`

**Proposed API:**
```typescript
interface SelectableItemProps {
  selected?: boolean;
  onPress: () => void;

  // Avatar
  avatar?: string;
  initials: string;
  showOnlineIndicator?: boolean;
  isOnline?: boolean;

  // Content
  title: string;
  subtitle?: string;

  // Right side
  badge?: BadgeProps;
  rightContent?: ReactNode;

  // Selection
  selectionMode?: 'single' | 'multi' | 'none';
  showCheckbox?: boolean;
}

<SelectableItem
  selected={isSelected}
  onPress={() => toggleUser(user.id)}
  initials={user.initials}
  isOnline={user.isOnline}
  title={user.name}
  subtitle="Friend"
  badge={{ variant: "success", children: "Online" }}
  selectionMode="multi"
/>
```

---

### 3.2 Create `MultiSelectModal` Component
**Location:** `/src/components/ui/MultiSelectModal.tsx`

**Extends ListModal with multi-select capabilities**

**Current usage:**
- `UserSelectModal.tsx` - room invitations

**Proposed API:**
```typescript
interface MultiSelectModalProps<T> extends ListModalProps<T> {
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  maxSelections?: number;
  submitLabel?: string | ((count: number) => string);
  onSubmit: (ids: string[]) => void;
}
```

---

## Phase 4: Chat System Unification

### 4.1 Unify `ChatBubble` Components
**Location:** `/src/components/chat/ChatBubble.tsx`

**Reason:** Two similar chat bubble components exist with duplicated logic.

**Current files:**
- `lobby/ChatBubble.tsx` - for in-game chat
- `messaging/DirectMessageBubble.tsx` - for direct messages

**Proposed unified API:**
```typescript
interface ChatBubbleProps {
  // Sender
  senderName?: string;
  senderInitials?: string;
  senderAvatar?: string;
  isCurrentUser: boolean;

  // Content
  type: 'text' | 'system' | 'room_invite' | 'image';
  text?: string;
  roomInvite?: RoomInviteData;

  // Meta
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isRead?: boolean;

  // Interactions
  onRoomInvitePress?: (invite: RoomInviteData) => void;
}
```

---

### 4.2 Create `ChatView` Reusable Component
**Location:** `/src/components/chat/ChatView.tsx`

**Reason:** Chat interface (message list + input) used in multiple places.

**Current usage:**
- `ChatDetailsModal.tsx`
- `LobbyView.tsx` (chat section)

**Proposed API:**
```typescript
interface ChatViewProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;

  // Optional
  placeholder?: string;
  showTimestamps?: boolean;
  groupByDate?: boolean;
  onRoomInvitePress?: (invite: RoomInviteData) => void;

  // Styling
  variant?: 'full' | 'compact';
  maxHeight?: number | string;
}
```

---

## Phase 5: Shared State & Data

### 5.1 Create Centralized Mock Data
**Location:** `/src/mocks/index.ts`

**Reason:** Mock data is duplicated across multiple files.

**Current duplication:**
- `MOCK_SUGGESTED_PACKS`, `MOCK_OWNED_PACKS`, `MOCK_POPULAR_PACKS` duplicated in:
  - `HomeScreen.tsx` (lines 31-46)
  - `RoomsScreen.tsx` (lines 44-59)

**Solution:** Move all mock data to `/src/mocks/` with proper exports:
```typescript
// /src/mocks/packs.ts
export const MOCK_SUGGESTED_PACKS: PackData[] = [...]
export const MOCK_OWNED_PACKS: PackData[] = [...]
export const MOCK_POPULAR_PACKS: PackData[] = [...]

// /src/mocks/index.ts
export * from './packs';
export * from './rooms';
export * from './users';
```

---

### 5.2 Create `useMessaging` Hook
**Location:** `/src/hooks/useMessaging.ts`

**Reason:** Messaging state management is duplicated across screens.

**Current duplication in:**
- `HomeScreen.tsx` (lines 119-221)
- `RoomsScreen.tsx` (lines 72-287)

**Proposed API:**
```typescript
function useMessaging() {
  return {
    // Notifications
    notifications,
    unreadNotificationCount,
    handleNotificationPress,
    handleNotificationAction,
    handleMarkAllRead,

    // Conversations
    conversations,
    unreadMessageCount,
    handleConversationPress,

    // Active chat
    activeConversation,
    activeMessages,
    handleSendMessage,
    handleCloseChat,

    // Modals
    notificationsVisible,
    setNotificationsVisible,
    chatsListVisible,
    setChatsListVisible,
    chatDetailsVisible,
    setChatDetailsVisible,
    isLoading,
  };
}
```

---

### 5.3 Create `useFriends` Hook
**Location:** `/src/hooks/useFriends.ts`

**Reason:** Friends management logic duplicated in HomeScreen.

**Proposed API:**
```typescript
function useFriends() {
  return {
    friends,
    friendRequests,
    isLoading,

    // Actions
    handleFriendPress,
    handleMessageFriend,
    handleInviteFriend,
    handleAcceptRequest,
    handleDeclineRequest,

    // Modal
    friendsListVisible,
    setFriendsListVisible,
  };
}
```

---

## Phase 6: Component Cleanup & TypeScript Fixes

### 6.1 Fix TypeScript Strict Mode Issues
Run `tsc --noEmit` and fix all type errors:
- Add proper typing to all event handlers
- Remove `any` types
- Add missing interface properties
- Fix potential null/undefined issues

### 6.2 Standardize Component Exports
Ensure all component folders have consistent `index.ts` exports:
```typescript
// Correct pattern
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName';
```

### 6.3 Add Missing JSDoc Comments
Add documentation to all public component interfaces.

---

## Phase 7: File Structure Reorganization

### Proposed New Structure:
```
/src
  /components
    /ui                    # Primitives (existing + new)
      /SearchInput.tsx     # NEW
      /EmptyState.tsx      # NEW
      /SegmentedControl.tsx # NEW
      /Skeleton.tsx        # NEW (unified)
      /ListModal.tsx       # NEW
      /SelectableItem.tsx  # NEW
      /MultiSelectModal.tsx # NEW
      ...existing...

    /chat                  # NEW - Unified chat components
      /ChatBubble.tsx      # Unified from lobby + messaging
      /ChatView.tsx        # NEW
      /MessageInput.tsx    # Moved from messaging
      /RoomInviteCard.tsx  # Moved from messaging
      /index.ts

    /lists                 # NEW - Specialized list modals
      /FriendsListModal.tsx   # Refactored
      /ChatsListModal.tsx     # Refactored
      /NotificationsModal.tsx # Refactored
      /PlayersModal.tsx       # Refactored
      /UserSelectModal.tsx    # Refactored
      /index.ts

    /friends               # Keep, but simplify
    /messaging             # Keep items, move modals to /lists
    /lobby                 # Keep, remove ChatBubble
    /packs
    /rooms
    /game
    /navigation
    /common
    /auth
    /settings

  /hooks                   # Expanded
    /useMessaging.ts       # NEW
    /useFriends.ts         # NEW
    /usePackSelection.ts   # NEW
    /index.ts

  /mocks                   # Centralized
    /packs.ts
    /rooms.ts
    /users.ts
    /conversations.ts
    /notifications.ts
    /index.ts
```

---

## Implementation Priority

### High Priority (Do First)
1. **SearchInput** - Used in 4+ places, quick win
2. **EmptyState** - Used in 8+ places, reduces significant duplication
3. **Centralize Mock Data** - Prevents future duplication
4. **useMessaging Hook** - Biggest state duplication

### Medium Priority
5. **ListModal** - Foundation for modal refactoring
6. **SegmentedControl** - Enables consistent tab UI
7. **Skeleton primitives** - Cleans up skeleton files
8. **Refactor list modals** - ChatsListModal, FriendsListModal, etc.

### Lower Priority
9. **Chat unification** - ChatBubble components
10. **SelectableItem** - For selection patterns
11. **useFriends hook** - Less duplication than messaging
12. **File structure reorganization** - After components are stable

---

## Estimated Impact

| Metric | Current | After Refactor |
|--------|---------|----------------|
| Total lines in list modals | ~800 | ~300 |
| Duplicate mock data instances | 6+ | 1 |
| Search input implementations | 4 | 1 |
| Empty state implementations | 8+ | 1 |
| Skeleton component files | 5 | 1 |
| Messaging state duplication | 2 screens | 1 hook |

---

## Testing Checklist

After each phase, verify:
- [ ] All modals open/close correctly
- [ ] Search functionality works
- [ ] Loading states display properly
- [ ] Empty states render correctly
- [ ] Selection works (single and multi)
- [ ] Navigation between modals works
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No console warnings/errors

---

## Notes

- Follow existing code style (NativeWind, colors from theme)
- Keep max 500 lines per file
- All new components need TypeScript interfaces
- Maintain backwards compatibility during refactor
- Test on both iOS and Android
