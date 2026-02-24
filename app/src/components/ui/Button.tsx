/**
 * Button component - Versatile button with multiple variants and sizes
 * Supports full customization via props for colors, dimensions, and styling
 */
import React from "react";
import {
  Pressable,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { cn } from "@/utils/cn";
import { colors } from "@/themes";
import { Text } from "./Text";

/**
 * Button variant options
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

/**
 * Button size options
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the Button component
 */
export interface ButtonProps extends Omit<PressableProps, "style"> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Button label text */
  children: React.ReactNode;
  /** Additional class names for the button container */
  className?: string;
  /** Additional class names for the text */
  textClassName?: string;
  /** Custom width */
  width?: number | string;
  /** Custom height */
  height?: number | string;
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
  /** Custom shadow class */
  shadow?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Variant to class mapping
 */
const variantClasses: Record<ButtonVariant, { container: string; text: string }> = {
  primary: {
    container: "bg-primary-500 active:bg-primary-600",
    text: "text-text-inverse",
  },
  secondary: {
    container: "bg-secondary-500 active:bg-secondary-600",
    text: "text-text-inverse",
  },
  outline: {
    container: "bg-transparent border-2 border-primary-500 active:bg-primary-50",
    text: "text-primary-500",
  },
  ghost: {
    container: "bg-transparent active:bg-surface-secondary",
    text: "text-text",
  },
  danger: {
    container: "bg-error active:bg-error/80",
    text: "text-text-inverse",
  },
};

/**
 * Size to class mapping
 */
const sizeClasses: Record<ButtonSize, { container: string; text: string }> = {
  sm: {
    container: "px-3 py-1.5",
    text: "text-sm",
  },
  md: {
    container: "px-4 py-2.5",
    text: "text-base",
  },
  lg: {
    container: "px-6 py-3.5",
    text: "text-lg",
  },
};

/**
 * Button component with multiple variants and full customization
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  className,
  textClassName,
  width,
  height,
  bgColor,
  textColor,
  borderRadius = "rounded-lg",
  border,
  padding,
  margin,
  shadow,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];

  return (
    <Pressable
      disabled={isDisabled}
      className={cn(
        "items-center justify-center flex-row",
        borderRadius,
        bgColor || variantStyle.container,
        padding || sizeStyle.container,
        border,
        margin,
        shadow,
        fullWidth && "w-full",
        isDisabled && "opacity-50",
        className
      )}
      style={[
        width !== undefined && { width: typeof width === "number" ? width : undefined },
        height !== undefined && { height: typeof height === "number" ? height : undefined },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" || variant === "ghost" ? colors.primary[500] : colors.white}
          size="small"
        />
      ) : (
        <Text
          numberOfLines={1}
          className={cn(
            "font-semibold",
            textColor || variantStyle.text,
            sizeStyle.text,
            textClassName
          )}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
