/**
 * SkeletonCard - Loading skeleton for room cards
 */
import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { colors } from "@/themes";
import { CARD_WIDTH } from "./RoomCard";

/**
 * Skeleton card component for loading state
 */
export function SkeletonCard() {
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
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        width: CARD_WIDTH,
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.neutral[200],
      }}
    >
      <View className="p-3">
        {/* Logo and info skeleton */}
        <View className="flex-row items-center mb-2">
          <Animated.View
            className="w-11 h-11 rounded-xl"
            style={{ backgroundColor: colors.neutral[200], opacity }}
          />
          <View className="flex-1 ml-2.5">
            <Animated.View
              className="h-4 rounded-md mb-1.5"
              style={{ backgroundColor: colors.neutral[200], opacity, width: "80%" }}
            />
            <Animated.View
              className="h-3 rounded-md"
              style={{ backgroundColor: colors.neutral[200], opacity, width: "50%" }}
            />
          </View>
        </View>

        {/* Footer skeleton */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row">
            {[1, 2, 3].map((i) => (
              <Animated.View
                key={i}
                className="w-5 h-5 rounded-full"
                style={{
                  backgroundColor: colors.neutral[200],
                  opacity,
                  marginLeft: i > 1 ? -8 : 0,
                }}
              />
            ))}
          </View>
          <Animated.View
            className="h-3 w-12 rounded-md"
            style={{ backgroundColor: colors.neutral[200], opacity }}
          />
        </View>
      </View>
    </View>
  );
}
