/**
 * BuyCoinsModal - Modal for purchasing coin packages
 * Coin Plans:
 * - 50 coins → 50 EGP
 * - 150 coins → 100 EGP
 * - 500 coins → 250 EGP
 */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Pressable,
  Animated,
  Dimensions,
  Modal as RNModal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  currency: string;
  popular?: boolean;
  bestValue?: boolean;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: "pack_50", coins: 50, price: 50, currency: "EGP" },
  { id: "pack_150", coins: 150, price: 100, currency: "EGP", popular: true },
  { id: "pack_500", coins: 500, price: 250, currency: "EGP", bestValue: true },
];

interface BuyCoinsModalProps {
  visible: boolean;
  onClose: () => void;
  currentCoins: number;
  onPurchase?: (packageId: string) => void;
}

/**
 * Coin package card
 */
function CoinPackageCard({
  pkg,
  isSelected,
  onSelect,
}: {
  pkg: CoinPackage;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const coinsPerEGP = (pkg.coins / pkg.price).toFixed(1);

  return (
    <Pressable
      onPress={onSelect}
      delayPressIn={0}
      className="mb-3 rounded-2xl overflow-hidden"
      style={{
        borderWidth: 2,
        borderColor: isSelected ? colors.primary[500] : colors.border,
        backgroundColor: isSelected
          ? withOpacity(colors.primary[500], 0.05)
          : colors.white,
      }}
    >
      {/* Badge */}
      {(pkg.popular || pkg.bestValue) && (
        <View
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl"
          style={{
            backgroundColor: pkg.bestValue ? colors.success : colors.primary[500],
          }}
        >
          <Text variant="caption" style={{ color: colors.white }}>
            {pkg.bestValue ? "Best Value" : "Popular"}
          </Text>
        </View>
      )}

      <View className="flex-row items-center p-4">
        {/* Coin icon and amount */}
        <View className="flex-row items-center flex-1">
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
          >
            <Icon name="diamond" size="lg" color={colors.gold} />
          </View>
          <View>
            <Text variant="h3" className="font-bold" style={{ color: colors.gold }}>
              {pkg.coins}
            </Text>
            <Text variant="caption" color="muted">
              {coinsPerEGP} coins/EGP
            </Text>
          </View>
        </View>

        {/* Price */}
        <View className="items-end">
          <Text variant="h3" className="font-bold">
            {pkg.price}
          </Text>
          <Text variant="caption" color="muted">
            {pkg.currency}
          </Text>
        </View>

        {/* Selection indicator */}
        <View
          className="ml-3 w-6 h-6 rounded-full items-center justify-center"
          style={{
            borderWidth: 2,
            borderColor: isSelected ? colors.primary[500] : colors.neutral[300],
            backgroundColor: isSelected ? colors.primary[500] : "transparent",
          }}
        >
          {isSelected && (
            <Icon name="checkmark" customSize={14} color={colors.white} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * BuyCoinsModal component
 */
export function BuyCoinsModal({
  visible,
  onClose,
  currentCoins,
  onPurchase,
}: BuyCoinsModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedPackage, setSelectedPackage] = useState<string>("pack_150");
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

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

  const handlePurchase = async () => {
    if (!onPurchase) return;

    setIsPurchasing(true);
    await onPurchase(selectedPackage);
    setIsPurchasing(false);
  };

  const selectedPkg = COIN_PACKAGES.find((p) => p.id === selectedPackage);

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

        {/* Modal Content */}
        <Animated.View
          className="bg-surface-secondary"
          pointerEvents="auto"
          style={{
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
          <View className="items-center px-6 pb-4">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
            >
              <Icon name="diamond" customSize={40} color={colors.gold} />
            </View>
            <Text variant="h2" className="font-bold">
              Get More Coins
            </Text>
            <Text variant="body" color="muted" className="text-center mt-1">
              Unlock avatars, sounds, and more!
            </Text>

            {/* Current balance */}
            <View
              className="flex-row items-center mt-3 px-4 py-2 rounded-full"
              style={{ backgroundColor: withOpacity(colors.gold, 0.1) }}
            >
              <Icon name="diamond" size="sm" color={colors.gold} />
              <Text
                variant="body-sm"
                className="ml-2 font-semibold"
                style={{ color: colors.gold }}
              >
                Current Balance: {currentCoins} coins
              </Text>
            </View>
          </View>

          {/* Packages */}
          <View className="px-6 pb-4">
            {COIN_PACKAGES.map((pkg) => (
              <CoinPackageCard
                key={pkg.id}
                pkg={pkg}
                isSelected={selectedPackage === pkg.id}
                onSelect={() => setSelectedPackage(pkg.id)}
              />
            ))}
          </View>

          {/* Purchase Button */}
          <View
            className="px-6 pt-2 border-t"
            style={{
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 16,
            }}
          >
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={isPurchasing}
              onPress={handlePurchase}
            >
              <View className="flex-row items-center">
                {isPurchasing ? (
                  <Text variant="body" style={{ color: colors.white }}>
                    Processing...
                  </Text>
                ) : (
                  <>
                    <Icon name="cart" customSize={20} color={colors.white} />
                    <Text
                      variant="body"
                      className="ml-2 font-semibold"
                      style={{ color: colors.white }}
                    >
                      Buy {selectedPkg?.coins} Coins for {selectedPkg?.price} EGP
                    </Text>
                  </>
                )}
              </View>
            </Button>

            <Text variant="caption" color="muted" className="text-center mt-3">
              Payment will be processed securely
            </Text>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}
