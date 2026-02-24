/**
 * Badge component - Small status indicator or label
 * Supports full customization via props for colors, dimensions, and styling
 */
import React from "react";
import { View, type ViewStyle } from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "./Text";

/**
 * Badge variant options
 */
export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info";

/**
 * Badge size options
 */
export type BadgeSize = "sm" | "md" | "lg";

/**
 * Props for the Badge component
 */
export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Additional class names */
  className?: string;
  /** Additional class names for text */
  textClassName?: string;
  /** Custom background color class */
  bgColor?: string;
  /** Custom text color class */
  textColor?: string;
  /** Custom border radius class */
  borderRadius?: string;
  /** Custom border class */
  border?: string;
  /** Custom padding class */
  padding?: string;
  /** Custom margin class */
  margin?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Variant to class mapping
 */
const variantClasses: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: "bg-surface-secondary",
    text: "text-text",
  },
  primary: {
    bg: "bg-primary-100",
    text: "text-primary-700",
  },
  secondary: {
    bg: "bg-secondary-100",
    text: "text-secondary-700",
  },
  success: {
    bg: "bg-success-light",
    text: "text-success",
  },
  warning: {
    bg: "bg-warning-light",
    text: "text-warning",
  },
  error: {
    bg: "bg-error-light",
    text: "text-error",
  },
  info: {
    bg: "bg-info-light",
    text: "text-info",
  },
};

/**
 * Size to class mapping
 */
const sizeClasses: Record<BadgeSize, { container: string; text: string }> = {
  sm: {
    container: "px-1.5 py-0.5",
    text: "text-xs",
  },
  md: {
    container: "px-2 py-1",
    text: "text-xs",
  },
  lg: {
    container: "px-2.5 py-1",
    text: "text-sm",
  },
};

/**
 * Badge component for status indicators and labels
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
  textClassName,
  bgColor,
  textColor,
  borderRadius = "rounded-full",
  border,
  padding,
  margin,
  style,
}: BadgeProps) {
  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];

  return (
    <View
      className={cn(
        "self-start",
        borderRadius,
        bgColor || variantStyle.bg,
        padding || sizeStyle.container,
        border,
        margin,
        className
      )}
      style={style}
    >
      <Text
        className={cn(
          "font-medium",
          textColor || variantStyle.text,
          sizeStyle.text,
          textClassName
        )}
      >
        {children}
      </Text>
    </View>
  );
}
