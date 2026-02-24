/**
 * PackCard - Selectable pack card for pack selection modal
 * Shows pack logo, title, and question count
 */
import React from "react";
import { View, Image } from "react-native";
import { Text, Icon, Pressable } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import type { PackData } from "./types";

// Default pack logo fallback
const DEFAULT_PACK_LOGO = require("../../../assets/icon.png");

interface PackCardProps {
  /** Pack data to display */
  pack: PackData;
  /** Whether this pack is selected */
  isSelected?: boolean;
  /** Callback when card is pressed */
  onPress: (pack: PackData) => void;
  /** Card size variant */
  size?: "sm" | "md";
}

/**
 * Selectable pack card component
 */
export function PackCard({
  pack,
  isSelected = false,
  onPress,
  size = "md",
}: PackCardProps) {
  const cardSize = size === "sm" ? { width: 100, height: 120 } : { width: 120, height: 140 };
  const logoSize = size === "sm" ? 48 : 56;
  const initialsSize = size === "sm" ? 20 : 24;

  return (
    <Pressable
      onPress={() => onPress(pack)}
      delayPressIn={0}
      className="active:scale-95"
      style={{ marginRight: 12 }}
    >
      <View
        className="rounded-xl items-center justify-center p-3"
        style={{
          ...cardSize,
          backgroundColor: pack.logoUri ? colors.white : colors.primary[500],
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary[500] : (pack.logoUri ? colors.border : colors.primary[500]),
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.15 : 0.08,
          shadowRadius: isSelected ? 8 : 4,
          elevation: isSelected ? 4 : 2,
        }}
      >
        {/* Selected checkmark */}
        {isSelected && (
          <View
            className="absolute top-2 right-2 w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: pack.logoUri ? colors.primary[500] : colors.white }}
          >
            <Icon name="checkmark" customSize={12} color={pack.logoUri ? colors.white : colors.primary[500]} />
          </View>
        )}

        {/* Pack logo */}
        <View
          className="rounded-lg items-center justify-center mb-2 overflow-hidden"
          style={{
            width: logoSize,
            height: logoSize,
            backgroundColor: colors.white,
          }}
        >
          <Image
            source={pack.logoUri ? { uri: pack.logoUri } : DEFAULT_PACK_LOGO}
            style={{ width: logoSize, height: logoSize }}
            resizeMode="cover"
          />
        </View>

        {/* Pack title */}
        <Text
          variant="caption"
          className="font-semibold text-center"
          numberOfLines={2}
          style={{
            color: pack.logoUri
              ? (isSelected ? colors.primary[500] : colors.text.primary)
              : colors.white,
          }}
        >
          {pack.title}
        </Text>

        {/* Question count */}
        <Text
          variant="caption"
          style={{
            fontSize: 10,
            color: pack.logoUri ? colors.text.muted : colors.white,
            marginTop: 2,
          }}
        >
          {pack.questionsCount} questions
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * Create new pack card button
 */
export function CreatePackCard({
  onPress,
  size = "md",
}: {
  onPress: () => void;
  size?: "sm" | "md";
}) {
  const cardSize = size === "sm" ? { width: 100, height: 120 } : { width: 120, height: 140 };

  return (
    <Pressable onPress={onPress} className="active:scale-95" style={{ marginRight: 12 }}>
      <View
        className="rounded-xl items-center justify-center"
        style={{
          ...cardSize,
          backgroundColor: withOpacity(colors.primary[500], 0.05),
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: withOpacity(colors.primary[500], 0.3),
        }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Icon name="add" size="md" color={colors.primary[500]} />
        </View>
        <Text
          variant="caption"
          className="font-semibold"
          style={{ color: colors.primary[500] }}
        >
          Create New
        </Text>
      </View>
    </Pressable>
  );
}
