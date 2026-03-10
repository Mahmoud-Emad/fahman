/**
 * Modal/Dialog component - Overlay dialog for important content
 * Slides up from bottom with dark backdrop fade
 *
 * Uses absolute-positioned overlay instead of RNModal to avoid
 * mount/unmount lifecycle issues that cause close-animation glitches.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Pressable,
  type ViewStyle,
  ScrollView,
  Dimensions,
  Animated,
  BackHandler,
  Platform,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/utils/cn";
import { Text } from "./Text";
import { Button } from "./Button";
import { colors, withOpacity } from "@/themes";
import { MODAL_SIZES } from "@/constants";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Props for the Modal component
 */
export interface ModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Children content */
  children: React.ReactNode;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Additional class names for backdrop */
  backdropClassName?: string;
  /** Additional class names for container */
  containerClassName?: string;
  /** Additional class names for content */
  className?: string;
  /** Custom width */
  width?: number | string;
  /** Custom height */
  height?: number | string;
  /** Custom max height as percentage (0-100) */
  maxHeight?: number | string;
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
 * Modal component for overlay dialogs
 * Renders as an absolute-positioned overlay within the parent screen.
 */
export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  backdropClassName,
  containerClassName,
  className,
  width,
  height,
  maxHeight = `${MODAL_SIZES.DEFAULT_HEIGHT * 100}%`,
  bgColor = "bg-surface",
  borderRadius,
  border,
  padding = "p-6",
  margin,
  shadow = "shadow-xl",
  style,
}: ModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // rendered = overlay is in the tree; visible = prop from parent
  const [rendered, setRendered] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Calculate max height
  const calculatedMaxHeight =
    typeof maxHeight === "string" && maxHeight.endsWith("%")
      ? (parseFloat(maxHeight) / 100) * SCREEN_HEIGHT
      : typeof maxHeight === "number"
        ? maxHeight
        : SCREEN_HEIGHT * MODAL_SIZES.DEFAULT_HEIGHT;

  // Open: mount overlay, then animate in
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      setRendered(true);
      // Start animation on the next frame so the overlay is mounted first
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            damping: 20,
            stiffness: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (rendered) {
      // Close: animate out, then unmount overlay
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setRendered(false);
      });
    }
  }, [visible]);

  // Android back button
  useEffect(() => {
    if (!rendered || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onCloseRef.current();
      return true;
    });
    return () => sub.remove();
  }, [rendered]);

  const handleClose = () => {
    onCloseRef.current();
  };

  if (!rendered) return null;

  return (
    <View style={overlayStyles.root} pointerEvents="box-none">
      {/* Animated Backdrop */}
      <Animated.View
        style={[overlayStyles.backdrop, { opacity: fadeAnim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeOnBackdrop ? handleClose : undefined}
        />
      </Animated.View>

      {/* Bottom-aligned container for the sheet */}
      <View style={overlayStyles.sheetContainer} pointerEvents="box-none">
        <Animated.View
          className={cn(bgColor, shadow, className)}
          style={[
            {
              maxHeight: calculatedMaxHeight,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY: slideAnim }],
            },
            width !== undefined && { width: typeof width === "number" ? width : undefined },
            height !== undefined && { height: typeof height === "number" ? height : undefined },
            style,
          ]}
        >
          {/* Drag Handle */}
          <View className="items-center pt-3 pb-2">
            <View
              className="w-10 h-1 rounded-full"
              style={{ backgroundColor: colors.neutral[300] }}
            />
          </View>

          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between px-6 pb-4">
              {title && (
                <Text variant="h3" className="flex-1 font-bold">
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <Pressable
                  onPress={handleClose}
                  className="w-8 h-8 rounded-full items-center justify-center active:bg-surface-secondary -mr-1"
                >
                  <Text variant="body" color="muted" className="font-bold">
                    ✕
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView
            className="px-6"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withOpacity(colors.black, 0.5),
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});

/**
 * Dialog component - Specialized modal for confirmations and alerts
 */
export interface DialogProps extends Omit<ModalProps, "children"> {
  /** Dialog description/message */
  message?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button callback */
  onConfirm?: () => void;
  /** Cancel button callback (defaults to onClose) */
  onCancel?: () => void;
  /** Confirm button variant */
  confirmVariant?: "primary" | "danger";
  /** Children content (optional, overrides message) */
  children?: React.ReactNode;
}

export function Dialog({
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "primary",
  children,
  ...props
}: DialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      props.onClose();
    }
  };

  return (
    <Modal showCloseButton={false} closeOnBackdrop={false} maxHeight="50%" {...props}>
      {children || (message && <Text className="mb-4">{message}</Text>)}
      <View className="flex-row justify-end gap-3 mt-4">
        <Button variant="ghost" onPress={handleCancel}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onPress={onConfirm}>
          {confirmText}
        </Button>
      </View>
    </Modal>
  );
}
