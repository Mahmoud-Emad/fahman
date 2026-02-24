/**
 * SegmentedControl - Tab-style segmented control component
 */
import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Pressable } from "./Pressable";
import { colors } from "@/themes";

export interface Segment {
  /** Unique identifier for the segment */
  id: string;
  /** Display label */
  label: string;
  /** Optional count badge */
  count?: number;
  /** Custom active color (defaults to primary) */
  activeColor?: string;
}

export interface SegmentedControlProps {
  /** Array of segments */
  segments: Segment[];
  /** Currently active segment ID */
  activeSegment: string;
  /** Callback when segment is selected */
  onChange: (segmentId: string) => void;
  /** Visual variant */
  variant?: "filled" | "outlined";
  /** Size variant */
  size?: "sm" | "md";
  /** Custom container class names */
  className?: string;
}

/**
 * SegmentedControl component - Tab-style switcher
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   segments={[
 *     { id: 'all', label: 'All', count: friends.length },
 *     { id: 'online', label: 'Online', count: onlineCount, activeColor: colors.success },
 *   ]}
 *   activeSegment={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */
export function SegmentedControl({
  segments,
  activeSegment,
  onChange,
  variant = "filled",
  size = "md",
  className = "",
}: SegmentedControlProps) {
  const paddingY = size === "sm" ? "py-1.5" : "py-2";

  return (
    <View className={`flex-row ${className}`}>
      {segments.map((segment, index) => {
        const isActive = segment.id === activeSegment;
        const activeColor = segment.activeColor ?? colors.primary[500];
        const isLast = index === segments.length - 1;

        const getBackgroundColor = () => {
          if (isActive) {
            return activeColor;
          }
          return variant === "filled" ? colors.neutral[100] : "transparent";
        };

        const getBorderStyle = () => {
          if (variant === "outlined") {
            return {
              borderWidth: 1,
              borderColor: isActive ? activeColor : colors.neutral[300],
            };
          }
          return {};
        };

        const getTextColor = () => {
          if (isActive) {
            return colors.white;
          }
          return colors.neutral[600];
        };

        return (
          <Pressable
            key={segment.id}
            onPress={() => onChange(segment.id)}
            delayPressIn={0}
            className={`flex-1 ${paddingY} rounded-lg ${!isLast ? "mr-2" : ""} active:opacity-80`}
            style={[
              { backgroundColor: getBackgroundColor() },
              getBorderStyle(),
            ]}
          >
            <Text
              variant={size === "sm" ? "caption" : "body-sm"}
              center
              className="font-medium"
              style={{ color: getTextColor() }}
            >
              {segment.label}
              {segment.count !== undefined && ` (${segment.count})`}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
