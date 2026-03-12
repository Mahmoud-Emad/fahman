/**
 * PackSection - Section with header and horizontal pack list
 */
import React from "react";
import { View, ScrollView } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { PackCardList } from "./PackCardList";
import { PackCardSkeleton } from "./PackCardSkeleton";
import type { PackData, PackSectionType } from "./types";

interface PackSectionProps {
  /** Section type for styling */
  type: PackSectionType;
  /** Section title */
  title: string;
  /** List of packs */
  packs: PackData[];
  /** Currently selected pack ID */
  selectedPackId?: string;
  /** Callback when a pack is selected */
  onSelectPack: (pack: PackData) => void;
  /** Show create button (for "Your Packs" section) */
  showCreateButton?: boolean;
  /** Callback for create button */
  onCreatePress?: () => void;
  /** Show "Coming Soon" placeholder */
  isComingSoon?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Show price badges on pack cards */
  showPrices?: boolean;
}

/**
 * Get icon for section type
 */
const getSectionIcon = (type: PackSectionType): string => {
  switch (type) {
    case "suggested":
      return "flash";
    case "owned":
      return "person";
    case "popular":
      return "people";
    case "store":
      return "gift";
    default:
      return "grid";
  }
};

/**
 * Pack section with header and card list
 */
export function PackSection({
  type,
  title,
  packs,
  selectedPackId,
  onSelectPack,
  showCreateButton = false,
  onCreatePress,
  isComingSoon = false,
  isLoading = false,
  showPrices = false,
}: PackSectionProps) {
  return (
    <View className="mb-4">
      {/* Section header */}
      <View className="flex-row items-center px-4 mb-1">
        <View
          className="w-6 h-6 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Icon
            name={getSectionIcon(type) as any}
            customSize={14}
            color={colors.primary[500]}
          />
        </View>
        <Text variant="body" className="font-semibold flex-1" numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Loading skeletons */}
      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {[1, 2, 3].map((i) => (
            <PackCardSkeleton key={i} />
          ))}
        </ScrollView>
      ) : isComingSoon ? (
        /* Coming soon placeholder */
        <View
          className="mx-4 my-2 py-8 rounded-xl items-center justify-center"
          style={{
            backgroundColor: withOpacity(colors.neutral[400], 0.1),
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
          }}
        >
          <Icon name="storefront" size="lg" color={colors.neutral[400]} />
          <Text
            variant="body"
            className="mt-2 font-medium"
            style={{ color: colors.text.muted }}
          >
            Coming Soon
          </Text>
        </View>
      ) : packs.length === 0 && !showCreateButton ? (
        /* Empty state */
        <View className="mx-4 my-2 py-6 items-center">
          <Text variant="body-sm" color="muted">
            No packs available
          </Text>
        </View>
      ) : (
        /* Pack list */
        <PackCardList
          packs={packs}
          selectedPackId={selectedPackId}
          onSelectPack={onSelectPack}
          showCreateButton={showCreateButton}
          onCreatePress={onCreatePress}
          showPrices={showPrices}
        />
      )}
    </View>
  );
}
