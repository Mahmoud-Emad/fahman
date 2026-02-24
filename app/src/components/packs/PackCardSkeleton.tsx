/**
 * PackCardSkeleton - Loading skeleton for pack cards
 */
import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@/themes";

interface PackCardSkeletonProps {
  size?: "sm" | "md";
}

/**
 * Skeleton card component for pack loading state
 */
export function PackCardSkeleton({ size = "md" }: PackCardSkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardSize = size === "sm" ? { width: 100, height: 120 } : { width: 120, height: 140 };
  const logoSize = size === "sm" ? 48 : 56;

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
    <View
      className="rounded-xl items-center justify-center p-3"
      style={{
        ...cardSize,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 12,
      }}
    >
      {/* Logo skeleton */}
      <Animated.View
        className="rounded-lg mb-2"
        style={{
          width: logoSize,
          height: logoSize,
          backgroundColor: colors.neutral[200],
          opacity,
        }}
      />

      {/* Title skeleton */}
      <Animated.View
        className="rounded-md mb-1"
        style={{
          width: "80%",
          height: 12,
          backgroundColor: colors.neutral[200],
          opacity,
        }}
      />

      {/* Questions count skeleton */}
      <Animated.View
        className="rounded-md"
        style={{
          width: "50%",
          height: 10,
          backgroundColor: colors.neutral[200],
          opacity,
        }}
      />
    </View>
  );
}
