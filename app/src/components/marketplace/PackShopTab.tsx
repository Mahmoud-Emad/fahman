/**
 * PackShopTab - Pack store section for MarketplaceModal
 * Shows purchasable question packs with category tabs (Free, paid categories)
 */
import React, { useState, useMemo } from "react";
import { View, Pressable, ScrollView, Image, ActivityIndicator } from "react-native";
import { Text, Icon } from "@/components/ui";
import { type StorePackPreview } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";

export { PackPreviewModal } from "./PackPreviewModal";

// ============================================================================
// PACK CARD
// ============================================================================

function PackCard({
  pack,
  onPress,
}: {
  pack: StorePackPreview;
  onPress: () => void;
}) {
  const isFree = pack.free;

  return (
    <Pressable
      onPress={onPress}
      delayPressIn={0}
      className="mb-3 rounded-2xl overflow-hidden active:opacity-90"
      style={{
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Cover Image */}
      {pack.coverUrl ? (
        <Image
          source={{ uri: pack.coverUrl }}
          style={{ width: "100%", height: 140 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{
            width: "100%",
            height: 140,
            backgroundColor: withOpacity(colors.primary[500], 0.1),
          }}
        >
          <Icon name="albums" size="xl" color={colors.primary[500]} />
        </View>
      )}

      {/* Info */}
      <View className="p-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text variant="body" className="font-bold flex-1 mr-2" numberOfLines={1}>
            {pack.name}
          </Text>
          {pack.isOwned ? (
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.primary[500], 0.15) }}
            >
              <Icon name="checkmark-circle" customSize={12} color={colors.primary[500]} />
              <Text variant="caption" className="ml-1 font-semibold" style={{ color: colors.primary[500] }}>
                Owned
              </Text>
            </View>
          ) : isFree ? (
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.success, 0.15) }}
            >
              <Text variant="caption" className="font-semibold" style={{ color: colors.success }}>
                Free
              </Text>
            </View>
          ) : (
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
            >
              <Icon name="diamond" customSize={12} color={colors.gold} />
              <Text variant="caption" className="ml-1 font-semibold" style={{ color: colors.gold }}>
                {pack.price}
              </Text>
            </View>
          )}
        </View>

        <Text variant="caption" color="muted" numberOfLines={2} className="mb-2">
          {pack.description}
        </Text>

        <View className="flex-row items-center">
          <Icon name="help-circle-outline" customSize={14} color={colors.neutral[400]} />
          <Text variant="caption" color="muted" className="ml-1">
            {pack.numberOfQuestions} questions
          </Text>
          <Text variant="caption" color="muted" className="mx-1.5">
            •
          </Text>
          <Icon name="person-outline" customSize={14} color={colors.neutral[400]} />
          <Text variant="caption" color="muted" className="ml-1">
            {pack.author}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================================
// CATEGORY TABS
// ============================================================================

interface CategoryTab {
  id: string;
  label: string;
  count: number;
}

// ============================================================================
// PACKS TAB
// ============================================================================

interface PacksTabProps {
  data: StorePackPreview[] | null;
  isLoading: boolean;
  userCoins: number;
  onPackPress: (pack: StorePackPreview) => void;
}

export function PacksTab({
  data,
  isLoading,
  userCoins,
  onPackPress,
}: PacksTabProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  // Build category tabs from pack data
  const { tabs, filteredPacks } = useMemo(() => {
    if (!data || data.length === 0) return { tabs: [], filteredPacks: [] };

    const freePacks = data.filter((p) => p.free);
    const paidPacks = data.filter((p) => !p.free);

    // Collect unique categories from all packs
    const categoryMap = new Map<string, StorePackPreview[]>();
    for (const pack of data) {
      const cat = pack.category || "other";
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(pack);
    }

    const tabList: CategoryTab[] = [
      { id: "all", label: "All", count: data.length },
    ];
    if (freePacks.length > 0) {
      tabList.push({ id: "free", label: "Free", count: freePacks.length });
    }
    if (paidPacks.length > 0) {
      tabList.push({ id: "paid", label: "Premium", count: paidPacks.length });
    }
    // Add individual categories if there are more than one
    for (const [cat, packs] of categoryMap) {
      if (cat && cat !== "other") {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        tabList.push({ id: `cat:${cat}`, label, count: packs.length });
      }
    }

    let filtered: StorePackPreview[];
    if (activeCategory === "all") {
      filtered = data;
    } else if (activeCategory === "free") {
      filtered = freePacks;
    } else if (activeCategory === "paid") {
      filtered = paidPacks;
    } else if (activeCategory.startsWith("cat:")) {
      const cat = activeCategory.slice(4);
      filtered = categoryMap.get(cat) || [];
    } else {
      filtered = data;
    }

    return { tabs: tabList, filteredPacks: filtered };
  }, [data, activeCategory]);

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text variant="body-sm" color="muted" className="mt-3">
          Loading packs...
        </Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Icon name="albums-outline" size="xl" color={colors.neutral[300]} />
        <Text variant="body" color="muted" className="mt-3">
          No packs available yet
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* Category filter pills */}
      {tabs.length > 2 && (
        <View className="flex-row flex-wrap mb-3">
          {tabs.map((tab) => {
            const isActive = tab.id === activeCategory;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveCategory(tab.id)}
                delayPressIn={0}
                className="mr-2 mb-2 rounded-full"
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  backgroundColor: isActive ? colors.primary[500] : colors.neutral[100],
                }}
              >
                <Text
                  variant="caption"
                  className="font-medium"
                  style={{ color: isActive ? colors.white : colors.neutral[600] }}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Pack List */}
      {filteredPacks.map((pack) => (
        <PackCard key={pack.id} pack={pack} onPress={() => onPackPress(pack)} />
      ))}
    </ScrollView>
  );
}
