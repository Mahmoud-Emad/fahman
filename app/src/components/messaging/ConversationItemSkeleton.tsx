/**
 * ConversationItemSkeleton - Loading skeleton for conversation items
 */
import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@/themes";

/**
 * Skeleton component for conversation items
 */
export function ConversationItemSkeleton() {
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
    <View className="flex-row items-center px-4 py-3">
      {/* Avatar skeleton */}
      <Animated.View
        className="w-12 h-12 rounded-full"
        style={{ backgroundColor: colors.neutral[200], opacity }}
      />

      {/* Content skeleton */}
      <View className="flex-1 ml-3">
        {/* Name */}
        <Animated.View
          className="h-4 rounded-md mb-2"
          style={{ backgroundColor: colors.neutral[200], opacity, width: "50%" }}
        />

        {/* Last message */}
        <Animated.View
          className="h-3 rounded-md"
          style={{ backgroundColor: colors.neutral[200], opacity, width: "75%" }}
        />
      </View>

      {/* Right side */}
      <View className="items-end">
        {/* Time */}
        <Animated.View
          className="h-2.5 w-10 rounded-md mb-2"
          style={{ backgroundColor: colors.neutral[200], opacity }}
        />

        {/* Badge placeholder */}
        <Animated.View
          className="w-5 h-5 rounded-full"
          style={{ backgroundColor: colors.neutral[200], opacity }}
        />
      </View>
    </View>
  );
}

/**
 * Multiple skeleton items for loading state
 */
export function ConversationSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ConversationItemSkeleton key={index} />
      ))}
    </View>
  );
}
