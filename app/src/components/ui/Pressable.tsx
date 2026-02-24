/**
 * Pressable - Typed wrapper around React Native Pressable with NativeWind support
 * Fixes typing issues where NativeWind's className prop conflicts with standard PressableProps
 */
import React from "react";
import {
  Pressable as RNPressable,
  PressableProps as RNPressableProps,
} from "react-native";

export interface PressableProps extends RNPressableProps {
  /** NativeWind className for styling */
  className?: string;
}

/**
 * Pressable component with full TypeScript support for both
 * standard React Native props and NativeWind className
 *
 * @example
 * ```tsx
 * <Pressable
 *   onPress={handlePress}
 *   delayPressIn={0}
 *   className="p-4 rounded-xl active:opacity-70"
 * >
 *   <Text>Press me</Text>
 * </Pressable>
 * ```
 */
export const Pressable = React.forwardRef<
  React.ElementRef<typeof RNPressable>,
  PressableProps
>(({ className, ...props }, ref) => {
  return <RNPressable ref={ref} className={className} {...props} />;
});

Pressable.displayName = "Pressable";
