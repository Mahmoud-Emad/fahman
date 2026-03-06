/**
 * useRoomPresence Hook
 * Automatically handles socket room join/leave and presence tracking
 * Manages app lifecycle to handle backgrounding/closing gracefully
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { socketService } from '@/services/socketService';
import type { RoomMemberInfo } from '@/services/socketService';

interface UseRoomPresenceOptions {
  roomId: string;
  enabled?: boolean;
  onRoomJoined?: (members: RoomMemberInfo[]) => void;
  onPlayerJoined?: (player: RoomMemberInfo) => void;
  onPlayerLeft?: (playerId: string) => void;
  onRoomClosed?: (reason: string) => void;
  onKicked?: (reason: string) => void;
}

/**
 * Hook to manage room presence via WebSocket
 *
 * Features:
 * - Auto join room when socket is connected (no timing hacks)
 * - Auto leave room on unmount
 * - Handle app backgrounding (leave room)
 * - Handle app foregrounding (rejoin room)
 * - Clean event listener management
 */
export function useRoomPresence({
  roomId,
  enabled = true,
  onRoomJoined,
  onPlayerJoined,
  onPlayerLeft,
  onRoomClosed,
  onKicked,
}: UseRoomPresenceOptions) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isJoinedRef = useRef(false);

  /**
   * Join the room socket channel
   */
  const joinRoom = useCallback(() => {
    if (!enabled || isJoinedRef.current || !roomId) return;

    if (socketService.isConnected) {
      socketService.joinRoom(roomId);
      isJoinedRef.current = true;
    }
  }, [enabled, roomId]);

  /**
   * Leave the room socket channel
   */
  const leaveRoom = useCallback(() => {
    if (!isJoinedRef.current) return;

    socketService.leaveRoom(roomId);
    isJoinedRef.current = false;
  }, [roomId]);

  /**
   * Setup event listeners and join room
   */
  useEffect(() => {
    if (!enabled || !roomId) return;

    const unsubscribers: (() => void)[] = [];

    // Room joined event (initial members list from server)
    if (onRoomJoined) {
      const unsub = socketService.onRoomJoined((data) => {
        if (data.roomId === roomId) {
          onRoomJoined(data.members);
        }
      });
      unsubscribers.push(unsub);
    }

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

    // Join immediately if socket is already connected
    if (socketService.isConnected) {
      socketService.joinRoom(roomId);
      isJoinedRef.current = true;
    }

    // Also join when socket (re)connects — handles initial connection,
    // reconnections, and cases where socket wasn't ready yet
    const unsubConnect = socketService.onConnect(() => {
      if (!isJoinedRef.current) {
        socketService.joinRoom(roomId);
        isJoinedRef.current = true;
      }
    });
    unsubscribers.push(unsubConnect);

    // Cleanup on unmount
    return () => {
      leaveRoom();
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [roomId, enabled]);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    if (!enabled || !roomId) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App going to background
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        leaveRoom();
      }

      // App coming back to foreground
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (!socketService.isConnected) {
          // Socket will reconnect automatically, onConnect listener will rejoin room
          socketService.connect().catch(() => {});
        } else {
          joinRoom();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [roomId, enabled, joinRoom, leaveRoom]);

  return {
    leave: leaveRoom,
  };
}
