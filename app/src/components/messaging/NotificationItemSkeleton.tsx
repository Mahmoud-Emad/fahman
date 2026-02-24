/**
 * NotificationItemSkeleton - Loading skeleton for notification items
 */
import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@/themes";

/**
 * Skeleton component for notification items
 */
export function NotificationItemSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="flex-row items-start px-4 py-3">
      {/* Avatar skeleton */}
      <Animated.View
        className="w-11 h-11 rounded-full"
        style={{ backgroundColor: colors.neutral[200], opacity }}
      />

      {/* Content skeleton */}
      <View className="flex-1 ml-3">
        {/* Title row */}
        <View className="flex-row items-center justify-between mb-2">
          <Animated.View
            className="h-4 rounded-md"
            style={{ backgroundColor: colors.neutral[200], opacity, width: "50%" }}
          />
          <Animated.View
            className="h-3 rounded-md"
            style={{ backgroundColor: colors.neutral[200], opacity, width: 40 }}
          />
        </View>

        {/* Message */}
        <Animated.View
          className="h-3 rounded-md mb-1"
          style={{ backgroundColor: colors.neutral[200], opacity, width: "85%" }}
        />
        <Animated.View
          className="h-3 rounded-md"
          style={{ backgroundColor: colors.neutral[200], opacity, width: "60%" }}
        />
      </View>
    </View>
  );
}

/**
 * Multiple skeleton items for loading state
 */
export function NotificationSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {/* Group header skeleton */}
      <View className="px-4 py-2">
        <View
          className="h-3 rounded-md"
          style={{ backgroundColor: colors.neutral[200], width: 60 }}
        />
      </View>

      {/* Skeleton items */}
      {Array.from({ length: count }).map((_, index) => (
        <NotificationItemSkeleton key={index} />
      ))}
    </View>
  );
}
