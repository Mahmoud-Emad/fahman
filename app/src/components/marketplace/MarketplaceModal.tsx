/**
 * MarketplaceModal - Game Store Style Marketplace
 * Features: Category navigation, equipped items, scalable sections
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Pressable, Animated, Dimensions, Modal as RNModal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, Button } from "@/components/ui";
import { BuyCoinsModal } from "@/components/common";
import { storeService, type StoreData, type AvatarAlbum, type StoreItem, type SoundItem, type StorePackPreview } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { MODAL_SIZES } from "@/constants";
import { useToast } from "@/contexts";
import { AvatarsTab } from "./AvatarShopTab";
import { SoundsTab, SoundPreviewModal } from "./SoundShopTab";
import { PacksTab, PackPreviewModal } from "./PackShopTab";
import { AvatarPreviewModal } from "./AvatarPreviewModal";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type CategoryType = "avatars" | "sounds" | "packs";

interface MarketplaceModalProps {
  visible: boolean;
  onClose: () => void;
  userCoins?: number;
  currentAvatarUrl?: string | null;
  userName?: string;
  onCoinsUpdated?: (newBalance: number) => void;
  onBuyCoins?: () => void;
  onAvatarSelect?: (avatarUrl: string) => void;
}

/**
 * MarketplaceModal component - store shell with tab navigation
 */
export function MarketplaceModal({
  visible,
  onClose,
  userCoins = 0,
  currentAvatarUrl,
  userName = "Player",
  onCoinsUpdated,
  onBuyCoins,
  onAvatarSelect,
}: MarketplaceModalProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState<CategoryType>("avatars");
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localCoins, setLocalCoins] = useState(userCoins);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(currentAvatarUrl);
  const [previewAvatar, setPreviewAvatar] = useState<StoreItem | null>(null);
  const [previewSound, setPreviewSound] = useState<SoundItem | null>(null);
  const [previewPack, setPreviewPack] = useState<StorePackPreview | null>(null);
  const [buyCoinsVisible, setBuyCoinsVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { setLocalCoins(userCoins); }, [userCoins]);
  useEffect(() => { setLocalAvatarUrl(currentAvatarUrl); }, [currentAvatarUrl]);

  const fetchStoreData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await storeService.getStoreData();
      if (response.success && response.data) {
        setStoreData(response.data);
      } else {
        setError(response.message || "Failed to load store");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load store");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchStoreData();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const handleBuyCoins = () => {
    setPreviewSound(null);
    setPreviewAvatar(null);
    setPreviewPack(null);
    if (onBuyCoins) onBuyCoins();
    else setBuyCoinsVisible(true);
  };

  const handleCoinsPurchased = (packageId: string) => {
    const coinsMap: Record<string, number> = { pack_50: 50, pack_150: 150, pack_500: 500 };
    const newBalance = localCoins + (coinsMap[packageId] || 0);
    setLocalCoins(newBalance);
    onCoinsUpdated?.(newBalance);
  };

  const handleAlbumPurchase = async (album: AvatarAlbum) => {
    if (localCoins < album.price) { handleBuyCoins(); return; }
    try {
      const response = await storeService.purchaseAvatarAlbum(album.id);
      if (response.success) {
        const newBalance = localCoins - album.price;
        setLocalCoins(newBalance);
        onCoinsUpdated?.(newBalance);
        fetchStoreData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase album");
    }
  };

  const handleSoundPurchase = async () => {
    if (!previewSound) return;
    if (localCoins < previewSound.price) { handleBuyCoins(); return; }
    try {
      const response = await storeService.purchaseSound(previewSound.id);
      if (response.success) {
        const newBalance = localCoins - previewSound.price;
        setLocalCoins(newBalance);
        onCoinsUpdated?.(newBalance);
        setPreviewSound(null);
        fetchStoreData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase sound");
    }
  };

  const handlePackPurchase = async () => {
    if (!previewPack) return;
    if (localCoins < previewPack.price) { handleBuyCoins(); return; }
    try {
      const response = await storeService.purchasePack(previewPack.id);
      if (response.success) {
        const newBalance = localCoins - previewPack.price;
        setLocalCoins(newBalance);
        onCoinsUpdated?.(newBalance);
        setPreviewPack(null);
        toast.success("Pack purchased!");
        fetchStoreData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to purchase pack");
    }
  };

  const categories: { id: CategoryType; label: string; icon: string }[] = [
    { id: "avatars", label: "Avatars", icon: "person-circle" },
    { id: "sounds", label: "Sounds", icon: "musical-notes" },
    { id: "packs", label: "Packs", icon: "albums" },
  ];

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <View className="flex-1 justify-end" pointerEvents="box-none">
        {/* Backdrop */}
        <Animated.View pointerEvents="auto" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withOpacity(colors.black, 0.5), opacity: fadeAnim }}>
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View className="bg-surface-secondary" pointerEvents="auto" style={{ height: SCREEN_HEIGHT * MODAL_SIZES.DEFAULT_HEIGHT, borderTopLeftRadius: 24, borderTopRightRadius: 24, transform: [{ translateY: slideAnim }] }}>
          {/* Header */}
          <View className="px-5 pt-4 pb-3">
            <View className="items-center mb-3">
              <View className="w-10 h-1 rounded-full" style={{ backgroundColor: colors.neutral[300] }} />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}>
                  <Icon name="storefront" size="md" color={colors.primary[500]} />
                </View>
                <View>
                  <Text variant="h3" className="font-bold">Store</Text>
                  <Text variant="caption" color="muted">Customize your profile</Text>
                </View>
              </View>
              <Pressable onPress={handleBuyCoins} delayPressIn={0} className="flex-row items-center px-3.5 py-2 rounded-full active:opacity-80" style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}>
                <Icon name="diamond" size="sm" color={colors.gold} />
                <Text variant="body" className="mx-1.5 font-bold" style={{ color: colors.gold }}>{localCoins}</Text>
                <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: colors.gold }}>
                  <Icon name="add" customSize={12} color={colors.white} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Category Tabs */}
          <View className="px-5 mb-3">
            <View className="flex-row p-1 rounded-xl" style={{ backgroundColor: colors.neutral[100] }}>
              {categories.map((cat) => (
                <Pressable key={cat.id} onPress={() => setActiveCategory(cat.id)} delayPressIn={0} className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg" style={{ backgroundColor: activeCategory === cat.id ? colors.white : "transparent" }}>
                  <Icon name={cat.icon as any} size="sm" color={activeCategory === cat.id ? colors.primary[500] : colors.neutral[500]} />
                  <Text variant="body-sm" className={`ml-1.5 ${activeCategory === cat.id ? "font-semibold" : ""}`} style={{ color: activeCategory === cat.id ? colors.primary[500] : colors.neutral[500] }}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {error ? (
              <View className="flex-1 items-center justify-center p-4">
                <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: withOpacity(colors.error, 0.1) }}>
                  <Icon name="alert-circle" size="xl" color={colors.error} />
                </View>
                <Text variant="body" className="text-center mb-1">Something went wrong</Text>
                <Text variant="caption" color="muted" className="text-center mb-4">{error}</Text>
                <Button variant="primary" size="sm" onPress={fetchStoreData}>
                  <View className="flex-row items-center">
                    <Icon name="refresh" customSize={16} color={colors.white} />
                    <Text variant="body-sm" className="ml-1.5" style={{ color: colors.white }}>Try Again</Text>
                  </View>
                </Button>
              </View>
            ) : (
              <>
                {activeCategory === "avatars" && (
                  <AvatarsTab
                    data={storeData?.avatars || null}
                    isLoading={isLoading}
                    currentAvatarUrl={localAvatarUrl}
                    userName={userName}
                    userCoins={localCoins}
                    onAvatarPress={setPreviewAvatar}
                    onAlbumPurchase={handleAlbumPurchase}
                    onBuyCoins={handleBuyCoins}
                  />
                )}
                {activeCategory === "sounds" && (
                  <SoundsTab
                    data={storeData?.sounds || null}
                    ownedSounds={storeData?.ownedSounds || null}
                    isLoading={isLoading}
                    onSoundPress={setPreviewSound}
                  />
                )}
                {activeCategory === "packs" && (
                  <PacksTab
                    data={storeData?.packs || null}
                    isLoading={isLoading}
                    userCoins={localCoins}
                    onPackPress={setPreviewPack}
                  />
                )}
              </>
            )}
          </View>

          <View style={{ height: insets.bottom }} />
        </Animated.View>
      </View>

      {/* Preview Modals */}
      <AvatarPreviewModal
        visible={!!previewAvatar}
        avatar={previewAvatar}
        userName={userName}
        currentAvatarUrl={localAvatarUrl}
        isEquipped={previewAvatar?.url === localAvatarUrl}
        onClose={() => setPreviewAvatar(null)}
        onUse={() => {
          if (previewAvatar) {
            setLocalAvatarUrl(previewAvatar.url);
            onAvatarSelect?.(previewAvatar.url);
          }
          setPreviewAvatar(null);
        }}
      />

      <SoundPreviewModal
        visible={!!previewSound}
        sound={previewSound}
        userCoins={localCoins}
        onClose={() => setPreviewSound(null)}
        onPurchase={handleSoundPurchase}
        onBuyCoins={handleBuyCoins}
      />

      <PackPreviewModal
        visible={!!previewPack}
        pack={previewPack}
        userCoins={localCoins}
        onClose={() => setPreviewPack(null)}
        onPurchase={handlePackPurchase}
        onBuyCoins={handleBuyCoins}
      />

      <BuyCoinsModal
        visible={buyCoinsVisible}
        onClose={() => setBuyCoinsVisible(false)}
        currentCoins={localCoins}
        onPurchase={handleCoinsPurchased}
      />
    </RNModal>
  );
}
