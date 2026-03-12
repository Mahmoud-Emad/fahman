/**
 * AvatarAlbumSection - Collection album cards and empty states for AvatarSelectionModal
 */
import React, { useEffect, useRef } from "react";
import { View, Pressable, Image, Animated } from "react-native";
import { Text, Icon, type IconName } from "@/components/ui";
import { type AvatarAlbum } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { AvatarGridItem } from "./AvatarGrid";

/**
 * Empty state for tabs with no content
 */
export function AvatarEmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center py-16 px-8">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
      >
        <Icon name={icon} size="xl" color={colors.primary[500]} />
      </View>
      <Text variant="body" className="font-semibold text-center mb-1">
        {title}
      </Text>
      <Text variant="body-sm" color="muted" className="text-center">
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          delayPressIn={0}
          className="mt-4 px-5 py-2.5 rounded-full"
          style={{ backgroundColor: colors.primary[500] }}
        >
          <Text variant="body-sm" className="font-semibold" style={{ color: colors.white }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Expandable album card for owned (collection) albums
 */
export function CollectionAlbumCard({
  album,
  isExpanded,
  onToggle,
  onSelectAvatar,
  selectedUrl,
  currentAvatar,
}: {
  album: AvatarAlbum;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectAvatar: (url: string) => void;
  selectedUrl?: string | null;
  currentAvatar?: string | null;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      damping: 15,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View className="mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.white }}>
      <Pressable onPress={onToggle} delayPressIn={0} className="flex-row items-center p-4">
        {/* Album preview stack */}
        <View className="w-14 h-14 mr-3">
          <View
            className="absolute top-0 left-1 w-11 h-11 rounded-xl"
            style={{ backgroundColor: colors.neutral[200] }}
          />
          <View
            className="absolute top-0.5 left-0.5 w-12 h-12 rounded-xl overflow-hidden"
            style={{ borderWidth: 2, borderColor: colors.white }}
          >
            {album.previewUrl ? (
              <Image
                source={{ uri: album.previewUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
                <Icon name="images" size="md" color={colors.neutral[400]} />
              </View>
            )}
          </View>
        </View>

        <View className="flex-1">
          <Text variant="body" className="font-semibold" numberOfLines={1}>
            {album.displayName}
          </Text>
          <View className="flex-row items-center mt-1">
            <View
              className="flex-row items-center px-2 py-0.5 rounded-full"
              style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
            >
              <Icon name="checkmark-circle" customSize={10} color={colors.success} />
              <Text variant="caption" className="ml-1 font-medium" style={{ color: colors.success }}>
                {album.itemCount} avatars
              </Text>
            </View>
          </View>
        </View>

        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon name="chevron-down" size="sm" color={colors.neutral[400]} />
        </Animated.View>
      </Pressable>

      {isExpanded && (
        <View className="px-2 pb-3 pt-1 border-t" style={{ borderTopColor: colors.neutral[100] }}>
          <View className="flex-row flex-wrap">
            {album.avatars.map((avatar) => (
              <AvatarGridItem
                key={avatar.id}
                url={avatar.url}
                isSelected={selectedUrl === avatar.url}
                isCurrent={currentAvatar === avatar.url}
                onPress={() => onSelectAvatar(avatar.url)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

