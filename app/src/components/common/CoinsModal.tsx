/**
 * CoinsModal - Modal showing coins info and coming soon features
 */
import React from "react";
import { View } from "react-native";
import { Modal, Text, Icon, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface CoinsModalProps {
  visible: boolean;
  onClose: () => void;
  coins: number;
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View className="flex-row items-start mb-4">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
      >
        <Icon name={icon as any} size="sm" color={colors.primary[500]} />
      </View>
      <View className="flex-1">
        <Text variant="body-sm" className="font-semibold">
          {title}
        </Text>
        <Text variant="caption" color="muted">
          {description}
        </Text>
      </View>
    </View>
  );
}

/**
 * Coins modal with balance and coming soon features
 */
export function CoinsModal({ visible, onClose, coins }: CoinsModalProps) {
  return (
    <Modal visible={visible} onClose={onClose} title="Fahman Coins" maxHeight="70%">
      <View>
        {/* Coins Balance */}
        <View
          className="items-center py-6 mb-6 rounded-2xl"
          style={{ backgroundColor: withOpacity(colors.gold, 0.1) }}
        >
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: colors.gold }}
          >
            <Icon name="diamond" customSize={32} color={colors.white} />
          </View>
          <Text variant="h1" className="font-bold" style={{ color: colors.gold }}>
            {coins.toLocaleString()}
          </Text>
          <Text variant="body-sm" color="muted">
            Fahman Coins
          </Text>
        </View>

        {/* Coming Soon Badge */}
        <View className="flex-row items-center justify-center mb-4">
          <View
            className="px-4 py-2 rounded-full"
            style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
          >
            <Text
              variant="body-sm"
              className="font-semibold"
              style={{ color: colors.primary[500] }}
            >
              Coming Soon
            </Text>
          </View>
        </View>

        {/* Features List */}
        <Text variant="body" className="font-semibold mb-4">
          Use your coins for:
        </Text>

        <FeatureItem
          icon="storefront"
          title="Marketplace"
          description="Buy exclusive assets, themes, and customizations"
        />

        <FeatureItem
          icon="image"
          title="Room Backgrounds"
          description="Unlock stunning backgrounds for your game rooms"
        />

        <FeatureItem
          icon="gift"
          title="Send Gifts"
          description="Surprise your friends with special gifts"
        />

        <FeatureItem
          icon="flash"
          title="Power-ups"
          description="Get powerful features to enhance your gameplay"
        />

        {/* Close Button */}
        <View className="mt-4">
          <Button variant="primary" size="lg" fullWidth onPress={onClose}>
            Got it!
          </Button>
        </View>
      </View>
    </Modal>
  );
}
