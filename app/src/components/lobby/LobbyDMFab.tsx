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
import React from "react";
import { View, Pressable, Animated, Dimensions, StyleSheet } from "react-native";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { LobbyDMChatView } from "./LobbyDMChatView";
import { LobbyDMList } from "./LobbyDMList";
import {
  useLobbyDM,
  FAB_SIZE,
  PANEL_WIDTH,
  REMOVE_ZONE_SIZE,
  type LobbyDMFabProps,
} from "./useLobbyDM";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type { LobbyDMFabProps };

export function LobbyDMFab(props: LobbyDMFabProps) {
  const {
    conversations,
    unreadCount,
    isLoading = false,
    onConversationPress,
    activeConversation,
    activeMessages,
    onSendMessage,
    onJoinRoom,
    currentUserId,
    chatActive,
  } = props;

  const dm = useLobbyDM(props);

  if (dm.isDismissed) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop when panel is open */}
      {dm.isOpen && (
        <Pressable style={styles.backdrop} onPress={dm.togglePanel} />
      )}

      {/* Remove zone (visible only while dragging) */}
      {dm.isDragging && (
        <Animated.View
          style={[
            styles.removeZone,
            {
              bottom: dm.insets.bottom + 30,
              opacity: dm.removeZoneAnim,
              transform: [{ scale: dm.removeZoneScale }],
            },
          ]}
        >
          <View
            style={[
              styles.removeCircle,
              dm.isOverRemove && styles.removeCircleActive,
            ]}
          >
            <Icon
              name="close"
              customSize={24}
              color={dm.isOverRemove ? colors.white : colors.neutral[500]}
            />
          </View>
        </Animated.View>
      )}

      {/* Chat Panel */}
      {dm.isOpen && (
        <Animated.View
          style={[
            styles.panel,
            {
              height: dm.panelHeight,
              bottom: dm.panelBottom + dm.kbAdjust,
              ...(dm.panelRight !== undefined && { right: dm.panelRight }),
              ...(dm.panelLeft !== undefined && { left: dm.panelLeft }),
              opacity: dm.panelAnim,
              transform: [{ translateY: dm.panelTranslateY }, { scale: dm.panelScale }],
            },
          ]}
        >
          {/* Panel Header */}
          <View style={styles.panelHeader}>
            {dm.panelView === "chat" && activeConversation ? (
              <View style={styles.chatHeader}>
                <Pressable onPress={dm.handleBackToList} style={styles.backBtn} delayPressIn={0}>
                  <Icon name="chevron-back" size="sm" color={colors.text.primary} />
                </Pressable>
                <Avatar
                  source={dm.participant?.avatar}
                  initials={dm.participant?.initials || "??"}
                  size="xs"
                />
                <View style={styles.chatHeaderInfo}>
                  <Text variant="body-sm" className="font-semibold" numberOfLines={1}>
                    {dm.participant?.name || "Unknown"}
                  </Text>
                  {dm.participant?.isOnline && <View style={styles.onlineDot} />}
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
            <Pressable onPress={dm.togglePanel} style={styles.closeBtn} delayPressIn={0}>
              <Icon name="close" customSize={16} color={colors.text.muted} />
            </Pressable>
          </View>

          {/* Panel Content */}
          {dm.panelView === "chat" && activeConversation ? (
            <LobbyDMChatView
              messages={activeMessages}
              currentUserId={currentUserId}
              scrollViewRef={dm.scrollViewRef}
              onSendMessage={onSendMessage}
              onDeleteMessage={dm.handleDeleteMessage}
              onJoinRoom={onJoinRoom}
            />
          ) : (
            <LobbyDMList
              conversations={conversations}
              isLoading={isLoading}
              onConversationPress={onConversationPress}
            />
          )}
        </Animated.View>
      )}

      {/* Draggable FAB */}
      <Animated.View
        {...dm.panResponder.panHandlers}
        style={[styles.fabWrapper, { left: dm.pan.x, top: dm.pan.y }]}
      >
        <Animated.View
          style={{ transform: [{ scale: Animated.multiply(dm.dismissAnim, dm.pulseAnim) }] }}
        >
          <Pressable
            onPress={dm.togglePanel}
            delayPressIn={0}
            style={[styles.fab, dm.isOpen && styles.fabActive]}
          >
            <Icon
              name={dm.isOpen ? "close" : "chatbubble-ellipses"}
              size="md"
              color={colors.white}
            />

            {!dm.isOpen && unreadCount > 0 && (
              <View style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}

            {!dm.isOpen && unreadCount > 0 && (
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
});
