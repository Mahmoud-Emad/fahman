/**
 * PackPreviewModal - Bottom sheet showing pack details before purchase
 */
import React from "react";
import { View, Pressable, ScrollView, Image, Modal as RNModal } from "react-native";
import { Text, Icon, Button } from "@/components/ui";
import { type StorePackPreview, type StorePackQuestion } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";

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

  const isFree = pack.free;
  const isOwned = pack.isOwned === true;
  const canAfford = isFree || userCoins >= pack.price;
  const previewQuestions = pack.previewQuestions || [];
  const remainingCount = pack.numberOfQuestions - previewQuestions.length;

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

        <View className="bg-white rounded-t-3xl" style={{ maxHeight: "80%" }}>
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
            {previewQuestions.length > 0 && (
              <>
                <Text variant="body" className="font-semibold mb-3">
                  Preview ({previewQuestions.length} of {pack.numberOfQuestions})
                </Text>

                {previewQuestions.map((q, i) => (
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
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View
            className="flex-row items-center px-5 py-4 border-t"
            style={{ borderTopColor: colors.neutral[100] }}
          >
            <View className="flex-1 mr-3">
              {isOwned ? (
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full self-start"
                  style={{ backgroundColor: withOpacity(colors.primary[500], 0.15) }}
                >
                  <Icon name="checkmark-circle" customSize={16} color={colors.primary[500]} />
                  <Text variant="body" className="ml-1.5 font-bold" style={{ color: colors.primary[500] }}>
                    Owned
                  </Text>
                </View>
              ) : isFree ? (
                <View
                  className="px-3 py-1.5 rounded-full self-start"
                  style={{ backgroundColor: withOpacity(colors.success, 0.15) }}
                >
                  <Text variant="body" className="font-bold" style={{ color: colors.success }}>
                    Free
                  </Text>
                </View>
              ) : (
                <View
                  className="flex-row items-center px-3 py-1.5 rounded-full self-start"
                  style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}
                >
                  <Icon name="diamond" customSize={16} color={colors.gold} />
                  <Text variant="body" className="ml-1.5 font-bold" style={{ color: colors.gold }}>
                    {pack.price} coins
                  </Text>
                </View>
              )}
            </View>

            <Button variant="outline" size="sm" onPress={onClose} className="mr-2" style={{ minWidth: 70 }}>
              Close
            </Button>

            {!isOwned && (
              <Button variant="primary" size="sm" onPress={canAfford ? onPurchase : onBuyCoins} border="border-2 border-primary-500" style={{ minWidth: 70 }}>
                {isFree ? "Get" : canAfford ? "Buy" : `Get ${pack.price - userCoins} Coins`}
              </Button>
            )}
          </View>
        </View>
      </View>
    </RNModal>
  );
}
