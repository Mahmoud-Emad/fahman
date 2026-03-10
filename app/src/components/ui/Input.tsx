/**
 * Input component - Text input field with label and error support
 * Supports full customization via props for colors, dimensions, and styling
 */
import React, { useState } from "react";
import {
  View,
  TextInput,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { cn } from "@/utils/cn";
import { colors } from "@/themes";
import { Text } from "./Text";

/**
 * Input variant options
 */
export type InputVariant = "outlined" | "filled" | "underlined";

/**
 * Input size options
 */
export type InputSize = "sm" | "md" | "lg";

/**
 * Props for the Input component
 */
export interface InputProps extends Omit<TextInputProps, "style"> {
  /** Input variant */
  variant?: InputVariant;
  /** Input size */
  size?: InputSize;
  /** Label text */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Additional class names for container */
  containerClassName?: string;
  /** Additional class names for input */
  className?: string;
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
  /** Custom style object for container */
  containerStyle?: ViewStyle;
  /** Custom style object for input */
  style?: TextStyle;
}

/**
 * Variant to class mapping
 */
const variantClasses: Record<InputVariant, { container: string; focused: string }> = {
  outlined: {
    container: "border border-border bg-transparent",
    focused: "border-border-focus",
  },
  filled: {
    container: "border-0 bg-surface-secondary",
    focused: "bg-surface",
  },
  underlined: {
    container: "border-b border-border bg-transparent rounded-none",
    focused: "border-border-focus",
  },
};

/**
 * Size to class mapping
 */
const sizeClasses: Record<InputSize, { container: string; text: string }> = {
  sm: {
    container: "px-3 py-2",
    text: "text-sm",
  },
  md: {
    container: "px-4 py-3",
    text: "text-base",
  },
  lg: {
    container: "px-4 py-4",
    text: "text-lg",
  },
};

/**
 * Input component with label and error support
 */
export function Input({
  variant = "outlined",
  size = "md",
  label,
  error,
  helperText,
  disabled = false,
  leftIcon,
  rightIcon,
  containerClassName,
  className,
  width,
  height,
  bgColor,
  textColor,
  borderRadius = "rounded-lg",
  border,
  padding,
  margin,
  shadow,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];

  return (
    <View
      className={cn(margin, containerClassName)}
      style={[
        width !== undefined && { width: typeof width === "number" ? width : undefined },
        containerStyle,
      ]}
    >
      {label && (
        <Text variant="label" className="mb-1.5" color={error ? "error" : "secondary"}>
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center",
          variant !== "underlined" && borderRadius,
          bgColor || variantStyle.container,
          padding || sizeStyle.container,
          border,
          shadow,
          isFocused && variantStyle.focused,
          error && "border-error",
          disabled && "opacity-50"
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          className={cn(
            "flex-1",
            textColor || "text-text",
            sizeStyle.text,
            className
          )}
          placeholderTextColor={colors.text.muted}
          editable={!disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            height !== undefined && { height: typeof height === "number" ? height : undefined },
            style,
          ]}
          {...props}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text
          variant="caption"
          color={error ? "error" : "muted"}
          className="mt-1"
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
