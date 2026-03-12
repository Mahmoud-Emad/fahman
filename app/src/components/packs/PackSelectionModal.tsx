/**
 * PackSelectionModal - Modal for selecting a pack before hosting a room
 * Shows sections: Suggested, Your Packs, Popular, Free Packs, Paid Packs
 */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Modal as RNModal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Button, Icon, Dialog } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { getErrorMessage } from "@/utils/errorUtils";
import { MODAL_SIZES } from "@/constants";
import { PackSection } from "./PackSection";
import type { PackData } from "./types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PackSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onNext: (pack: PackData) => void;
  onCreatePack: () => void;
  suggestedPacks?: PackData[];
  ownedPacks?: PackData[];
  popularPacks?: PackData[];
  freeStorePacks?: PackData[];
  paidStorePacks?: PackData[];
  isLoading?: boolean;
  /** User's current coin balance */
  userCoins?: number;
  /** Called after a successful pack purchase — parent should refresh user data */
  onPackPurchased?: (packId: string, newBalance: number) => void;
  /** Called when user needs more coins */
  onBuyCoins?: () => void;
}

/**
 * Pack selection modal for host room flow
 */
export function PackSelectionModal({
  visible,
  onClose,
  onNext,
  onCreatePack,
  suggestedPacks = [],
  ownedPacks = [],
  popularPacks = [],
  freeStorePacks = [],
  paidStorePacks = [],
  isLoading = false,
  userCoins = 0,
  onPackPurchased,
  onBuyCoins,
}: PackSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedPack, setSelectedPack] = useState<PackData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [purchaseDialogPack, setPurchaseDialogPack] = useState<PackData | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showLoading = !isReady || isLoading;

  useEffect(() => {
    if (visible) {
      setSelectedPack(null);
      setPurchaseDialogPack(null);
      setIsReady(false);
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
      ]).start(() => {
        setIsReady(true);
      });
    } else {
      setIsReady(false);
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
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
      onClose();
    });
  };

  const handleSelectPack = (pack: PackData) => {
    setSelectedPack(pack);
  };

  const handleNext = () => {
    if (!selectedPack) return;

    // If it's a paid pack the user doesn't own, show purchase dialog
    if (selectedPack.price && selectedPack.price > 0 && !selectedPack.isOwned) {
      setPurchaseDialogPack(selectedPack);
      return;
    }

    handleClose();
    setTimeout(() => {
      onNext(selectedPack);
    }, 300);
  };

  const handlePurchaseConfirm = async () => {
    if (!purchaseDialogPack) return;

    const price = purchaseDialogPack.price || 0;
    if (userCoins < price) {
      setPurchaseDialogPack(null);
      onBuyCoins?.();
      return;
    }

    setIsPurchasing(true);
    try {
      const { storeService } = await import("@/services/storeService");
      const response = await storeService.purchasePack(purchaseDialogPack.id);

      if (response.success && response.data) {
        onPackPurchased?.(purchaseDialogPack.id, response.data.newBalance);
        // Mark as owned and proceed
        const ownedPack = { ...purchaseDialogPack, isOwned: true, price: 0 };
        setPurchaseDialogPack(null);
        handleClose();
        setTimeout(() => {
          onNext(ownedPack);
        }, 300);
      }
    } catch (error) {
      setPurchaseDialogPack(null);
      // Re-throw for toast handling by parent
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCreatePack = () => {
    handleClose();
    setTimeout(() => {
      onCreatePack();
    }, 300);
  };

  const canAfford = purchaseDialogPack ? userCoins >= (purchaseDialogPack.price || 0) : false;

  return (
    <>
      <RNModal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View className="flex-1 justify-end" pointerEvents="box-none">
          <Animated.View
            pointerEvents="auto"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: withOpacity(colors.black, 0.5),
              opacity: fadeAnim,
            }}
          >
            <Pressable className="flex-1" onPress={handleClose} />
          </Animated.View>

          <Animated.View
            className="bg-surface shadow-xl"
            pointerEvents="auto"
            style={{
              maxHeight: SCREEN_HEIGHT * MODAL_SIZES.DEFAULT_HEIGHT,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Drag Handle */}
            <View className="items-center pt-3 pb-2">
              <View
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: colors.neutral[300] }}
              />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text variant="h3" className="flex-1 font-bold">
                Select a Pack
              </Text>
              <Pressable
                onPress={handleClose}
                className="w-8 h-8 rounded-full items-center justify-center active:bg-surface-secondary -mr-1"
              >
                <Text variant="body" color="muted" className="font-bold">
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* Sections */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {(suggestedPacks.length > 0 || showLoading) && (
                <PackSection
                  type="suggested"
                  title="Suggested For You"
                  packs={suggestedPacks}
                  selectedPackId={selectedPack?.id}
                  onSelectPack={handleSelectPack}
                  isLoading={showLoading}
                />
              )}

              <PackSection
                type="owned"
                title="Your Packs"
                packs={ownedPacks}
                selectedPackId={selectedPack?.id}
                onSelectPack={handleSelectPack}
                showCreateButton={!showLoading}
                onCreatePress={handleCreatePack}
                isLoading={showLoading}
              />

              {(popularPacks.length > 0 || showLoading) && (
                <PackSection
                  type="popular"
                  title="Most Popular"
                  packs={popularPacks}
                  selectedPackId={selectedPack?.id}
                  onSelectPack={handleSelectPack}
                  isLoading={showLoading}
                />
              )}

              {(freeStorePacks.length > 0 || showLoading) && (
                <PackSection
                  type="store"
                  title="Free Packs"
                  packs={freeStorePacks}
                  selectedPackId={selectedPack?.id}
                  onSelectPack={handleSelectPack}
                  isLoading={showLoading}
                />
              )}

              {(paidStorePacks.length > 0 || showLoading) && (
                <PackSection
                  type="store"
                  title="Premium Packs"
                  packs={paidStorePacks}
                  selectedPackId={selectedPack?.id}
                  onSelectPack={handleSelectPack}
                  isLoading={showLoading}
                  showPrices
                />
              )}
            </ScrollView>

            {/* Bottom Action */}
            <View
              className="px-6 pt-4 border-t"
              style={{
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 16,
              }}
            >
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!selectedPack}
                onPress={handleNext}
              >
                {selectedPack && selectedPack.price && selectedPack.price > 0 && !selectedPack.isOwned
                  ? `Get Pack (${selectedPack.price} coins) & Next`
                  : selectedPack
                    ? "Next"
                    : "Select a Pack"}
              </Button>
            </View>
          </Animated.View>
        </View>
      </RNModal>

      {/* Purchase Confirmation Dialog */}
      <Dialog
        visible={!!purchaseDialogPack}
        onClose={() => setPurchaseDialogPack(null)}
        title="Purchase Pack"
        confirmText={canAfford ? (isPurchasing ? "Purchasing..." : `Buy for ${purchaseDialogPack?.price} coins`) : "Get Coins"}
        cancelText="Cancel"
        onConfirm={canAfford ? handlePurchaseConfirm : () => { setPurchaseDialogPack(null); onBuyCoins?.(); }}
        confirmVariant="primary"
      >
        {purchaseDialogPack && (
          <View>
            <View className="items-center mb-4">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
              >
                <Icon name="gift" size="xl" color={colors.primary[500]} />
              </View>
              <Text variant="h4" className="font-bold text-center">
                {purchaseDialogPack.title}
              </Text>
              <Text variant="body-sm" color="muted" className="text-center mt-1">
                {purchaseDialogPack.questionsCount} questions
              </Text>
            </View>

            <View
              className="flex-row items-center justify-between p-3 rounded-xl"
              style={{ backgroundColor: colors.neutral[50] }}
            >
              <Text variant="body-sm" color="secondary">Price</Text>
              <View className="flex-row items-center">
                <Icon name="diamond" customSize={16} color={colors.gold} />
                <Text variant="body" className="font-bold ml-1">
                  {purchaseDialogPack.price}
                </Text>
              </View>
            </View>

            <View
              className="flex-row items-center justify-between p-3 rounded-xl mt-2"
              style={{ backgroundColor: canAfford ? withOpacity(colors.success, 0.08) : withOpacity(colors.error, 0.08) }}
            >
              <Text variant="body-sm" color="secondary">Your Balance</Text>
              <View className="flex-row items-center">
                <Icon name="diamond" customSize={16} color={canAfford ? colors.success : colors.error} />
                <Text
                  variant="body"
                  className="font-bold ml-1"
                  style={{ color: canAfford ? colors.success : colors.error }}
                >
                  {userCoins}
                </Text>
              </View>
            </View>

            {!canAfford && (
              <Text variant="caption" style={{ color: colors.error }} className="text-center mt-3">
                You need {(purchaseDialogPack.price || 0) - userCoins} more coins
              </Text>
            )}
          </View>
        )}
      </Dialog>
    </>
  );
}
