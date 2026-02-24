/**
 * Card component - Container for grouping related content
 * Supports full customization via props for colors, dimensions, and styling
 */
import React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { cn } from "@/utils/cn";

/**
 * Card variant options
 */
export type CardVariant = "elevated" | "outlined" | "filled";

/**
 * Props for the Card component
 */
export interface CardProps extends Omit<ViewProps, "style"> {
  /** Card variant */
  variant?: CardVariant;
  /** Children content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Custom width */
  width?: number | string;
  /** Custom height */
  height?: number | string;
  /** Custom background color class */
  bgColor?: string;
  /** Custom border radius class */
  borderRadius?: string;
  /** Custom border class */
  border?: string;
  /** Custom padding class */
  padding?: string;
  /** Custom margin class */
  margin?: string;
  /** Custom shadow class */
  shadow?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Variant to class mapping
 */
const variantClasses: Record<CardVariant, string> = {
  elevated: "bg-surface shadow-md",
  outlined: "bg-surface border border-border",
  filled: "bg-surface-secondary",
};

/**
 * Card component for grouping related content
 */
export function Card({
  variant = "elevated",
  children,
  className,
  width,
  height,
  bgColor,
  borderRadius = "rounded-lg",
  border,
  padding = "p-4",
  margin,
  shadow,
  style,
  ...props
}: CardProps) {
  return (
    <View
      className={cn(
        borderRadius,
        padding,
        bgColor || variantClasses[variant],
        border,
        margin,
        shadow,
        className
      )}
      style={[
        width !== undefined && { width: typeof width === "number" ? width : undefined },
        height !== undefined && { height: typeof height === "number" ? height : undefined },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * Card Header component
 */
export interface CardHeaderProps extends Omit<ViewProps, "style"> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function CardHeader({ children, className, style, ...props }: CardHeaderProps) {
  return (
    <View className={cn("mb-3", className)} style={style} {...props}>
      {children}
    </View>
  );
}

/**
 * Card Content component
 */
export interface CardContentProps extends Omit<ViewProps, "style"> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function CardContent({ children, className, style, ...props }: CardContentProps) {
  return (
    <View className={cn(className)} style={style} {...props}>
      {children}
    </View>
  );
}

/**
 * Card Footer component
 */
export interface CardFooterProps extends Omit<ViewProps, "style"> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export function CardFooter({ children, className, style, ...props }: CardFooterProps) {
  return (
    <View className={cn("mt-3 flex-row", className)} style={style} {...props}>
      {children}
    </View>
  );
}
