/**
 * Toast/Snackbar component - Temporary notification messages
 * Supports full customization via props for colors, dimensions, and styling
 */
import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Animated,
  Pressable,
  type ViewStyle,
} from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "./Text";

/**
 * Toast variant options
 */
export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

/**
 * Toast position options
 */
export type ToastPosition = "top" | "bottom";

/**
 * Props for the Toast component
 */
export interface ToastProps {
  /** Whether the toast is visible */
  visible: boolean;
  /** Toast message */
  message: string;
  /** Toast variant */
  variant?: ToastVariant;
  /** Toast position */
  position?: ToastPosition;
  /** Duration in milliseconds (0 for permanent) */
  duration?: number;
  /** Callback when toast should hide */
  onHide?: () => void;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Additional class names */
  className?: string;
  /** Custom width */
  width?: number | string;
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
const variantClasses: Record<ToastVariant, { bg: string; text: string }> = {
  default: {
    bg: "bg-surface-secondary",
    text: "text-text",
  },
  success: {
    bg: "bg-success",
    text: "text-text-inverse",
  },
  warning: {
    bg: "bg-warning",
    text: "text-text-inverse",
  },
  error: {
    bg: "bg-error",
    text: "text-text-inverse",
  },
  info: {
    bg: "bg-info",
    text: "text-text-inverse",
  },
};

/**
 * Toast component for temporary notifications
 */
export function Toast({
  visible,
  message,
  variant = "default",
  position = "bottom",
  duration = 3000,
  onHide,
  actionText,
  onAction,
  className,
  width,
  bgColor,
  textColor,
  borderRadius = "rounded-lg",
  border,
  padding = "px-4 py-3",
  margin = "mx-4",
  shadow = "shadow-lg",
  style,
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === "top" ? -20 : 20)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: position === "top" ? -20 : 20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.();
    });
  }, [fadeAnim, translateY, position, onHide]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(hideToast, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, duration, fadeAnim, translateY, hideToast]);

  if (!visible) return null;

  const variantStyle = variantClasses[variant];

  return (
    <Animated.View
      className={cn(
        "absolute left-0 right-0",
        position === "top" ? "top-12" : "bottom-12",
        margin
      )}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <View
        className={cn(
          "flex-row items-center justify-between",
          borderRadius,
          bgColor || variantStyle.bg,
          padding,
          border,
          shadow,
          className
        )}
        style={[
          width !== undefined && { width: typeof width === "number" ? width : undefined },
          style,
        ]}
      >
        <Text className={cn("flex-1", textColor || variantStyle.text)}>
          {message}
        </Text>
        {actionText && onAction && (
          <Pressable onPress={onAction} className="ml-3">
            <Text className={cn("font-semibold", textColor || variantStyle.text)}>
              {actionText}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
