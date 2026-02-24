/**
 * NotificationsModal - Modal for viewing all notifications
 */
import React, { useMemo, useEffect, useRef } from "react";
import { View, ScrollView, Animated } from "react-native";
import { Modal, Text, EmptyState, Pressable } from "@/components/ui";
import { colors } from "@/themes";
import { NotificationItem } from "./NotificationItem";
import { NotificationSkeletonList } from "./NotificationItemSkeleton";
import type { Notification, NotificationAction, TimeGroup } from "./types";
import { getTimeGroup } from "./types";

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationPress: (notification: Notification) => void;
  onNotificationAction?: (
    notification: Notification,
    action: NotificationAction
  ) => void;
  onMarkAllRead: () => void;
  onDelete?: (notificationId: string) => void;
  onClearAll?: () => void;
  isLoading?: boolean;
}

/**
 * Get display label for time group
 */
function getTimeGroupLabel(group: TimeGroup): string {
  switch (group) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "this_week":
      return "This Week";
    case "earlier":
      return "Earlier";
  }
}

/**
 * Group notifications by time
 */
function groupNotifications(
  notifications: Notification[]
): Map<TimeGroup, Notification[]> {
  const groups = new Map<TimeGroup, Notification[]>();

  notifications.forEach((notification) => {
    const group = getTimeGroup(notification.timestamp);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(notification);
  });

  return groups;
}

/**
 * NotificationsModal component
 */
export function NotificationsModal({
  visible,
  onClose,
  notifications,
  onNotificationPress,
  onNotificationAction,
  onMarkAllRead,
  onDelete,
  onClearAll,
  isLoading = false,
}: NotificationsModalProps) {
  const groupedNotifications = useMemo(
    () => groupNotifications(notifications),
    [notifications]
  );

  const hasUnread = notifications.some((n) => !n.isRead);
  const isEmpty = notifications.length === 0 && !isLoading;

  // Smooth crossfade animation between loading and content
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  // Define the order of time groups
  const groupOrder: TimeGroup[] = ["today", "yesterday", "this_week", "earlier"];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title=""
      maxHeight="85%"
      padding="p-0"
    >
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Text variant="h3" className="font-bold">
          Notifications
        </Text>
        {hasUnread && !isLoading && (
          <Pressable onPress={onMarkAllRead} delayPressIn={0}>
            <Text
              variant="body-sm"
              className="font-medium"
              style={{ color: colors.primary[500] }}
            >
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {/* Notifications List - fixed height ensures consistent modal size */}
      <View style={{ height: 400 }}>
        {/* Loading skeleton with fade out */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            opacity: Animated.subtract(1, fadeAnim),
          }}
          pointerEvents={isLoading ? "auto" : "none"}
        >
          <NotificationSkeletonList count={5} />
        </Animated.View>

        {/* Content with fade in */}
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
          }}
          pointerEvents={isLoading ? "none" : "auto"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, minHeight: 400 }}
          >
            {isEmpty ? (
              <View className="flex-1 justify-center" style={{ minHeight: 350 }}>
                <EmptyState
                  icon="notifications-off"
                  title="No notifications"
                  description="When you receive game invites or friend requests, they'll appear here"
                />
              </View>
            ) : (
              groupOrder.map((group) => {
                const groupNotifs = groupedNotifications.get(group);
                if (!groupNotifs || groupNotifs.length === 0) {
                  return null;
                }

                return (
                  <View key={group}>
                    {/* Group Header */}
                    <View className="px-4 py-2">
                      <Text
                        variant="caption"
                        className="font-semibold uppercase tracking-wider"
                        style={{ color: colors.neutral[400], fontSize: 11 }}
                      >
                        {getTimeGroupLabel(group)}
                      </Text>
                    </View>

                    {/* Group Items */}
                    {groupNotifs.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={() => onNotificationPress(notification)}
                        onAction={
                          onNotificationAction
                            ? (action) => onNotificationAction(notification, action)
                            : undefined
                        }
                        onDelete={onDelete}
                      />
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Clear All Read Button (optional) */}
      {!isEmpty && onClearAll && (
        <View
          className="px-4 pt-2 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <Pressable
            onPress={onClearAll}
            delayPressIn={0}
            className="py-3 items-center"
          >
            <Text variant="body-sm" color="muted">
              Clear all read notifications
            </Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}
