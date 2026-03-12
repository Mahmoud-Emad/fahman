/**
 * PackCardList - Horizontal scrolling list of pack cards
 */
import React from "react";
import { ScrollView, View } from "react-native";
import { PackCard, CreatePackCard } from "./PackCard";
import type { PackData } from "./types";

interface PackCardListProps {
  /** List of packs to display */
  packs: PackData[];
  /** Currently selected pack ID */
  selectedPackId?: string;
  /** Callback when a pack is selected */
  onSelectPack: (pack: PackData) => void;
  /** Show create new pack button */
  showCreateButton?: boolean;
  /** Callback when create button is pressed */
  onCreatePress?: () => void;
  /** Card size variant */
  size?: "sm" | "md";
  /** Show price badges on cards */
  showPrices?: boolean;
}

/**
 * Horizontal scrolling pack card list
 */
export function PackCardList({
  packs,
  selectedPackId,
  onSelectPack,
  showCreateButton = false,
  onCreatePress,
  size = "md",
  showPrices = false,
}: PackCardListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      {packs.map((pack) => (
        <PackCard
          key={pack.id}
          pack={pack}
          isSelected={pack.id === selectedPackId}
          onPress={onSelectPack}
          size={size}
          showPrice={showPrices}
        />
      ))}
      {showCreateButton && onCreatePress && (
        <CreatePackCard onPress={onCreatePress} size={size} />
      )}
      {/* Empty space at the end for better scroll UX */}
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}
