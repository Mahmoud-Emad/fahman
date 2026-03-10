/**
 * PackShopTab - Pack store section for MarketplaceModal
 * Shows purchasable question packs with preview questions and cover images
 */
import React, { useState } from "react";
import {
  View,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal as RNModal,
  Animated,
} from "react-native";
import { Text, Icon, Button } from "@/components/ui";
import { type StorePackPreview, type StorePackQuestion } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { SectionHeader } from "./AvatarShopTab";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
          >
            <Icon name="diamond" customSize={12} color={colors.gold} />
            <Text
              variant="caption"
              className="ml-1 font-semibold"
              style={{ color: colors.gold }}
            >
              {pack.price}
            </Text>
          </View>
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
// PREVIEW QUESTION ITEM
// ============================================================================

function PreviewQuestionItem({
  question,
  index,
}: {
  question: StorePackQuestion;
  index: number;
}) {
  return (
    <View
      className="flex-row items-center p-3 mb-2 rounded-xl"
      style={{
        backgroundColor: colors.neutral[50],
        borderWidth: 1,
        borderColor: colors.neutral[200],
      }}
    >
      {question.coverUrl ? (
        <Image
          source={{ uri: question.coverUrl }}
          style={{ width: 44, height: 44, borderRadius: 10 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            backgroundColor: withOpacity(colors.primary[500], 0.1),
          }}
        >
          <Text variant="body" className="font-bold" style={{ color: colors.primary[500] }}>
            {index + 1}
          </Text>
        </View>
      )}
      <Text variant="body-sm" className="flex-1 ml-3" numberOfLines={2}>
        {question.question}
      </Text>
    </View>
  );
}

// ============================================================================
// PACK PREVIEW MODAL
// ============================================================================

interface PackPreviewModalProps {
  visible: boolean;
  pack: StorePackPreview | null;
  userCoins: number;
  onClose: () => void;
  onPurchase: () => void;
  onBuyCoins: () => void;
}

export function PackPreviewModal({
  visible,
  pack,
  userCoins,
  onClose,
  onPurchase,
  onBuyCoins,
}: PackPreviewModalProps) {
  if (!pack) return null;

  const canAfford = userCoins >= pack.price;
  const remainingCount = pack.numberOfQuestions - pack.previewQuestions.length;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="flex-1"
          onPress={onClose}
          style={{ backgroundColor: withOpacity(colors.black, 0.5) }}
        />

        <View
          className="bg-white rounded-t-3xl"
          style={{ maxHeight: "80%" }}
        >
          {/* Header with cover */}
          {pack.coverUrl ? (
            <Image
              source={{ uri: pack.coverUrl }}
              style={{
                width: "100%",
                height: 160,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              className="items-center justify-center rounded-t-3xl"
              style={{
                width: "100%",
                height: 100,
                backgroundColor: withOpacity(colors.primary[500], 0.1),
              }}
            >
              <Icon name="albums" size="xl" color={colors.primary[500]} />
            </View>
          )}

          <ScrollView
            className="px-5"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Pack Info */}
            <View className="py-4">
              <Text variant="h3" className="font-bold">
                {pack.name}
              </Text>
              <Text variant="body-sm" color="secondary" className="mt-1">
                {pack.description}
              </Text>

              {pack.textHint ? (
                <View
                  className="flex-row items-center mt-3 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: withOpacity(colors.primary[500], 0.08) }}
                >
                  <Icon name="bulb-outline" customSize={16} color={colors.primary[500]} />
                  <Text
                    variant="caption"
                    className="ml-2 flex-1"
                    style={{ color: colors.primary[500] }}
                  >
                    Hint: {pack.textHint}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center mt-3">
                <Text variant="caption" color="muted">
                  {pack.numberOfQuestions} questions
                </Text>
                <Text variant="caption" color="muted" className="mx-1.5">
                  •
                </Text>
                <Text variant="caption" color="muted">
                  by {pack.author}
                </Text>
              </View>
            </View>

            {/* Preview Questions */}
            <Text variant="body" className="font-semibold mb-3">
              Preview ({pack.previewQuestions.length} of {pack.numberOfQuestions})
            </Text>

            {pack.previewQuestions.map((q, i) => (
              <PreviewQuestionItem key={q.number} question={q} index={i} />
            ))}

            {remainingCount > 0 && (
              <View
                className="items-center py-3 rounded-xl"
                style={{
                  backgroundColor: colors.neutral[50],
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.neutral[300],
                }}
              >
                <Icon name="lock-closed" size="sm" color={colors.neutral[400]} />
                <Text variant="caption" color="muted" className="mt-1">
                  +{remainingCount} more questions after purchase
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Purchase Footer */}
          <View
            className="flex-row items-center px-5 py-4 border-t"
            style={{ borderTopColor: colors.neutral[100] }}
          >
            <View className="flex-1 mr-3">
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full self-start"
                style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
              >
                <Icon name="diamond" customSize={16} color={colors.gold} />
                <Text
                  variant="body"
                  className="ml-1.5 font-bold"
                  style={{ color: colors.gold }}
                >
                  {pack.price} coins
                </Text>
              </View>
            </View>

            <Button variant="outline" size="sm" onPress={onClose} className="mr-2">
              Close
            </Button>

            <Pressable
              onPress={canAfford ? onPurchase : onBuyCoins}
              delayPressIn={0}
              className="px-5 py-2.5 rounded-xl"
              style={{ backgroundColor: colors.primary[500] }}
            >
              <View className="flex-row items-center">
                <Icon
                  name={canAfford ? "cart" : "diamond"}
                  customSize={16}
                  color={colors.white}
                />
                <Text
                  variant="body-sm"
                  className="ml-1.5 font-semibold"
                  style={{ color: colors.white }}
                >
                  {canAfford ? "Buy Pack" : `Get ${pack.price - userCoins} Coins`}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>
    </RNModal>
  );
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
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader
        icon="albums"
        title="Question Packs"
        badge={`${data.length} available`}
        badgeColor="primary"
      />
      {data.map((pack) => (
        <PackCard key={pack.id} pack={pack} onPress={() => onPackPress(pack)} />
      ))}
    </ScrollView>
  );
}
