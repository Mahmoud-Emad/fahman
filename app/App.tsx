/**
 * Main App component for the Fahman app
 * Uses React Navigation for screen transitions
 */
import "react-native-gesture-handler";
import "./src/global.css";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Platform, AppState, Easing, Animated, type AppStateStatus } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  type StackCardInterpolationProps,
  type StackCardStyleInterpolator,
} from "@react-navigation/stack";
import * as NavigationBar from "expo-navigation-bar";
import * as Linking from "expo-linking";
import { ThemeProvider } from "./src/themes";
import { AuthProvider, useAuth, ToastProvider, useToast, MessagingProvider, FriendsProvider } from "./src/contexts";
import { HomeScreen, WelcomeScreen, SettingsScreen, LoginScreen, CredentialLoginScreen, ForgotPasswordScreen, RoomsScreen, RoomDetailsScreen, RoomConfigScreen, RoomLobbyScreen, PackCreationScreen, JoinRoomScreen, ProfileScreen, UserProfileScreen, BlockedUsersScreen, GameResultsScreen } from "./src/screens";
import { AvatarSelectionModal } from "./src/components/profile/AvatarSelectionModal";
import { colors } from "./src/themes";
import { roomsService } from "./src/services/roomsService";

import type { PackData, RoomConfigData } from "./src/components/packs/types";
import type { RoomData } from "./src/components/rooms/types";
import type { Room } from "./src/services/roomsService";

/**
 * Navigation stack param list
 */
/**
 * Player score data for game results
 */
interface PlayerScoreParam {
  playerId: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
  rank: number;
}

/**
 * Winner data for game results
 */
interface WinnerParam {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  score: number;
}

export type RootStackParamList = {
  Home: { openChatWith?: { id: string; name: string; initials: string; avatar?: string } } | undefined;
  Settings: undefined;
  Profile: undefined;
  UserProfile: { userId: string };
  BlockedUsers: undefined;
  Login: undefined;
  CredentialLogin: { type: "id" | "phone" | "email" };
  ForgotPassword: undefined;
  Rooms: undefined;
  RoomDetails: { roomId: string; isHost?: boolean };
  RoomConfig: { pack: PackData };
  RoomLobby: { pack: PackData; config: RoomConfigData; isHost?: boolean; room?: Room };
  PackCreation: { packId?: string };
  JoinRoom: { room: RoomData; roomCode?: string; password?: string };
  GameResults: {
    winner: WinnerParam | null;
    finalScores: PlayerScoreParam[];
    roomId: string;
    packTitle?: string;
    currentUserId?: string;
    // For "Play Again" navigation
    pack: PackData;
    config: RoomConfigData;
    isHost?: boolean;
    room?: Room;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Custom card style interpolator - smooth slide animation
 * Forward: new screen slides from right ON TOP of current screen
 * Back: previous screen slides from left ON TOP of current screen
 *
 * This creates a consistent "slide on top" effect for both directions.
 */
const forSlideOnTop: StackCardStyleInterpolator = ({
  current,
  next,
  layouts: { screen },
}: StackCardInterpolationProps) => {
  // This screen slides in from right when pushed (current.progress: 0→1)
  const translateXForPush = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [screen.width, 0],
    extrapolate: "clamp",
  });

  // When there's a screen on top (next exists), shift this screen left
  // This creates the "slide from left" effect when the next screen is dismissed
  // next.progress: 0→1 when next screen appears, 1→0 when next screen is dismissed
  const shiftWhenCovered = next
    ? next.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -screen.width], // Shift fully left when covered
      extrapolate: "clamp",
    })
    : null;

  // Combine both transforms using Animated.add when there's a next screen
  // For Home: current.progress stays at 1, so translateXForPush = 0
  //   - When Settings pushed: shiftWhenCovered goes 0 → -screen.width (Home shifts left)
  //   - When Settings popped: shiftWhenCovered goes -screen.width → 0 (Home slides in from left!)
  const finalTranslateX = shiftWhenCovered
    ? Animated.add(translateXForPush, shiftWhenCovered)
    : translateXForPush;

  return {
    cardStyle: {
      transform: [{ translateX: finalTranslateX }],
      // Shadow for depth effect
      shadowColor: colors.black,
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.2],
        extrapolate: "clamp",
      }),
      shadowRadius: 12,
      elevation: 8,
    },
    // Dark overlay on screens underneath
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.35],
        extrapolate: "clamp",
      }),
    },
  };
};

/**
 * Shared screen options for consistent animations
 */
const sharedScreenOptions = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: "horizontal" as const,
  cardStyleInterpolator: forSlideOnTop,
  cardStyle: { backgroundColor: colors.white },
  transitionSpec: {
    open: {
      animation: "timing" as const,
      config: {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
    close: {
      animation: "timing" as const,
      config: {
        duration: 280,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    },
  },
  cardOverlayEnabled: true,
  detachPreviousScreen: false,
};

/**
 * Authentication stack - shown when user is NOT logged in
 */
function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={sharedScreenOptions}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CredentialLogin" component={CredentialLoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

/**
 * Main app stack - shown when user IS logged in
 */
function MainStack() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={sharedScreenOptions}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Rooms" component={RoomsScreen} />
      <Stack.Screen name="RoomDetails" component={RoomDetailsScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="RoomConfig" component={RoomConfigScreen} />
      <Stack.Screen name="RoomLobby" component={RoomLobbyScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="PackCreation" component={PackCreationScreen} />
      <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="GameResults" component={GameResultsScreen} />
    </Stack.Navigator>
  );
}

/**
 * App content wrapper that handles welcome screen and navigation
 */
function AppContent() {
  const [showWelcome, setShowWelcome] = useState(true);
  const appState = useRef(AppState.currentState);
  const navigationRef = useRef<any>(null);
  const initialUrlHandled = useRef(false);

  // Get auth state from context
  const { isAuthenticated, isInitializing, connectionError, isNewUser, clearNewUserFlag, updateProfile, user } = useAuth();
  const { showToast, hideToast } = useToast();

  // Handle avatar selection for new users
  const handleAvatarSelect = useCallback(async (avatarUrl: string) => {
    try {
      await updateProfile({ avatar: avatarUrl });
      clearNewUserFlag();
    } catch (error) {
      console.error('Failed to update avatar:', error);
      // Still clear the flag to let user proceed
      clearNewUserFlag();
    }
  }, [updateProfile, clearNewUserFlag]);

  const handleAvatarModalClose = useCallback(() => {
    // Allow closing without selecting - user can change avatar later from profile
    clearNewUserFlag();
  }, [clearNewUserFlag]);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
  }, []);

  // When connection drops, go back to WelcomeScreen (shows error + retry UI)
  useEffect(() => {
    if (connectionError && !showWelcome) {
      setShowWelcome(true);
    }
  }, [connectionError, showWelcome]);

  // Handle deep links for room joining
  useEffect(() => {
    if (!isAuthenticated || showWelcome) return;

    const handleDeepLink = async (event: { url: string }) => {
      try {
        const { path, queryParams } = Linking.parse(event.url);

        if (path === 'join-room' && queryParams?.code) {
          const roomCode = String(queryParams.code);

          // Validate room code format (4-8 alphanumeric characters)
          if (!/^[A-Z0-9]{4,8}$/i.test(roomCode)) return;

          if (navigationRef.current?.isReady()) {
            showToast({
              message: `Loading room ${roomCode}...`,
              variant: 'info',
              duration: 0,
            });

            try {
              const response = await roomsService.getRoomByCode(roomCode);

              if (response.success && response.data) {
                const room = response.data;

                const roomData: RoomData = {
                  id: room.id,
                  title: room.title,
                  description: room.description || undefined,
                  logo: undefined,
                  logoInitials: room.title.substring(0, 2).toUpperCase(),
                  type: room.isPublic ? "public" : "private",
                  users: room.members?.slice(0, 3).map((m) => ({
                    id: m.user.id,
                    initials: (m.user.displayName || m.user.username).substring(0, 2).toUpperCase(),
                    avatar: m.user.avatar || undefined,
                  })) || [],
                  totalUsers: room.currentPlayers,
                  questionsCount: 10,
                  currentQuestion: room.currentQuestionIndex,
                  status: room.status === "WAITING" ? "waiting" : room.status === "PLAYING" ? "playing" : "finished",
                };

                hideToast();

                // Do NOT pass password from deep link — JoinRoomScreen prompts if needed
                navigationRef.current.navigate('JoinRoom', {
                  room: roomData,
                  roomCode: room.code,
                });
              } else {
                hideToast();
                showToast({
                  message: response.message || 'Room not found',
                  variant: 'error',
                  duration: 3000,
                });
              }
            } catch (error: any) {
              hideToast();
              showToast({
                message: error.message || 'Failed to load room',
                variant: 'error',
                duration: 3000,
              });
            }
          }
        } else if (path === 'add-friend' && queryParams?.gameId) {
          const gameId = String(queryParams.gameId);

          // Validate game ID format (4-10 digit number)
          if (!/^[0-9]{4,10}$/.test(gameId)) return;

          if (navigationRef.current?.isReady()) {
            showToast({
              message: `Opening profile for Game ID: ${gameId}`,
              variant: 'info',
              duration: 2000,
            });

            setTimeout(() => {
              showToast({
                message: 'Friend request feature coming soon!',
                variant: 'info',
                duration: 3000,
              });
            }, 2000);
          }
        }
      } catch {
        hideToast();
        showToast({
          message: 'Invalid link',
          variant: 'error',
          duration: 3000,
        });
      }
    };

    // Handle initial URL (when app is opened from a link) — only once
    if (!initialUrlHandled.current) {
      Linking.getInitialURL().then((url) => {
        if (url && !initialUrlHandled.current) {
          initialUrlHandled.current = true;
          handleDeepLink({ url });
        }
      });
    }

    // Handle URL events (when app is already open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, showWelcome, showToast, hideToast]);

  // Enable immersive/full-screen mode on Android
  useEffect(() => {
    const enableImmersiveMode = () => {
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("hidden");
      }
    };

    // Apply on mount
    enableImmersiveMode();

    // Re-apply when app comes back to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          enableImmersiveMode();
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Show loading only during initial auth check (not during login operations)
  if (isInitializing && !showWelcome) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {showWelcome ? (
        <WelcomeScreen onComplete={handleWelcomeComplete} duration={3000} />
      ) : (
        <NavigationContainer ref={navigationRef}>
          {isAuthenticated ? (
            <FriendsProvider navigationRef={navigationRef}>
              <MessagingProvider navigationRef={navigationRef}>
                <MainStack />
              </MessagingProvider>
            </FriendsProvider>
          ) : (
            <AuthStack />
          )}
        </NavigationContainer>
      )}
      {/* Avatar selection modal for new users */}
      {isAuthenticated && isNewUser && (
        <AvatarSelectionModal
          visible={true}
          onClose={handleAvatarModalClose}
          onSelect={handleAvatarSelect}
          currentAvatar={user?.avatar}
          userCoins={user?.coins ?? 0}
        />
      )}
      {/* Hidden status bar for full-screen immersive mode */}
      <StatusBar hidden />
    </View>
  );
}

/**
 * Root App component
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
