/**
 * Skeleton - Loading skeleton primitives with shimmer animation
 */
import React, { useEffect, useRef } from "react";
import { View, Animated, type ViewStyle, type DimensionValue } from "react-native";
import { colors } from "@/themes";

interface SkeletonBoxProps {
  /** Width of the skeleton */
  width?: DimensionValue;
  /** Height of the skeleton */
  height?: DimensionValue;
  /** Border radius */
  borderRadius?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Custom class names */
  className?: string;
}

/**
 * Base animated skeleton box with shimmer effect
 */
export function SkeletonBox({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
  className = "",
}: SkeletonBoxProps) {
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
    <Animated.View
      className={className}
      style={[
        {
          width: width as number | "auto",
          height: height as number | "auto",
          borderRadius,
          backgroundColor: colors.neutral[200],
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCircleProps {
  /** Size of the circle */
  size?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Custom class names */
  className?: string;
}

/**
 * Circular skeleton for avatars
 */
export function SkeletonCircle({
  size = 40,
  style,
  className = "",
}: SkeletonCircleProps) {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      className={className}
    />
  );
}

interface SkeletonTextProps {
  /** Number of text lines */
  lines?: number;
  /** Width of each line (can be array for different widths) */
  lineWidth?: DimensionValue | DimensionValue[];
  /** Height of each line */
  lineHeight?: number;
  /** Gap between lines */
  gap?: number;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Multi-line text skeleton
 */
export function SkeletonText({
  lines = 1,
  lineWidth = "100%",
  lineHeight = 14,
  gap = 8,
  style,
}: SkeletonTextProps) {
  const getLineWidth = (index: number): DimensionValue => {
    if (Array.isArray(lineWidth)) {
      return lineWidth[index] ?? lineWidth[lineWidth.length - 1];
    }
    // Last line is shorter by default
    if (index === lines - 1 && lines > 1) {
      return typeof lineWidth === "number" ? lineWidth * 0.7 : "70%";
    }
    return lineWidth;
  };

  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={index}
          width={getLineWidth(index)}
          height={lineHeight}
          borderRadius={lineHeight / 2}
        />
      ))}
    </View>
  );
}

interface SkeletonListItemProps {
  /** Show avatar circle */
  avatar?: boolean;
  /** Avatar size */
  avatarSize?: number;
  /** Number of text lines */
  lines?: number;
  /** Show right-side content */
  showRight?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Pre-built list item skeleton
 */
export function SkeletonListItem({
  avatar = true,
  avatarSize = 44,
  lines = 2,
  showRight = false,
  style,
}: SkeletonListItemProps) {
  return (
    <View
      className="flex-row items-center py-3 px-4"
      style={[
        { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
        style,
      ]}
    >
      {avatar && <SkeletonCircle size={avatarSize} className="mr-3" />}
      <View className="flex-1">
        <SkeletonText
          lines={lines}
          lineWidth={lines === 1 ? "60%" : ["70%", "50%"]}
          lineHeight={lines === 1 ? 16 : 14}
          gap={6}
        />
      </View>
      {showRight && (
        <SkeletonBox width={40} height={14} borderRadius={7} className="ml-2" />
      )}
    </View>
  );
}

interface SkeletonCardProps {
  /** Card width */
  width?: DimensionValue;
  /** Card height */
  height?: number;
  /** Custom style */
  style?: ViewStyle;
}

/**
 * Pre-built card skeleton
 */
export function SkeletonCard({
  width = "100%",
  height = 120,
  style,
}: SkeletonCardProps) {
  return (
    <View
      className="rounded-xl overflow-hidden"
      style={[
        {
          width: width as number | "auto",
          height,
          backgroundColor: colors.neutral[50],
          borderWidth: 1,
          borderColor: colors.neutral[100],
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton namespace export for cleaner imports
 */
export const Skeleton = {
  Box: SkeletonBox,
  Circle: SkeletonCircle,
  Text: SkeletonText,
  ListItem: SkeletonListItem,
  Card: SkeletonCard,
};
