/**
 * useRoomPresence Hook
 * Automatically handles socket room join/leave and presence tracking
 * Manages app lifecycle to handle backgrounding/closing gracefully
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService } from '@/services/socketService';
import type { RoomMemberInfo } from '@/services/socketService';

interface UseRoomPresenceOptions {
  roomId: string;
  enabled?: boolean;
  onPlayerJoined?: (player: RoomMemberInfo) => void;
  onPlayerLeft?: (playerId: string) => void;
  onRoomClosed?: (reason: string) => void;
  onKicked?: (reason: string) => void;
}

/**
 * Hook to manage room presence via WebSocket
 *
 * Features:
 * - Auto join room on mount
 * - Auto leave room on unmount
 * - Handle app backgrounding (leave room)
 * - Handle app foregrounding (rejoin room)
 * - Clean event listener management
 *
 * @example
 * useRoomPresence({
 *   roomId: route.params.roomId,
 *   onPlayerJoined: (player) => console.log('Player joined:', player),
 *   onPlayerLeft: (playerId) => console.log('Player left:', playerId),
 *   onRoomClosed: (reason) => navigation.navigate('Home'),
 * });
 */
export function useRoomPresence({
  roomId,
  enabled = true,
  onPlayerJoined,
  onPlayerLeft,
  onRoomClosed,
  onKicked,
}: UseRoomPresenceOptions) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isJoinedRef = useRef(false);
  const cleanupFnsRef = useRef<(() => void)[]>([]);

  /**
   * Join the room socket channel
   */
  const joinRoom = () => {
    if (!enabled || isJoinedRef.current) return;

    socketService.joinRoom(roomId);
    isJoinedRef.current = true;
  };

  /**
   * Leave the room socket channel
   */
  const leaveRoom = () => {
    if (!isJoinedRef.current) return;

    socketService.leaveRoom(roomId);
    isJoinedRef.current = false;
  };

  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (!enabled) return;

    // Connect socket if not already connected
    if (!socketService.isConnected) {
      socketService.connect().catch((error) => {
        console.error('Failed to connect socket:', error);
      });
    }

    // Wait a bit for socket to connect before joining
    const joinTimeout = setTimeout(() => {
      joinRoom();
    }, 100);

    // Setup event listeners
    const unsubscribers: (() => void)[] = [];

    // Player joined event
    if (onPlayerJoined) {
      const unsub = socketService.onPlayerJoined((data) => {
        if (data.roomId === roomId) {
          onPlayerJoined(data.player);
        }
      });
      unsubscribers.push(unsub);
    }

    // Player left event
    if (onPlayerLeft) {
      const unsub = socketService.onPlayerLeft((data) => {
        if (data.roomId === roomId) {
          onPlayerLeft(data.playerId);
        }
      });
      unsubscribers.push(unsub);
    }

    // Room closed event
    if (onRoomClosed) {
      const unsub = socketService.onRoomClosed((data) => {
        if (data.roomId === roomId) {
          onRoomClosed(data.reason);
        }
      });
      unsubscribers.push(unsub);
    }

    // Kicked from room event
    if (onKicked) {
      const unsub = socketService.onRoomKicked((data) => {
        if (data.roomId === roomId) {
          onKicked(data.reason);
        }
      });
      unsubscribers.push(unsub);
    }

    // Store cleanup functions
    cleanupFnsRef.current = unsubscribers;

    // Cleanup on unmount
    return () => {
      clearTimeout(joinTimeout);
      leaveRoom();
      unsubscribers.forEach((unsub) => unsub());
      cleanupFnsRef.current = [];
    };
  }, [roomId, enabled]);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App going to background
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('[RoomPresence] App going to background, leaving room');
        leaveRoom();
      }

      // App coming back to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[RoomPresence] App coming to foreground, rejoining room');
        // Reconnect socket if needed
        if (!socketService.isConnected) {
          socketService.connect().then(() => {
            joinRoom();
          }).catch((error) => {
            console.error('Failed to reconnect socket:', error);
          });
        } else {
          joinRoom();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [roomId, enabled]);

  return {
    /**
     * Manually leave the room (useful for explicit leave actions)
     */
    leave: leaveRoom,
  };
}
