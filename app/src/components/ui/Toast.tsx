/**
 * Toast/Snackbar component - Temporary notification messages
 * Custom design: white background, colored border, circular icon indicator
 * Supports custom images in place of icons
 */
import React, { useEffect, useRef, useCallback } from "react";
import { View, Animated, Pressable, Image, type ViewStyle, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/utils/cn";
import { colors, withOpacity } from "@/themes";
import { Text } from "./Text";
import { Icon, type IconName } from "./Icon";

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
  /** Custom image source (replaces the icon) */
  image?: ImageSourcePropType;
  /** Custom image URI string (replaces the icon) */
  imageUri?: string;
  /** Additional class names */
  className?: string;
  /** Custom style object */
  style?: ViewStyle;
}

/**
 * Variant visual config
 */
const variantConfig: Record<ToastVariant, {
  borderColor: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  iconName: IconName;
  accentColor: string;
}> = {
  default: {
    borderColor: colors.neutral[200],
    iconBg: withOpacity(colors.neutral[400], 0.1),
    iconBorder: colors.neutral[300],
    iconColor: colors.neutral[500],
    iconName: "information-circle",
    accentColor: colors.neutral[500],
  },
  success: {
    borderColor: withOpacity(colors.success, 0.3),
    iconBg: withOpacity(colors.success, 0.1),
    iconBorder: colors.success,
    iconColor: colors.success,
    iconName: "checkmark",
    accentColor: colors.success,
  },
  warning: {
    borderColor: withOpacity(colors.warning, 0.3),
    iconBg: withOpacity(colors.warning, 0.1),
    iconBorder: colors.warning,
    iconColor: colors.warning,
    iconName: "warning",
    accentColor: colors.warning,
  },
  error: {
    borderColor: withOpacity(colors.error, 0.3),
    iconBg: withOpacity(colors.error, 0.1),
    iconBorder: colors.error,
    iconColor: colors.error,
    iconName: "close",
    accentColor: colors.error,
  },
  info: {
    borderColor: withOpacity(colors.primary[500], 0.3),
    iconBg: withOpacity(colors.primary[500], 0.1),
    iconBorder: colors.primary[500],
    iconColor: colors.primary[500],
    iconName: "information",
    accentColor: colors.primary[500],
  },
};

/**
 * Toast component with custom design
 */
export function Toast({
  visible,
  message,
  variant = "default",
  position = "top",
  duration = 3000,
  onHide,
  actionText,
  onAction,
  image,
  imageUri,
  className,
  style,
}: ToastProps) {
  const insets = useSafeAreaInsets();
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
        Animated.spring(fadeAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          stiffness: 150,
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

  const config = variantConfig[variant];
  const hasCustomImage = !!image || !!imageUri;
  const topOffset = position === "top" ? insets.top + 8 : undefined;
  const bottomOffset = position === "bottom" ? insets.bottom + 8 : undefined;

  return (
    <Animated.View
      className={cn("absolute left-0 right-0 mx-4", className)}
      style={[
        topOffset !== undefined && { top: topOffset },
        bottomOffset !== undefined && { bottom: bottomOffset },
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          zIndex: 9999,
        },
      ]}
    >
      <View
        className="flex-row items-center rounded-2xl"
        style={[
          {
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: config.borderColor,
            paddingHorizontal: 14,
            paddingVertical: 12,
            // Shadow
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          },
          style,
        ]}
      >
        {/* Icon / Image indicator */}
        <View
          className="items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: config.iconBg,
            borderWidth: 1.5,
            borderColor: config.iconBorder,
            marginRight: 12,
          }}
        >
          {hasCustomImage ? (
            <Image
              source={image || { uri: imageUri }}
              style={{ width: 28, height: 28, borderRadius: 14 }}
              resizeMode="cover"
            />
          ) : (
            <Icon
              name={config.iconName}
              customSize={16}
              color={config.iconColor}
            />
          )}
        </View>

        {/* Message */}
        <Text
          variant="body-sm"
          className="flex-1"
          style={{ color: colors.text.primary }}
          numberOfLines={3}
        >
          {message}
        </Text>

        {/* Action button */}
        {actionText && onAction && (
          <Pressable
            onPress={onAction}
            delayPressIn={0}
            className="ml-3 px-3 py-1 rounded-lg active:opacity-70"
            style={{ backgroundColor: withOpacity(config.accentColor, 0.1) }}
          >
            <Text
              variant="caption"
              className="font-semibold"
              style={{ color: config.accentColor }}
            >
              {actionText}
            </Text>
          </Pressable>
        )}

        {/* Dismiss button (only for persistent toasts without action) */}
        {duration === 0 && !actionText && (
          <Pressable
            onPress={hideToast}
            delayPressIn={0}
            className="ml-2 p-1"
          >
            <Icon name="close" customSize={16} color={colors.neutral[400]} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
