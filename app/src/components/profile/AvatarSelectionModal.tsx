/**
 * AvatarSelectionModal - Modal for selecting or purchasing avatar
 * Features: live preview, collection/free/shop tabs, purchase flow
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Modal as RNModal,
  Pressable,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon } from "@/components/ui";
import { storeService, type StoreItem, type AvatarAlbum } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { getErrorMessage } from "@/utils/errorUtils";
import { UI_TIMING } from "@/constants";
import { useToast } from "@/contexts";
import { AvatarGridItem } from "./AvatarGrid";
import { CollectionAlbumCard, AvatarEmptyState } from "./AvatarAlbumSection";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PREVIEW_SIZE = 100;

interface AvatarSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string | null;
  onOpenShop?: () => void;
}

type TabType = "collection" | "free";

/**
 * Avatar selection modal with preview, tabs, and purchase flow
 */
export function AvatarSelectionModal({
  visible,
  onClose,
  onSelect,
  currentAvatar,
  onOpenShop,
}: AvatarSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("collection");
  const [freeAvatars, setFreeAvatars] = useState<StoreItem[]>([]);
  const [ownedAlbums, setOwnedAlbums] = useState<AvatarAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentAvatar || null);
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedUrl(currentAvatar || null);
      setExpandedAlbumId(null);
      loadData();

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible, currentAvatar]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await storeService.getStoreData();

      if (response.success && response.data) {
        const { avatars } = response.data;
        setFreeAvatars(avatars.free || []);
        const owned = avatars.ownedAlbums || [];
        setOwnedAlbums(owned);
        if (owned.length === 0) setActiveTab("free");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleConfirm = () => {
    if (selectedUrl && selectedUrl !== currentAvatar) {
      handleClose();
      setTimeout(() => onSelect(selectedUrl), UI_TIMING.MODAL_TRANSITION_DELAY);
    }
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "collection", label: "My Collection", count: ownedAlbums.length },
    { id: "free", label: "Free", count: freeAvatars.length },
  ];

  const hasSelection = selectedUrl && selectedUrl !== currentAvatar;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: withOpacity(colors.black, 0.6),
            opacity: fadeAnim,
          }}
        >
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Modal Sheet */}
        <Animated.View
          pointerEvents="auto"
          style={{
            height: SCREEN_HEIGHT * 0.85,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            transform: [{ translateY: slideAnim }],
            backgroundColor: colors.neutral[50],
          }}
        >
          {/* Drag Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
          </View>

          {/* Header with preview */}
          <View className="px-5 pb-4">
            <View className="flex-row items-center">
              <View className="mr-4">
                <View
                  className="rounded-2xl overflow-hidden"
                  style={{
                    width: PREVIEW_SIZE,
                    height: PREVIEW_SIZE,
                    borderWidth: 3,
                    borderColor: hasSelection ? colors.primary[500] : colors.neutral[200],
                    backgroundColor: colors.neutral[100],
                  }}
                >
                  {selectedUrl ? (
                    <Image
                      source={{ uri: selectedUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Icon name="person" size="xl" color={colors.neutral[300]} />
                    </View>
                  )}
                </View>
                {hasSelection && (
                  <View
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary[500] }}
                  >
                    <Icon name="create-outline" customSize={14} color={colors.white} />
                  </View>
                )}
              </View>

              <View className="flex-1">
                <Text variant="h3" className="font-bold mb-1">Choose Avatar</Text>
                <Text variant="body-sm" color="muted">
                  {hasSelection ? "Tap confirm to save" : "Select an avatar below"}
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                delayPressIn={0}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.neutral[100] }}
              >
                <Icon name="close" size="sm" color={colors.neutral[500]} />
              </Pressable>
            </View>
          </View>

          {/* Tabs */}
          <View className="px-5 mb-3">
            <View className="flex-row p-1 rounded-xl" style={{ backgroundColor: colors.neutral[200] }}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  delayPressIn={0}
                  className="flex-1 py-2.5 rounded-lg items-center"
                  style={{ backgroundColor: activeTab === tab.id ? colors.white : "transparent" }}
                >
                  <Text
                    variant="body-sm"
                    className={activeTab === tab.id ? "font-semibold" : ""}
                    style={{ color: activeTab === tab.id ? colors.primary[500] : colors.neutral[500] }}
                  >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <Text
                        variant="caption"
                        style={{ color: activeTab === tab.id ? colors.primary[400] : colors.neutral[400] }}
                      >
                        {" "}({tab.count})
                      </Text>
                    )}
                  </Text>
                </Pressable>
              ))}
              {/* Shop button — opens the store dialog */}
              <Pressable
                onPress={onOpenShop}
                delayPressIn={0}
                className="flex-1 py-2.5 rounded-lg items-center"
              >
                <View className="flex-row items-center">
                  <Icon name="cart-outline" customSize={14} color={colors.primary[500]} />
                  <Text
                    variant="body-sm"
                    className="ml-1"
                    style={{ color: colors.primary[500] }}
                  >
                    Shop
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Tab Content */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          >
            {isLoading ? (
              <View className="flex-1 items-center justify-center py-16">
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text variant="body-sm" color="muted" className="mt-3">Loading avatars...</Text>
              </View>
            ) : activeTab === "collection" ? (
              ownedAlbums.length > 0 ? (
                ownedAlbums.map((album) => (
                  <CollectionAlbumCard
                    key={album.id}
                    album={album}
                    isExpanded={expandedAlbumId === album.id}
                    onToggle={() => setExpandedAlbumId(expandedAlbumId === album.id ? null : album.id)}
                    onSelectAvatar={setSelectedUrl}
                    selectedUrl={selectedUrl}
                    currentAvatar={currentAvatar}
                  />
                ))
              ) : (
                <AvatarEmptyState
                  icon="albums-outline"
                  title="No Albums Yet"
                  subtitle="Purchase avatar albums from the shop to build your collection"
                  actionLabel="Browse Shop"
                  onAction={onOpenShop}
                />
              )
            ) : activeTab === "free" ? (
              freeAvatars.length > 0 ? (
                <View className="rounded-2xl p-2" style={{ backgroundColor: colors.white }}>
                  <View className="flex-row flex-wrap">
                    {freeAvatars.map((avatar) => (
                      <AvatarGridItem
                        key={avatar.id}
                        url={avatar.url}
                        isSelected={selectedUrl === avatar.url}
                        isCurrent={currentAvatar === avatar.url}
                        onPress={() => setSelectedUrl(avatar.url)}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <AvatarEmptyState
                  icon="gift-outline"
                  title="No Free Avatars"
                  subtitle="Check back later for free avatar drops"
                />
              )
            ) : null}
          </ScrollView>

          {/* Confirm Button */}
          <View
            className="px-5 pt-3 border-t"
            style={{
              borderTopColor: colors.neutral[200],
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.white,
            }}
          >
            <Pressable
              onPress={handleConfirm}
              disabled={!hasSelection}
              delayPressIn={0}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: hasSelection ? colors.primary[500] : colors.neutral[200] }}
            >
              <View className="flex-row items-center">
                {hasSelection && (
                  <Icon name="checkmark-circle" customSize={20} color={colors.white} />
                )}
                <Text
                  variant="body"
                  className={`font-semibold ${hasSelection ? "ml-2" : ""}`}
                  style={{ color: hasSelection ? colors.white : colors.neutral[400] }}
                >
                  {hasSelection ? "Confirm Selection" : "Select an Avatar"}
                </Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}
