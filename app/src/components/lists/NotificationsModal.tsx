/**
 * NotificationsModal - Modal for viewing all notifications, grouped by time
 */
import React, { useMemo, useEffect, useRef } from "react";
import { View, ScrollView, Animated } from "react-native";
import { Modal, Text, EmptyState, Pressable } from "@/components/ui";
import { colors } from "@/themes";
import { NotificationItem } from "@/components/messaging/NotificationItem";
import { NotificationSkeletonList } from "@/components/messaging/NotificationItemSkeleton";
import type { Notification, NotificationAction, TimeGroup } from "@/components/messaging/types";
import { getTimeGroup } from "@/components/messaging/types";

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

const TIME_GROUP_LABELS: Record<TimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  earlier: "Earlier",
};

const GROUP_ORDER: TimeGroup[] = ["today", "yesterday", "this_week", "earlier"];

function groupNotifications(
  notifications: Notification[]
): Map<TimeGroup, Notification[]> {
  const groups = new Map<TimeGroup, Notification[]>();
  for (const notification of notifications) {
    const group = getTimeGroup(notification.timestamp);
    const list = groups.get(group) ?? [];
    list.push(notification);
    groups.set(group, list);
  }
  return groups;
}

/**
 * NotificationsModal component
 *
 * Unlike other list modals, this one groups notifications by time period
 * (Today, Yesterday, This Week, Earlier), so it doesn't use the generic
 * ListModal component.
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
  const grouped = useMemo(
    () => groupNotifications(notifications),
    [notifications]
  );
  const hasUnread = notifications.some((n) => !n.isRead);
  const isEmpty = notifications.length === 0 && !isLoading;

  // Crossfade between loading skeleton and content
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  return (
    <Modal visible={visible} onClose={onClose} title="" padding="p-0">
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

      {/* Notifications List */}
      <View style={{ flex: 1 }}>
        {/* Skeleton */}
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

        {/* Content */}
        <Animated.View
          style={{ flex: 1, opacity: fadeAnim }}
          pointerEvents={isLoading ? "none" : "auto"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, minHeight: 400 }}
          >
            {isEmpty ? (
              <View
                className="flex-1 justify-center"
                style={{ minHeight: 350 }}
              >
                <EmptyState
                  icon="notifications-off"
                  title="No notifications"
                  description="When you receive game invites or friend requests, they'll appear here"
                />
              </View>
            ) : (
              GROUP_ORDER.map((group) => {
                const items = grouped.get(group);
                if (!items?.length) return null;
                return (
                  <View key={group}>
                    <View className="px-4 py-2">
                      <Text
                        variant="caption"
                        className="font-semibold uppercase tracking-wider"
                        style={{ color: colors.neutral[400], fontSize: 11 }}
                      >
                        {TIME_GROUP_LABELS[group]}
                      </Text>
                    </View>
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={() => onNotificationPress(notification)}
                        onAction={
                          onNotificationAction
                            ? (action) =>
                                onNotificationAction(notification, action)
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

      {/* Clear All */}
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
