/**
 * useLobbyDM - All state, animation, keyboard tracking, and business logic
 * for the draggable floating DM FAB.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  PanResponder,
  type EmitterSubscription,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type PanResponderInstance,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Conversation, DirectMessage, RoomInviteData } from "@/components/messaging/types";
import { messageService } from "@/services/messageService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;
export const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH - 32);
export const FAB_SIZE = 56;
const EDGE_MARGIN = 12;
const TAP_SLOP = 8;
export const REMOVE_ZONE_SIZE = 56;
const REMOVE_THRESHOLD = 70;

export type PanelView = "list" | "chat";

export interface LobbyDMFabProps {
  conversations: Conversation[];
  unreadCount: number;
  isLoading?: boolean;
  onConversationPress: (conversation: Conversation) => void;
  activeConversation: Conversation | null;
  activeMessages: DirectMessage[];
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onJoinRoom?: (invite: RoomInviteData) => void;
  currentUserId: string;
  onBack: () => void;
  chatActive: boolean;
  bottomOffset?: number;
}

export function useLobbyDM({
  unreadCount,
  activeConversation,
  activeMessages,
  onDeleteMessage,
  onBack,
  chatActive,
  bottomOffset = 0,
}: Pick<
  LobbyDMFabProps,
  | "unreadCount"
  | "activeConversation"
  | "activeMessages"
  | "onDeleteMessage"
  | "onBack"
  | "chatActive"
  | "bottomOffset"
>) {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  // --- Layout bounds ---
  const topBound = insets.top + 8;
  const botBound = SCREEN_HEIGHT - FAB_SIZE - bottomOffset - insets.bottom - 16;
  const leftBound = EDGE_MARGIN;
  const rightBound = SCREEN_WIDTH - FAB_SIZE - EDGE_MARGIN;

  // --- Core state ---
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOverRemove, setIsOverRemove] = useState(false);
  const isOverRemoveRef = useRef(false);
  const [kbHeight, setKbHeight] = useState(0);

  // --- Animated values ---
  const pan = useRef(new Animated.ValueXY({ x: rightBound, y: botBound })).current;
  const posRef = useRef({ x: rightBound, y: botBound });
  const panelAnim = useRef(new Animated.Value(0)).current;
  const removeZoneAnim = useRef(new Animated.Value(0)).current;
  const removeZoneScale = useRef(new Animated.Value(1)).current;
  const dismissAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const scrollViewRef = useRef<FlatList>(null);
  const prevUnreadRef = useRef(unreadCount);
  const toggleRef = useRef<() => void>(() => {});
  const isOpenRef = useRef(false);

  const panelView: PanelView = chatActive && activeConversation ? "chat" : "list";
  const participant = activeConversation?.participants[0];

  // --- Remove zone center (bottom-center of screen) ---
  const removeZoneCenter = {
    x: SCREEN_WIDTH / 2,
    y: SCREEN_HEIGHT - insets.bottom - 50,
  };

  // --- Clamp helper ---
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // --- Snap to nearest edge ---
  const snapToEdge = (x: number, y: number) => {
    const midX = SCREEN_WIDTH / 2 - FAB_SIZE / 2;
    const snapX = x < midX ? leftBound : rightBound;
    const snapY = clamp(y, topBound, botBound);
    return { x: snapX, y: snapY };
  };

  // --- Check if FAB center is in remove zone ---
  const isInRemoveZone = (x: number, y: number) => {
    const fabCenterX = x + FAB_SIZE / 2;
    const fabCenterY = y + FAB_SIZE / 2;
    const dx = fabCenterX - removeZoneCenter.x;
    const dy = fabCenterY - removeZoneCenter.y;
    return Math.sqrt(dx * dx + dy * dy) < REMOVE_THRESHOLD;
  };

  // ================================================
  // PanResponder — drag logic
  // ================================================
  const panResponder: PanResponderInstance = useMemo(() => {
    let startPos = { x: 0, y: 0 };
    let moved = false;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !isOpenRef.current && (Math.abs(g.dx) > TAP_SLOP || Math.abs(g.dy) > TAP_SLOP),

      onPanResponderGrant: () => {
        startPos = { ...posRef.current };
        moved = false;
      },

      onPanResponderMove: (
        _: GestureResponderEvent,
        g: PanResponderGestureState
      ) => {
        if (Math.abs(g.dx) > TAP_SLOP || Math.abs(g.dy) > TAP_SLOP) {
          if (!moved) {
            moved = true;
            setIsDragging(true);
            Animated.spring(removeZoneAnim, {
              toValue: 1,
              damping: 18,
              stiffness: 200,
              useNativeDriver: true,
            }).start();
          }
        }

        if (moved) {
          const newX = clamp(startPos.x + g.dx, leftBound, rightBound);
          const newY = clamp(startPos.y + g.dy, topBound, botBound + 60);
          pan.setValue({ x: newX, y: newY });

          const over = isInRemoveZone(newX, newY);
          if (over !== isOverRemoveRef.current) {
            isOverRemoveRef.current = over;
            setIsOverRemove(over);
            Animated.spring(removeZoneScale, {
              toValue: over ? 1.3 : 1,
              damping: 12,
              stiffness: 200,
              useNativeDriver: true,
            }).start();
          }
        }
      },

      onPanResponderRelease: (
        _: GestureResponderEvent,
        g: PanResponderGestureState
      ) => {
        if (!moved) {
          toggleRef.current();
          return;
        }

        const rawX = startPos.x + g.dx;
        const rawY = startPos.y + g.dy;

        Animated.timing(removeZoneAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

        if (isInRemoveZone(rawX, rawY)) {
          Animated.parallel([
            Animated.spring(pan, {
              toValue: {
                x: removeZoneCenter.x - FAB_SIZE / 2,
                y: removeZoneCenter.y - FAB_SIZE / 2,
              },
              damping: 20,
              stiffness: 250,
              useNativeDriver: false,
            }),
            Animated.timing(dismissAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsDismissed(true);
            setIsDragging(false);
            setIsOverRemove(false);
            const resetPos = { x: rightBound, y: botBound };
            posRef.current = resetPos;
            pan.setValue(resetPos);
            dismissAnim.setValue(1);
          });
          return;
        }

        const snap = snapToEdge(rawX, rawY);
        posRef.current = snap;

        Animated.spring(pan, {
          toValue: snap,
          damping: 20,
          stiffness: 200,
          useNativeDriver: false,
        }).start(() => {
          setIsDragging(false);
          setIsOverRemove(false);
        });
      },
    });
  }, []); // Stable — uses refs for all changing values

  // ================================================
  // Panel toggle
  // ================================================
  const togglePanel = useCallback(() => {
    if (isOpen) {
      Keyboard.dismiss();
      Animated.spring(panelAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }).start(() => {
        setIsOpen(false);
        setKbHeight(0);
      });
    } else {
      setIsOpen(true);
      panelAnim.setValue(0);
      Animated.spring(panelAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 160,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, panelAnim]);

  // Keep refs current for PanResponder (avoids stale closures in useMemo)
  toggleRef.current = togglePanel;
  isOpenRef.current = isOpen;

  // ================================================
  // New message pulse + auto-reappear
  // ================================================
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      if (isDismissed) {
        setIsDismissed(false);
        dismissAnim.setValue(0);
        Animated.spring(dismissAnim, {
          toValue: 1,
          damping: 14,
          stiffness: 180,
          useNativeDriver: true,
        }).start();
      }

      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    prevUnreadRef.current = unreadCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // isDismissed, dismissAnim, pulseAnim are stable refs/values; only react to unreadCount changes.
  }, [unreadCount]);

  // ================================================
  // Keyboard tracking (when panel is open)
  // ================================================
  useEffect(() => {
    if (!isOpen) return;
    const subs: EmitterSubscription[] = [];

    if (Platform.OS === "ios") {
      subs.push(
        Keyboard.addListener("keyboardWillChangeFrame", (e) => {
          const screenH = Dimensions.get("screen").height;
          const h = Math.max(0, screenH - e.endCoordinates.screenY);
          setKbHeight(h);
          if (h > 0) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
        })
      );
    } else {
      subs.push(
        Keyboard.addListener("keyboardDidShow", (e) => {
          setKbHeight(e.endCoordinates.height);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
        }),
        Keyboard.addListener("keyboardDidHide", () => setKbHeight(0))
      );
    }

    return () => subs.forEach((s) => s.remove());
  }, [isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen && panelView === "chat" && activeMessages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [isOpen, panelView, activeMessages.length]);

  // ================================================
  // Handlers
  // ================================================
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) onDeleteMessage?.(messageId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [onDeleteMessage, toast]);

  const handleBackToList = useCallback(() => {
    Keyboard.dismiss();
    setKbHeight(0);
    onBack();
  }, [onBack]);

  // ================================================
  // Panel positioning (computed from settled position)
  // ================================================
  const fabX = posRef.current.x;
  const fabY = posRef.current.y;
  const fabOnRight = fabX > SCREEN_WIDTH / 2 - FAB_SIZE / 2;

  const panelBottom = SCREEN_HEIGHT - fabY + 12;
  const kbAdjust = kbHeight > 0 ? kbHeight - bottomOffset - insets.bottom : 0;
  const availableHeight = fabY - topBound - 12;
  const panelHeight = Math.min(PANEL_MAX_HEIGHT, availableHeight - kbAdjust);

  const panelRight = fabOnRight ? SCREEN_WIDTH - fabX - FAB_SIZE : undefined;
  const panelLeft = !fabOnRight ? fabX : undefined;

  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return {
    // State
    isOpen,
    isDragging,
    isDismissed,
    isOverRemove,
    panelView,
    participant,

    // Animated values
    pan,
    panelAnim,
    removeZoneAnim,
    removeZoneScale,
    dismissAnim,
    pulseAnim,

    // Panel positioning
    panelHeight,
    panelBottom,
    kbAdjust,
    panelRight,
    panelLeft,
    panelTranslateY,
    panelScale,

    // Refs
    scrollViewRef,
    panResponder,

    // Insets
    insets,

    // Handlers
    togglePanel,
    handleDeleteMessage,
    handleBackToList,
  };
}
