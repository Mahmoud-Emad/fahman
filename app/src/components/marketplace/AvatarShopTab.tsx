/**
 * AvatarShopTab - Avatar store section for MarketplaceModal
 * Contains SectionHeader (shared), avatar grid items, album cards, and the tab component
 */
import React, { useState } from "react";
import { View, Pressable, ScrollView, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, Icon } from "@/components/ui";
import {
  storeService,
  type StoreData,
  type AvatarAlbum,
  type StoreItem,
} from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { Dimensions } from "react-native";
import { AvatarPreviewModal } from "./AvatarPreviewModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_GRID_SIZE = (SCREEN_WIDTH - 64) / 4;
const ALBUM_CARD_WIDTH = SCREEN_WIDTH * 0.7;

// ============================================================================
// SECTION HEADER (shared with SoundShopTab)
// ============================================================================

export function SectionHeader({
  icon,
  title,
  badge,
  badgeColor = "primary",
  action,
  onActionPress,
}: {
  icon: string;
  title: string;
  badge?: string;
  badgeColor?: "primary" | "success" | "gold";
  action?: string;
  onActionPress?: () => void;
}) {
  const badgeStyles = {
    primary: { bg: withOpacity(colors.primary[500], 0.1), text: colors.primary[500] },
    success: { bg: withOpacity(colors.success, 0.1), text: colors.success },
    gold: { bg: withOpacity(colors.gold, 0.15), text: colors.gold },
  };

  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center flex-1">
        <View className="w-8 h-8 rounded-lg items-center justify-center mr-2" style={{ backgroundColor: badgeStyles[badgeColor].bg }}>
          <Icon name={icon as any} size="sm" color={badgeStyles[badgeColor].text} />
        </View>
        <Text variant="body" className="font-bold" numberOfLines={1}>{title}</Text>
        {badge && (
          <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: badgeStyles[badgeColor].bg }}>
            <Text variant="caption" style={{ color: badgeStyles[badgeColor].text }}>{badge}</Text>
          </View>
        )}
      </View>
      {action && onActionPress && (
        <Pressable onPress={onActionPress} delayPressIn={0}>
          <Text variant="caption" className="font-semibold" style={{ color: colors.primary[500] }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ============================================================================
// AVATAR ITEM
// ============================================================================

function AvatarItem({ avatar, size = "normal", isEquipped, isOwned, onPress }: {
  avatar: StoreItem;
  size?: "small" | "normal" | "large";
  isEquipped?: boolean;
  isOwned?: boolean;
  onPress: () => void;
}) {
  const dimensions = { small: 56, normal: AVATAR_GRID_SIZE - 8, large: 80 };
  const itemSize = dimensions[size];

  return (
    <Pressable onPress={onPress} delayPressIn={0} className="relative" style={{ margin: 4 }}>
      <View className="rounded-full overflow-hidden" style={{ width: itemSize, height: itemSize, borderWidth: isEquipped ? 3 : 2, borderColor: isEquipped ? colors.primary[500] : isOwned ? colors.success : colors.neutral[200], backgroundColor: colors.neutral[100] }}>
        <Image source={{ uri: avatar.url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      </View>
      {isEquipped && (
        <View className="absolute -bottom-1 left-1/2 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: colors.primary[500], transform: [{ translateX: -20 }] }}>
          <Text variant="caption" style={{ color: colors.white, fontSize: 9 }}>Equipped</Text>
        </View>
      )}
      {isOwned && !isEquipped && (
        <View className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: colors.success }}>
          <Icon name="checkmark" customSize={10} color={colors.white} />
        </View>
      )}
    </Pressable>
  );
}

// ============================================================================
// ALBUM CARD (HORIZONTAL SCROLL)
// ============================================================================

function AlbumCardHorizontal({ album, userCoins, onPreview, onPurchase, onBuyCoins }: {
  album: AvatarAlbum;
  userCoins: number;
  onPreview: (avatar: StoreItem) => void;
  onPurchase: () => void;
  onBuyCoins: () => void;
}) {
  const canAfford = userCoins >= album.price;
  const previewAvatars = album.avatars.slice(0, 4);

  return (
    <View className="mr-3 rounded-2xl overflow-hidden" style={{ width: ALBUM_CARD_WIDTH, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}>
      <LinearGradient colors={[colors.primary[500], colors.primary[600]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <Text variant="body" className="font-bold" style={{ color: colors.white }} numberOfLines={1}>{album.displayName}</Text>
            <Text variant="caption" style={{ color: withOpacity(colors.white, 0.8) }}>{album.itemCount} avatars</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: withOpacity(colors.white, 0.2) }}>
            <View className="flex-row items-center">
              <Icon name="diamond" customSize={14} color={colors.white} />
              <Text variant="body-sm" className="ml-1 font-bold" style={{ color: colors.white }}>{album.price}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View className="flex-row justify-center py-3 px-2">
        {previewAvatars.map((avatar) => (
          <Pressable key={avatar.id} onPress={() => onPreview(avatar)} delayPressIn={0} className="mx-1">
            <View className="rounded-full overflow-hidden" style={{ width: 48, height: 48, borderWidth: 2, borderColor: colors.primary[200], backgroundColor: colors.neutral[100] }}>
              <Image source={{ uri: avatar.url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            </View>
          </Pressable>
        ))}
        {album.avatars.length > 4 && (
          <View className="w-12 h-12 rounded-full items-center justify-center mx-1" style={{ backgroundColor: colors.neutral[100] }}>
            <Text variant="caption" className="font-semibold" color="muted">+{album.avatars.length - 4}</Text>
          </View>
        )}
      </View>

      <View className="px-3 pb-3">
        <Pressable onPress={canAfford ? onPurchase : onBuyCoins} delayPressIn={0} className="py-2.5 rounded-xl items-center" style={{ backgroundColor: canAfford ? colors.primary[500] : colors.neutral[100] }}>
          <View className="flex-row items-center">
            <Icon name={canAfford ? "cart" : "diamond"} customSize={16} color={canAfford ? colors.white : colors.gold} />
            <Text variant="body-sm" className="ml-1.5 font-semibold" style={{ color: canAfford ? colors.white : colors.gold }}>
              {canAfford ? "Unlock Album" : `Need ${album.price - userCoins} more coins`}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ============================================================================
// OWNED ALBUM CARD
// ============================================================================

function OwnedAlbumCard({ album, currentAvatarUrl, onAvatarPress }: {
  album: AvatarAlbum;
  currentAvatarUrl?: string | null;
  onAvatarPress: (avatar: StoreItem) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View className="mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.white, borderWidth: 2, borderColor: colors.success }}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} delayPressIn={0} className="flex-row items-center p-3">
        <View className="w-12 h-12 rounded-xl overflow-hidden" style={{ borderWidth: 2, borderColor: colors.success }}>
          {album.previewUrl ? (
            <Image source={{ uri: album.previewUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center bg-neutral-100">
              <Icon name="images-outline" size="md" color={colors.neutral[300]} />
            </View>
          )}
        </View>
        <View className="flex-1 ml-3">
          <Text variant="body" className="font-semibold" numberOfLines={1}>{album.displayName}</Text>
          <View className="flex-row items-center mt-0.5">
            <Icon name="checkmark-circle" customSize={12} color={colors.success} />
            <Text variant="caption" className="ml-1" style={{ color: colors.success }}>{album.itemCount} avatars owned</Text>
          </View>
        </View>
        <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size="sm" color={colors.neutral[400]} />
      </Pressable>
      {isExpanded && (
        <View className="px-3 pb-3">
          <View className="flex-row flex-wrap">
            {album.avatars.map((avatar) => (
              <AvatarItem key={avatar.id} avatar={avatar} size="small" isEquipped={avatar.url === currentAvatarUrl} isOwned onPress={() => onAvatarPress(avatar)} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// CURRENT AVATAR CARD
// ============================================================================

function CurrentAvatarCard({ avatarUrl, userName }: { avatarUrl?: string | null; userName: string }) {
  if (!avatarUrl) return null;
  return (
    <View className="mb-5">
      <SectionHeader icon="person-circle" title="Your Profile" badgeColor="primary" />
      <View className="rounded-2xl p-4" style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}>
        <View className="flex-row items-center">
          <View className="rounded-full overflow-hidden" style={{ width: 56, height: 56, borderWidth: 3, borderColor: colors.primary[500], backgroundColor: colors.neutral[100] }}>
            <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
          <View className="flex-1 ml-3">
            <Text variant="body" className="font-semibold">{userName}</Text>
            <View className="flex-row items-center mt-1">
              <View className="flex-row items-center px-2 py-0.5 rounded-full" style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}>
                <Icon name="checkmark-circle" customSize={10} color={colors.primary[500]} />
                <Text variant="caption" className="ml-1 font-medium" style={{ color: colors.primary[500] }}>Current Avatar</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// AVATARS TAB
// ============================================================================

interface AvatarsTabProps {
  data: StoreData["avatars"] | null;
  isLoading: boolean;
  currentAvatarUrl?: string | null;
  userName: string;
  userCoins: number;
  onAvatarPress: (avatar: StoreItem) => void;
  onAlbumPurchase: (album: AvatarAlbum) => void;
  onBuyCoins: () => void;
}

export function AvatarsTab({ data, isLoading, currentAvatarUrl, userName, userCoins, onAvatarPress, onAlbumPurchase, onBuyCoins }: AvatarsTabProps) {
  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text variant="body-sm" color="muted" className="mt-3">Loading store...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <CurrentAvatarCard avatarUrl={currentAvatarUrl} userName={userName} />

      {data.ownedAlbums && data.ownedAlbums.length > 0 && (
        <View className="mb-6">
          <SectionHeader icon="checkmark-circle" title="My Collection" badge={`${data.ownedAlbums.length} albums`} badgeColor="success" />
          {data.ownedAlbums.map((album) => (
            <OwnedAlbumCard key={album.id} album={album} currentAvatarUrl={currentAvatarUrl} onAvatarPress={onAvatarPress} />
          ))}
        </View>
      )}

      {data.free.length > 0 && (
        <View className="mb-6">
          <SectionHeader icon="gift" title="Free Avatars" badge="Free" badgeColor="success" />
          <View className="rounded-2xl p-3" style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row flex-wrap justify-center">
              {data.free.map((avatar) => (
                <AvatarItem key={avatar.id} avatar={avatar} isEquipped={avatar.url === currentAvatarUrl} onPress={() => onAvatarPress(avatar)} />
              ))}
            </View>
          </View>
        </View>
      )}

      {data.albums.length > 0 && (
        <View className="mb-6">
          <SectionHeader icon="albums" title="Premium Albums" badgeColor="gold" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {data.albums.map((album) => (
              <AlbumCardHorizontal key={album.id} album={album} userCoins={userCoins} onPreview={onAvatarPress} onPurchase={() => onAlbumPurchase(album)} onBuyCoins={onBuyCoins} />
            ))}
          </ScrollView>
        </View>
      )}

      {data.free.length === 0 && data.albums.length === 0 && !data.ownedAlbums?.length && (
        <View className="items-center py-12">
          <Icon name="albums-outline" size="xl" color={colors.neutral[300]} />
          <Text variant="body" color="muted" className="mt-3">No avatars available yet</Text>
        </View>
      )}
    </ScrollView>
  );
}
