/**
 * PackSelectionModal - Modal for selecting a pack before hosting a room
 * Shows sections: Suggested, Your Packs, Popular, Buy Packs (coming soon)
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
import { Text, Button } from "@/components/ui";
import { colors } from "@/themes";
import { PackSection } from "./PackSection";
import type { PackData, PackSectionData } from "./types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface PackSelectionModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when user proceeds with selected pack */
  onNext: (pack: PackData) => void;
  /** Callback when user wants to create a new pack */
  onCreatePack: () => void;
  /** Suggested packs for the user */
  suggestedPacks?: PackData[];
  /** User's own packs */
  ownedPacks?: PackData[];
  /** Popular packs */
  popularPacks?: PackData[];
  /** Whether data is loading from API */
  isLoading?: boolean;
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
  isLoading = false,
}: PackSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedPack, setSelectedPack] = useState<PackData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Combined loading state: animation not ready OR data still loading
  const showLoading = !isReady || isLoading;

  // Reset selection when modal opens and track ready state
  useEffect(() => {
    if (visible) {
      setSelectedPack(null);
      setIsReady(false);
      // Animate in
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
        // Modal is ready for interaction after animation completes
        setIsReady(true);
      });
    } else {
      // Reset for next open
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
    if (selectedPack) {
      handleClose();
      // Small delay for animation
      setTimeout(() => {
        onNext(selectedPack);
      }, 300);
    }
  };

  const handleCreatePack = () => {
    handleClose();
    setTimeout(() => {
      onCreatePack();
    }, 300);
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" pointerEvents="box-none">
        {/* Animated Backdrop - pointer events only on self, not children */}
        <Animated.View
          pointerEvents="auto"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: fadeAnim,
          }}
        >
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Animated Modal Content */}
        <Animated.View
          className="bg-surface shadow-xl"
          pointerEvents="auto"
          style={{
            maxHeight: SCREEN_HEIGHT * 0.85,
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

          {/* Sections - Scrollable */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Suggested For You */}
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

            {/* Your Packs */}
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

            {/* Most Popular */}
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

            {/* Buy Packs - Coming Soon */}
            <PackSection
              type="store"
              title="Buy Packs"
              packs={[]}
              selectedPackId={undefined}
              onSelectPack={() => {}}
              isComingSoon
            />
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
              {selectedPack ? "Next" : "Select a Pack"}
            </Button>
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}
