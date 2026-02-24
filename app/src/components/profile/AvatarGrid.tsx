/**
 * AvatarGrid - Individual avatar item for AvatarSelectionModal
 */
import React, { useEffect, useRef } from "react";
import { View, Pressable, Image, Animated, Dimensions } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
export const AVATAR_SIZE = (SCREEN_WIDTH - 72) / 4;

interface AvatarGridItemProps {
  url: string;
  isSelected: boolean;
  isCurrent: boolean;
  onPress: () => void;
}

/**
 * Single avatar cell with selection animation, checkmark, and "CURRENT" badge
 */
export function AvatarGridItem({ url, isSelected, isCurrent, onPress }: AvatarGridItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 0.92 : 1,
      damping: 15,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  return (
    <Pressable onPress={onPress} delayPressIn={0} className="p-1.5">
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
        }}
      >
        <View
          className="flex-1 rounded-2xl overflow-hidden"
          style={{
            borderWidth: isSelected ? 3 : isCurrent ? 2 : 0,
            borderColor: isSelected ? colors.primary[500] : colors.success,
            backgroundColor: colors.neutral[100],
          }}
        >
          {url ? (
            <Image
              source={{ uri: url }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Icon name="person" size="lg" color={colors.neutral[400]} />
            </View>
          )}
        </View>

        {isSelected && (
          <View
            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.primary[500] }}
          >
            <Icon name="checkmark" customSize={14} color={colors.white} />
          </View>
        )}

        {isCurrent && !isSelected && (
          <View
            className="absolute bottom-1 left-1 right-1 py-0.5 rounded-md items-center"
            style={{ backgroundColor: withOpacity(colors.success, 0.95) }}
          >
            <Text style={{ color: colors.white, fontSize: 9, fontWeight: "700" }}>
              CURRENT
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
