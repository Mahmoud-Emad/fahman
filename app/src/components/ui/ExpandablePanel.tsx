/**
 * ExpandablePanel component - Collapsible/expandable section
 * Used for grouping related settings or content
 */
import React, { useState, useRef, useEffect } from "react";
import { View, Pressable, Animated } from "react-native";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";
import { colors, withOpacity } from "@/themes";

/**
 * Props for the ExpandablePanel component
 */
export interface ExpandablePanelProps {
  /** Panel title */
  title: string;
  /** Icon to display next to title */
  icon?: IconName;
  /** Icon color */
  iconColor?: string;
  /** Whether the panel is initially expanded */
  initiallyExpanded?: boolean;
  /** Panel content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * ExpandablePanel component
 */
export function ExpandablePanel({
  title,
  icon,
  iconColor = colors.primary[500],
  initiallyExpanded = false,
  children,
  className,
}: ExpandablePanelProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const rotateAnim = useRef(new Animated.Value(initiallyExpanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isExpanded, rotateAnim]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View className={className}>
      {/* Header */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center px-4 py-4 bg-white active:bg-surface-secondary"
        style={{
          borderBottomWidth: isExpanded ? 1 : 0,
          borderBottomColor: withOpacity(colors.neutral[400], 0.3),
        }}
      >
        {icon && (
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: withOpacity(iconColor, 0.1) }}
          >
            <Icon name={icon} color={iconColor} size="md" />
          </View>
        )}
        <Text variant="body" className="flex-1 font-semibold">
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Icon name="chevron-forward" color={colors.neutral[400]} size="sm" />
        </Animated.View>
      </Pressable>

      {/* Content */}
      {isExpanded && (
        <View className="bg-white">
          {children}
        </View>
      )}
    </View>
  );
}
