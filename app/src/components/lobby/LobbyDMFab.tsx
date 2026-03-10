/**
 * LobbyDMFab - Messenger-style draggable floating chat bubble
 *
 * Features:
 * - Draggable with edge-snapping (snaps to left or right edge on release)
 * - Boundary clamping (stays within safe area)
 * - Remove zone at bottom (drag to X to dismiss, like Messenger)
 * - Auto-reappears with pulse when new messages arrive while dismissed
 * - Pulsing green dot on new incoming messages
 * - Opens a mini conversations panel for inline DM browsing & replying
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Pressable,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  Keyboard,
  Platform,
  PanResponder,
  type EmitterSubscription,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, Avatar, EmptyState } from "@/components/ui";
import { ConversationItem } from "@/components/messaging/ConversationItem";
import { ConversationSkeletonList } from "@/components/messaging/ConversationItemSkeleton";
import { ChatBubble } from "@/components/chat";
import { MessageInput } from "@/components/messaging/MessageInput";
import type { Conversation, DirectMessage, RoomInviteData } from "@/components/messaging/types";
import { messageService } from "@/services/messageService";
import { colors, withOpacity } from "@/themes";
import { useToast } from "@/contexts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_MAX_HEIGHT = SCREEN_HEIGHT * 0.55;
const PANEL_WIDTH = Math.min(320, SCREEN_WIDTH - 32);
const FAB_SIZE = 56;
const EDGE_MARGIN = 12;
const TAP_SLOP = 8;
const REMOVE_ZONE_SIZE = 56;
const REMOVE_THRESHOLD = 70;

type PanelView = "list" | "chat";

interface LobbyDMFabProps {
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

export function LobbyDMFab({
  conversations,
  unreadCount,
  isLoading = false,
  onConversationPress,
  activeConversation,
  activeMessages,
  onSendMessage,
  onDeleteMessage,
  onJoinRoom,
  currentUserId,
  onBack,
  chatActive,
  bottomOffset = 0,
}: LobbyDMFabProps) {
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
  const panResponder = useMemo(() => {
    let startPos = { x: 0, y: 0 };
    let moved = false;

    return PanResponder.create({
      // Don't claim on start — let taps pass through to Pressable
      onStartShouldSetPanResponder: () => false,
      // Only claim once actual movement is detected (drag)
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
          // Tap
          toggleRef.current();
          return;
        }

        const rawX = startPos.x + g.dx;
        const rawY = startPos.y + g.dy;

        // Hide remove zone
        Animated.timing(removeZoneAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

        // Check remove zone
        if (isInRemoveZone(rawX, rawY)) {
          // Animate into remove zone center then dismiss
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
            // Reset position for when it reappears
            const resetPos = { x: rightBound, y: botBound };
            posRef.current = resetPos;
            pan.setValue(resetPos);
            dismissAnim.setValue(1);
          });
          return;
        }

        // Snap to edge
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
      // New message arrived
      if (isDismissed) {
        // Reappear
        setIsDismissed(false);
        dismissAnim.setValue(0);
        Animated.spring(dismissAnim, {
          toValue: 1,
          damping: 14,
          stiffness: 180,
          useNativeDriver: true,
        }).start();
      }

      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    prevUnreadRef.current = unreadCount;
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
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) onDeleteMessage?.(messageId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete message");
    }
  };

  const handleBackToList = () => {
    Keyboard.dismiss();
    setKbHeight(0);
    onBack();
  };

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

  // Don't render if dismissed
  if (isDismissed) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop when panel is open */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={togglePanel} />
      )}

      {/* Remove zone (visible only while dragging) */}
      {isDragging && (
        <Animated.View
          style={[
            styles.removeZone,
            {
              bottom: insets.bottom + 30,
              opacity: removeZoneAnim,
              transform: [{ scale: removeZoneScale }],
            },
          ]}
        >
          <View
            style={[
              styles.removeCircle,
              isOverRemove && styles.removeCircleActive,
            ]}
          >
            <Icon
              name="close"
              customSize={24}
              color={isOverRemove ? colors.white : colors.neutral[500]}
            />
          </View>
        </Animated.View>
      )}

      {/* Chat Panel (anchored to settled FAB position) */}
      {isOpen && (
        <Animated.View
          style={[
            styles.panel,
            {
              height: panelHeight,
              bottom: panelBottom + kbAdjust,
              ...(panelRight !== undefined && { right: panelRight }),
              ...(panelLeft !== undefined && { left: panelLeft }),
              opacity: panelAnim,
              transform: [{ translateY: panelTranslateY }, { scale: panelScale }],
            },
          ]}
        >
          {/* Panel Header */}
          <View style={styles.panelHeader}>
            {panelView === "chat" && activeConversation ? (
              <View style={styles.chatHeader}>
                <Pressable onPress={handleBackToList} style={styles.backBtn} delayPressIn={0}>
                  <Icon name="chevron-back" size="sm" color={colors.text.primary} />
                </Pressable>
                <Avatar
                  source={participant?.avatar}
                  initials={participant?.initials || "??"}
                  size="xs"
                />
                <View style={styles.chatHeaderInfo}>
                  <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                    {participant?.name || "Unknown"}
                  </Text>
                  {participant?.isOnline && <View style={styles.onlineDot} />}
                </View>
              </View>
            ) : (
              <View style={styles.listHeader}>
                <Icon name="chatbubbles" size="sm" color={colors.primary[500]} />
                <Text variant="body" className="font-semibold ml-2">Messages</Text>
                {unreadCount > 0 && (
                  <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}
            <Pressable onPress={togglePanel} style={styles.closeBtn} delayPressIn={0}>
              <Icon name="close" customSize={16} color={colors.text.muted} />
            </Pressable>
          </View>

          {/* Panel Content */}
          {panelView === "chat" && activeConversation ? (
            <View style={styles.chatContent}>
              <FlatList
                ref={scrollViewRef as any}
                data={activeMessages}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={[
                  styles.messagesContent,
                  activeMessages.length === 0 && styles.messagesEmpty,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                ListEmptyComponent={
                  <EmptyState
                    icon="chatbubble"
                    title="No messages yet"
                    description="Send a message to start chatting"
                    iconSize="md"
                  />
                }
                renderItem={({ item: message }) => (
                  <ChatBubble
                    isCurrentUser={message.senderId === currentUserId}
                    type={message.type === "room_invite" ? "room_invite" : message.type === "system" ? "system" : "text"}
                    text={message.text}
                    roomInvite={message.roomInvite}
                    senderName={message.senderName}
                    senderInitials={message.senderInitials}
                    timestamp={message.timestamp}
                    status={message.status}
                    onRoomInvitePress={onJoinRoom}
                    onDelete={handleDeleteMessage}
                    messageId={message.id}
                    variant="dm"
                  />
                )}
              />
              <View style={styles.inputContainer}>
                <MessageInput onSend={onSendMessage} placeholder="Message..." />
              </View>
            </View>
          ) : (
            <View style={styles.listContent}>
              {isLoading ? (
                <ConversationSkeletonList count={4} />
              ) : conversations.length > 0 ? (
                <FlatList
                  data={conversations}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: conv }) => (
                    <ConversationItem
                      conversation={conv}
                      onPress={() => onConversationPress(conv)}
                    />
                  )}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <EmptyState
                    icon="chatbubbles"
                    title="No conversations"
                    description="Your private messages will appear here"
                    iconSize="md"
                  />
                </View>
              )}
            </View>
          )}
        </Animated.View>
      )}

      {/* Draggable FAB — two nested views: outer=position (JS), inner=scale (native) */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.fabWrapper, { left: pan.x, top: pan.y }]}
      >
        <Animated.View
          style={{ transform: [{ scale: Animated.multiply(dismissAnim, pulseAnim) }] }}
        >
          <Pressable
            onPress={togglePanel}
            delayPressIn={0}
            style={[styles.fab, isOpen && styles.fabActive]}
          >
            <Icon
              name={isOpen ? "close" : "chatbubble-ellipses"}
              size="md"
              color={colors.white}
            />

            {/* Unread count badge */}
            {!isOpen && unreadCount > 0 && (
              <View style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}

            {/* New message dot (green indicator) */}
            {!isOpen && unreadCount > 0 && (
              <View style={styles.newDot} />
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ================================================
// Styles
// ================================================
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withOpacity(colors.black, 0.15),
  },

  // --- FAB ---
  fabWrapper: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    zIndex: 1001,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: colors.neutral[700],
  },
  fabBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.white,
  },
  fabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  newDot: {
    position: "absolute",
    bottom: -2,
    left: FAB_SIZE / 2 - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },

  // --- Remove zone ---
  removeZone: {
    position: "absolute",
    alignSelf: "center",
    left: SCREEN_WIDTH / 2 - REMOVE_ZONE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  removeCircle: {
    width: REMOVE_ZONE_SIZE,
    height: REMOVE_ZONE_SIZE,
    borderRadius: REMOVE_ZONE_SIZE / 2,
    backgroundColor: colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.neutral[300],
  },
  removeCircleActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },

  // --- Panel ---
  panel: {
    position: "absolute",
    width: PANEL_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
    zIndex: 1002,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    flex: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginLeft: 6,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral[100],
  },
  listContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  chatContent: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  messagesEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
});
