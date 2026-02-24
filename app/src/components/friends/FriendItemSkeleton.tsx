/**
 * FriendItemSkeleton - Loading skeleton for friend items
 */
import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@/themes";

/**
 * Single friend item skeleton
 */
export function FriendItemSkeleton() {
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
          style={{ backgroundColor: colors.neutral[200], opacity, width: "60%" }}
        />
        {/* Status */}
        <Animated.View
          className="h-3 rounded-md"
          style={{ backgroundColor: colors.neutral[200], opacity, width: "40%" }}
        />
      </View>

      {/* Action buttons skeleton */}
      <View className="flex-row gap-2">
        <Animated.View
          className="w-9 h-9 rounded-full"
          style={{ backgroundColor: colors.neutral[200], opacity }}
        />
        <Animated.View
          className="w-9 h-9 rounded-full"
          style={{ backgroundColor: colors.neutral[200], opacity }}
        />
      </View>
    </View>
  );
}

/**
 * List of friend skeletons
 */
interface FriendSkeletonListProps {
  count?: number;
}

export function FriendSkeletonList({ count = 6 }: FriendSkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <FriendItemSkeleton key={index} />
      ))}
    </View>
  );
}
