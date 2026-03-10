# Fahman App - Development Guidelines

## Project Overview
Fahman is a React Native multiplayer trivia game app built with Expo, TypeScript, and NativeWind.

**Key Features:**
- Room hosting and joining for multiplayer games
- Question pack creation and selection
- Real-time chat and messaging
- Friend management
- Notifications system

## Color System

### Color Constants
Import colors from `@/themes` for style props:
```typescript
import { colors, withOpacity } from "@/themes";

// Usage
style={{ backgroundColor: colors.primary[500] }}
style={{ color: colors.white }}
style={{ borderColor: withOpacity(colors.primary[500], 0.3) }}
```

### Available Colors
```typescript
colors.primary[500]     // Orange #f97316
colors.white            // #ffffff
colors.black            // #000000
colors.text.primary     // #000000
colors.text.secondary   // #525252
colors.text.muted       // #a3a3a3
colors.text.inverse     // #ffffff
colors.neutral[400]     // #a3a3a3 (for inactive states)
```

### NativeWind Classes
For NativeWind styling, use theme classes:
- `bg-primary-500` - Orange background
- `bg-background` - White background
- `text-text` - Black text
- `text-text-inverse` - White text
- `border-border` - Default border color

## Architecture

### Folder Structure
```
/app
  /src
    /components
      /ui          # Reusable UI primitives (Button, Card, Input, SearchInput, EmptyState, etc.)
      /navigation  # Navigation components (TopNavBar, BottomNavBar)
      /common      # Shared components (WaveDivider, LogoPlaceholder, LeaveConfirmDialog)
      /auth        # Authentication components (LoginButtons, AuthDividers)
      /packs       # Pack selection and creation components
      /rooms       # Room listing and filtering components
      /lobby       # Pre-game lobby components
      /game        # Game phases and gameplay components
      /messaging   # Notifications, conversations, chat components
      /friends     # Friend list and management components
      /settings    # Settings-related components
    /screens       # Screen components (15 screens)
    /themes        # Theme configuration and color constants
    /utils         # Utility functions (cn.ts for class merging)
    /hooks         # Custom React hooks (useMessaging, useFriends, etc.)
    /mocks         # Centralized mock data for development
    /constants     # App constants (gameConfig, legal texts)
```

### Screens
- `WelcomeScreen` - Splash screen shown on app launch (3 seconds)
- `HomeScreen` - Main landing page with Join/Host buttons
- `SettingsScreen` - User settings with expandable panels
- `LoginScreen` - Authentication screen with gradient background, social login (Google/Facebook), ID/Phone options, and legal modals
- `ComponentsScreen` - UI component showcase (for development/testing)

## Screen Navigation (React Navigation)
Uses `@react-navigation/stack` with custom card style interpolator for smooth "slide on top" animations.

### Custom Animation Behavior
- **Forward navigation**: New screen slides from RIGHT on top
- **Back navigation**: Previous screen slides from LEFT on top
- Both directions show the incoming screen sliding on top (no white flash)
- Uses `Animated.add` to combine current and next progress for parallax effect

### Navigation Setup (App.tsx)
```typescript
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

export type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Custom interpolator defined in App.tsx - DO NOT MODIFY
// Uses current.progress for push animation
// Uses next.progress for back animation (slide from left)
<Stack.Navigator
  screenOptions={{
    headerShown: false,
    gestureEnabled: true,
    gestureDirection: "horizontal",
    cardStyleInterpolator: forSlideOnTop,
    cardOverlayEnabled: true,
    detachPreviousScreen: false, // Keep previous screen mounted
  }}
>
```

### Navigate Between Screens
```typescript
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";

type NavigationProp = StackNavigationProp<RootStackParamList>;

function MyScreen() {
  const navigation = useNavigation<NavigationProp>();

  // Navigate forward
  navigation.navigate("Settings");

  // Go back
  navigation.goBack();
}
```

### Adding New Screens
1. Create screen in `/src/screens/`
2. Export from `/src/screens/index.ts`
3. Add to `RootStackParamList` type in `App.tsx`
4. Add `<Stack.Screen>` in the navigator

## Coding Standards

### Component Guidelines
1. **Max 500 lines per file** - Split into smaller components when exceeded
2. **Use reusable UI components** from `/components/ui` - Never duplicate UI code
3. **No hardcoded colors** - Use `colors` constants or NativeWind theme classes
4. **No inline styles for common patterns** - Use NativeWind classes
5. **Props typing** - All components must have typed props interfaces

### Reusable UI Components
Always use these components instead of creating new ones:

**Typography & Display:**
- `Text` - Typography (variants: h1, h2, h3, h4, body, body-sm, caption, label)
- `Icon` - Ionicons wrapper with size presets (sm, md, lg, xl) or customSize
- `Badge` - Status indicators (variants: default, success, warning, error)

**Inputs & Controls:**
- `Button` - Buttons (variants: primary, secondary, outline, ghost, danger)
- `Input` - Text inputs (variants: outlined, filled, underlined)
- `SearchInput` - Search field with icon and clear button
- `Switch` / `Checkbox` - Toggle controls
- `NumberStepper` - Increment/decrement number input

**Layout & Containers:**
- `Card` - Container cards (CardHeader, CardContent, CardFooter)
- `Divider` - Visual separators (horizontal/vertical)
- `ExpandablePanel` - Collapsible sections for grouped content

**Overlays:**
- `Modal` - Bottom sheet modal with animations
- `Dialog` - Confirmation/alert dialogs
- `Toast` - Notification toasts (variants: success, error, warning, info)

**User Display:**
- `Avatar` / `AvatarGroup` - Profile images with initials fallback
- `EmptyState` - Empty/no-results state with icon, title, description, action

**Lists:**
- `SelectableItem` - Selectable list item with checkbox, avatar, info
- `Skeleton` - Loading skeleton primitives (Box, Circle, Text, ListItem)

### File Naming
- Components: `PascalCase.tsx` (e.g., `Button.tsx`, `HomeScreen.tsx`)
- Utilities: `camelCase.ts` (e.g., `cn.ts`, `formatDate.ts`)
- Constants: `UPPER_SNAKE_CASE` for values

### Import Order
1. React/React Native imports
2. Third-party imports (react-navigation, etc.)
3. Local imports (components, utils, themes)
4. Types

### Comments
- Add JSDoc comments for components and their props
- Explain complex logic with inline comments
- Keep comments concise and meaningful

## Navigation Structure
- **Top NavBar**: Settings icon, Help icon (left) | Coins/Energy display (right)
- **Bottom NavBar**: Context-based tabs that change per screen:
  - **Default (HomeScreen)**: Create | Friends | Home (center) | Store | Profile
  - **Room List (RoomsScreen)**: Home | Chats | Rooms (center, active) | Notifications | Profile
  - **Lobby/Game (RoomDetailsScreen)**: Leave (red) | Chats | Notifications | Profile

### Bottom NavBar Usage
```typescript
import { BottomNavBar, ROOM_LIST_TABS, LOBBY_TABS, DEFAULT_TABS } from "@/components/navigation";

// Room list screen
<BottomNavBar tabs={ROOM_LIST_TABS} activeTab="rooms" onTabPress={handleTabPress} />

// Lobby/game screen
<BottomNavBar tabs={LOBBY_TABS} activeTab="" onTabPress={handleTabPress} />

// Default (home)
<BottomNavBar tabs={DEFAULT_TABS} activeTab="home" onTabPress={handleTabPress} />
```

### Leave Confirmation Dialog
Use `LeaveConfirmDialog` for confirming room exit (centered modal):
```typescript
import { LeaveConfirmDialog } from "@/components/common";

<LeaveConfirmDialog
  visible={showLeaveDialog}
  onClose={() => setShowLeaveDialog(false)}
  onConfirm={handleLeaveRoom}
/>
```

## Custom Hooks

### useMessaging
Centralized messaging state management for notifications and conversations:
```typescript
import { useMessaging } from "@/hooks";

const {
  notifications,
  conversations,
  unreadNotificationCount,
  unreadMessageCount,
  handleNotificationPress,
  handleConversationPress,
  handleSendMessage,
  // Modal visibility
  notificationsVisible,
  setNotificationsVisible,
  chatsListVisible,
  setChatsListVisible,
} = useMessaging();
```

### useFriends
Friend list and requests management:
```typescript
import { useFriends } from "@/hooks";

const {
  friends,
  friendRequests,
  isLoading,
  handleFriendPress,
  handleAcceptRequest,
  handleDeclineRequest,
} = useFriends();
```

## Mock Data

All mock data should be centralized in `/src/mocks/`:
```typescript
import {
  MOCK_SUGGESTED_PACKS,
  MOCK_OWNED_PACKS,
  MOCK_POPULAR_PACKS
} from "@/mocks";
```

**Never duplicate mock data in screens** - always import from mocks folder.

## Modal Animation Best Practices

When working with modals that have animations:

1. **Track animation completion** - Set `isReady` state after animation completes
2. **Use `pointerEvents`** - Prevent touch interception during animations
3. **Modal transitions** - Add 300ms delay between closing one modal and opening another

```typescript
// Transitioning between modals
const handleOpenSecondModal = () => {
  setFirstModalVisible(false);
  setTimeout(() => {
    setSecondModalVisible(true);
  }, 300);
};
```

## Game Answer Model

**Free-text answers only — no multiple choice.**

During gameplay, players see only the question text and a text input. Answer options are **never** displayed to the player. The host manually reviews and grades each player's typed answer after submission.

- `AnsweringPhase` renders an `Input` component — never selection buttons or option lists
- `selectedAnswer` is a `string` (the typed text), not an index
- The socket emits the raw text answer to the server via `game:answer`
- The host uses `HostControls` to mark each player's answer as correct or incorrect

**Do not** add multiple-choice option rendering, radio buttons, or selectable answer lists to the game question screen.

## Game Constants

Import game configuration from constants:
```typescript
import { GAME_TIMING, BETTING, ROOM_LIMITS, PACK_LIMITS } from "@/constants";

// Examples
GAME_TIMING.TIMER_DURATION  // 20 seconds
BETTING.MIN_BET             // 1
ROOM_LIMITS.MAX_PLAYERS     // 50
PACK_LIMITS.MAX_QUESTIONS   // 100
```

## Remember
- Check `/components/ui` before creating any UI element
- Split components at 500 lines
- Use `colors` from `@/themes` for style props
- Use NativeWind classes for common styling
- Never hardcode hex colors directly
- Use React Navigation for screen transitions
- Use centralized mock data from `/src/mocks/`
- Use custom hooks for shared state (useMessaging, useFriends)
- Add `delayPressIn={0}` to Pressables for immediate touch response
- Keep the app clean and maintainable
