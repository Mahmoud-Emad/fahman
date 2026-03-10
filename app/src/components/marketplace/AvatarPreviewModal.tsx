/**
 * AvatarPreviewModal - Profile card preview and avatar selection modal
 */
import React, { useEffect, useRef } from "react";
import { View, Pressable, Image, Animated, Dimensions, Modal as RNModal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text, Icon } from "@/components/ui";
import { type StoreItem } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Shows current vs preview avatar comparison in a card layout
 */
export function ProfileCardPreview({
  avatarUrl,
  userName,
  isPreview = false,
}: {
  avatarUrl: string;
  userName: string;
  isPreview?: boolean;
}) {
  return (
    <View
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: colors.white,
        borderWidth: isPreview ? 2 : 1,
        borderColor: isPreview ? colors.primary[500] : colors.border,
      }}
    >
      <LinearGradient colors={[colors.primary[400], colors.primary[600]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="h-16" />
      <View className="px-4 pb-4" style={{ marginTop: -32 }}>
        <View className="items-center">
          <View className="rounded-full overflow-hidden mb-2" style={{ width: 64, height: 64, borderWidth: 3, borderColor: colors.white, backgroundColor: colors.neutral[100] }}>
            <Image source={{ uri: avatarUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </View>
          <Text variant="body" className="font-bold" numberOfLines={1}>{userName}</Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colors.success }} />
            <Text variant="caption" color="muted">Online</Text>
          </View>
        </View>
      </View>
      {isPreview && (
        <View className="absolute top-2 right-2 px-2 py-1 rounded-full" style={{ backgroundColor: withOpacity(colors.primary[500], 0.9) }}>
          <Text variant="caption" style={{ color: colors.white, fontSize: 10, fontWeight: "600" }}>PREVIEW</Text>
        </View>
      )}
    </View>
  );
}

interface AvatarPreviewModalProps {
  visible: boolean;
  avatar: StoreItem | null;
  userName: string;
  currentAvatarUrl?: string | null;
  isEquipped?: boolean;
  onClose: () => void;
  onUse: () => void;
}

/**
 * Modal to preview and select an avatar
 */
export function AvatarPreviewModal({ visible, avatar, userName, currentAvatarUrl, isEquipped, onClose, onUse }: AvatarPreviewModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!avatar) return null;

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center" pointerEvents="box-none">
        <Animated.View pointerEvents="auto" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withOpacity(colors.black, 0.7), opacity: opacityAnim }}>
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <Animated.View pointerEvents="auto" className="bg-white rounded-3xl p-5 mx-5" style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, width: SCREEN_WIDTH - 48, maxWidth: 360 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="h3" className="font-bold">Preview Avatar</Text>
            <Pressable onPress={onClose} delayPressIn={0} className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: colors.neutral[100] }}>
              <Icon name="close" customSize={16} color={colors.neutral[500]} />
            </Pressable>
          </View>

          <View className="flex-row mb-4">
            {currentAvatarUrl && !isEquipped && (
              <View className="flex-1 mr-2">
                <Text variant="caption" color="muted" className="text-center mb-2 font-medium">Current</Text>
                <ProfileCardPreview avatarUrl={currentAvatarUrl} userName={userName} />
              </View>
            )}
            <View className={currentAvatarUrl && !isEquipped ? "flex-1 ml-2" : "flex-1"}>
              <Text variant="caption" className="text-center mb-2 font-medium" style={{ color: colors.primary[500] }}>
                {isEquipped ? "Current" : "New Look"}
              </Text>
              <ProfileCardPreview avatarUrl={avatar.url} userName={userName} isPreview={!isEquipped} />
            </View>
          </View>

          <View className="items-center mb-4">
            <Text variant="body" className="font-semibold">{avatar.displayName}</Text>
            {isEquipped ? (
              <View className="flex-row items-center px-3 py-1 mt-2 rounded-full" style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}>
                <Icon name="checkmark-circle" customSize={14} color={colors.primary[500]} />
                <Text variant="caption" className="ml-1.5 font-semibold" style={{ color: colors.primary[500] }}>Currently Equipped</Text>
              </View>
            ) : (
              <View className="flex-row items-center px-3 py-1 mt-2 rounded-full" style={{ backgroundColor: withOpacity(colors.success, 0.1) }}>
                <Icon name="gift" customSize={14} color={colors.success} />
                <Text variant="caption" className="ml-1.5 font-semibold" style={{ color: colors.success }}>Free Avatar</Text>
              </View>
            )}
          </View>

          <View className="flex-row">
            <Pressable onPress={onClose} delayPressIn={0} className="flex-1 mr-2 py-3 rounded-xl items-center border-2" style={{ borderColor: colors.neutral[300] }}>
              <Text variant="body-sm" className="font-semibold" style={{ color: colors.neutral[600] }}>Cancel</Text>
            </Pressable>
            {!isEquipped && (
              <Pressable onPress={onUse} delayPressIn={0} className="flex-1 ml-2 py-3 rounded-xl items-center" style={{ backgroundColor: colors.primary[500] }}>
                <View className="flex-row items-center">
                  <Icon name="checkmark" customSize={16} color={colors.white} />
                  <Text variant="body-sm" className="ml-1.5 font-semibold" style={{ color: colors.white }}>Use Avatar</Text>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}
