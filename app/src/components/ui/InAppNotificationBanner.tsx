/**
 * InAppNotificationBanner - Animated top banner for incoming DMs and notifications.
 * Slides down from the top of the screen, auto-dismisses after 4 seconds.
 * Shows sender avatar, name, and a trimmed message preview.
 */
import React, { useEffect, useRef, useCallback } from "react";
import { View, Animated, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "./Avatar";
import { Text } from "./Text";
import { Icon } from "./Icon";

export interface InAppNotificationBannerProps {
  visible: boolean;
  senderName: string;
  senderAvatar?: string;
  senderInitials: string;
  message: string;
  type: "message" | "notification";
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4000;

export function InAppNotificationBanner({
  visible,
  senderName,
  senderAvatar,
  senderInitials,
  message,
  onDismiss,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, translateY, opacity, dismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: insets.top + 4,
        left: 12,
        right: 12,
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Pressable delayPressIn={0} onPress={dismiss}>
        <View
          className="flex-row items-center bg-white rounded-xl px-3 py-3 border border-neutral-200"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Avatar
            uri={senderAvatar}
            initials={senderInitials}
            size="sm"
          />
          <View className="flex-1 ml-2.5 mr-2">
            <Text className="font-semibold text-text text-sm" numberOfLines={1}>
              {senderName}
            </Text>
            <Text className="text-text-secondary text-xs mt-0.5" numberOfLines={1}>
              {message}
            </Text>
          </View>
          <Icon name="close" size="sm" className="text-text-muted" />
        </View>
      </Pressable>
    </Animated.View>
  );
}
