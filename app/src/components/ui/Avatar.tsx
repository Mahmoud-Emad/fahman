/**
 * Avatar component - User profile image or initials display
 * Supports full customization via props for colors, dimensions, and styling
 */
import React, { useState } from "react";
import { View, Image, type ViewStyle, type ImageStyle, type ImageSourcePropType } from "react-native";
import { cn } from "@/utils/cn";
import { Text } from "./Text";
import { transformUrl } from "@/utils/transformUrl";

/**
 * Avatar size options
 */
export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Props for the Avatar component
 */
export interface AvatarProps {
  /** Image source */
  source?: ImageSourcePropType;
  /** Image URI string (alternative to source) */
  uri?: string;
  /** Fallback initials (displayed when no image) */
  initials?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Additional class names */
  className?: string;
  /** Custom width (overrides size) */
  width?: number;
  /** Custom height (overrides size) */
  height?: number;
  /** Custom background color class */
  bgColor?: string;
  /** Custom text color class for initials */
  textColor?: string;
  /** Custom border radius class */
  borderRadius?: string;
  /** Custom border class */
  border?: string;
  /** Custom margin class */
  margin?: string;
  /** Custom style object */
  style?: ViewStyle;
  /** Callback when image fails to load */
  onError?: () => void;
}

/**
 * Size to dimension mapping
 */
const sizeDimensions: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

/**
 * Size to text size mapping
 */
const sizeTextClasses: Record<AvatarSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
};

/**
 * Avatar component for user profile display
 */
export function Avatar({
  source,
  uri,
  initials,
  size = "md",
  className,
  width,
  height,
  bgColor = "bg-primary-100",
  textColor = "text-primary-700",
  borderRadius = "rounded-full",
  border,
  margin,
  style,
  onError,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const dimension = width || height || sizeDimensions[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
  };

  // Support both source and uri, auto-convert string source to uri format
  // Apply transformUrl to rewrite stale IPs / localhost to current SOCKET_URL
  const imageSource = source
    ? typeof source === "string"
      ? { uri: transformUrl(source) || source }
      : typeof (source as any).uri === "string"
        ? { uri: transformUrl((source as any).uri) || (source as any).uri }
        : source
    : uri
      ? { uri: transformUrl(uri) || uri }
      : undefined;

  if (imageSource && !imageError) {
    const imageStyle: ImageStyle = {
      width: dimension,
      height: dimension,
    };
    return (
      <Image
        source={imageSource}
        className={cn(borderRadius, border, margin, className)}
        style={[imageStyle, style as ImageStyle]}
        onError={() => {
          setImageError(true);
          onError?.();
        }}
      />
    );
  }

  return (
    <View
      className={cn(
        "items-center justify-center",
        borderRadius,
        bgColor,
        border,
        margin,
        className
      )}
      style={[containerStyle, style]}
    >
      <Text className={cn("font-semibold", textColor, sizeTextClasses[size])}>
        {initials?.substring(0, 2).toUpperCase() || "?"}
      </Text>
    </View>
  );
}

/**
 * Avatar Group component - Display multiple avatars stacked
 */
export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: AvatarProps[];
  /** Maximum avatars to show */
  max?: number;
  /** Avatar size */
  size?: AvatarSize;
  /** Additional class names */
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const overlap = sizeDimensions[size] / 3;

  return (
    <View className={cn("flex-row", className)}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{ marginLeft: index > 0 ? -overlap : 0, zIndex: visibleAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} border="border-2 border-background" />
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={{ marginLeft: -overlap }}>
          <Avatar
            size={size}
            initials={`+${remainingCount}`}
            bgColor="bg-surface-secondary"
            textColor="text-text-secondary"
            border="border-2 border-background"
          />
        </View>
      )}
    </View>
  );
}
