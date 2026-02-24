/**
 * AvatarAlbumSection - Collection, Shop album cards and empty states for AvatarSelectionModal
 */
import React, { useEffect, useRef } from "react";
import { View, Pressable, Image, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, Icon } from "@/components/ui";
import { type AvatarAlbum } from "@/services/avatarService";
import { type AvatarAlbum as StoreAlbum } from "@/services/storeService";
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
  icon: string;
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
        <Icon name={icon as any} size="xl" color={colors.primary[500]} />
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
  album: StoreAlbum;
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

/**
 * Shop album card with gradient header and purchase button
 */
export function ShopAlbumCard({
  album,
  onPurchase,
  onBuyCoins,
  userCoins,
}: {
  album: AvatarAlbum;
  onPurchase: () => void;
  onBuyCoins: () => void;
  userCoins: number;
}) {
  const canAfford = userCoins >= album.price;
  const previewAvatars = album.avatars.slice(0, 3);

  return (
    <View className="mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.white }}>
      <LinearGradient
        colors={[colors.primary[400], colors.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-4"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text variant="body" className="font-bold" style={{ color: colors.white }} numberOfLines={1}>
              {album.displayName}
            </Text>
            <Text variant="caption" style={{ color: withOpacity(colors.white, 0.8) }}>
              {album.avatarCount} avatars
            </Text>
          </View>
          <View
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: withOpacity(colors.white, 0.2) }}
          >
            <Icon name="diamond" customSize={14} color={colors.white} />
            <Text variant="body-sm" className="ml-1 font-bold" style={{ color: colors.white }}>
              {album.price}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row justify-center py-4 px-3">
        {previewAvatars.map((avatar) => (
          <View
            key={avatar.id}
            className="rounded-xl overflow-hidden mx-1"
            style={{
              width: 56,
              height: 56,
              opacity: 0.7,
              borderWidth: 2,
              borderColor: colors.neutral[200],
            }}
          >
            {avatar.url ? (
              <Image
                source={{ uri: avatar.url }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
                <Icon name="person" size="md" color={colors.neutral[400]} />
              </View>
            )}
          </View>
        ))}
        {album.avatars.length > 3 && (
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mx-1"
            style={{ backgroundColor: colors.neutral[100] }}
          >
            <Text variant="body-sm" className="font-bold" color="muted">
              +{album.avatars.length - 3}
            </Text>
          </View>
        )}
      </View>

      <View className="px-4 pb-4">
        <Pressable
          onPress={canAfford ? onPurchase : onBuyCoins}
          delayPressIn={0}
          className="py-3 rounded-xl items-center"
          style={{ backgroundColor: canAfford ? colors.primary[500] : colors.neutral[100] }}
        >
          <View className="flex-row items-center">
            <Icon
              name={canAfford ? "cart" : "diamond"}
              customSize={16}
              color={canAfford ? colors.white : colors.gold}
            />
            <Text
              variant="body-sm"
              className="ml-2 font-semibold"
              style={{ color: canAfford ? colors.white : colors.gold }}
            >
              {canAfford ? "Unlock Album" : `Need ${album.price - userCoins} more coins`}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}
