/**
 * SoundShopTab - Sound store section for MarketplaceModal
 * Contains sound list items, category cards, preview modal, and the tab component
 */
import React, { useState, useEffect, useRef } from "react";
import { View, Pressable, ScrollView, ActivityIndicator, Animated, Dimensions, Modal as RNModal } from "react-native";
import { Audio } from "expo-av";
import { Text, Icon, Button } from "@/components/ui";
import { type SoundSection, type SoundItem } from "@/services/storeService";
import { colors, withOpacity } from "@/themes";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import { SectionHeader } from "./AvatarShopTab";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// SOUND LIST ITEM
// ============================================================================

function SoundListItem({ sound, onPress }: { sound: SoundItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} delayPressIn={0} className="flex-row items-center p-3 mb-2 rounded-xl active:opacity-80" style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: sound.isOwned ? colors.success : colors.border }}>
      <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: withOpacity(sound.isOwned ? colors.success : colors.primary[500], 0.1) }}>
        <Icon name="play" customSize={16} color={sound.isOwned ? colors.success : colors.primary[500]} />
      </View>
      <Text variant="body-sm" className="flex-1 ml-3" numberOfLines={1}>{sound.displayName}</Text>
      {sound.isOwned ? (
        <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: withOpacity(colors.success, 0.1) }}>
          <Icon name="checkmark-circle" customSize={12} color={colors.success} />
          <Text variant="caption" className="ml-1 font-semibold" style={{ color: colors.success }}>Owned</Text>
        </View>
      ) : (
        <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}>
          <Icon name="diamond" customSize={12} color={colors.gold} />
          <Text variant="caption" className="ml-1 font-semibold" style={{ color: colors.gold }}>{sound.price}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ============================================================================
// SOUND CATEGORY CARD
// ============================================================================

function SoundCategoryCard({ section, onSoundPress }: { section: SoundSection; onSoundPress: (sound: SoundItem) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);

  const ownedCount = section.subSections.reduce(
    (acc, sub) => acc + sub.sounds.filter((s) => s.isOwned).length,
    0
  );

  return (
    <View className="mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }}>
      <Pressable onPress={() => setIsExpanded(!isExpanded)} delayPressIn={0} className="flex-row items-center p-3">
        <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}>
          <Icon name="folder" size="md" color={colors.primary[500]} />
        </View>
        <View className="flex-1 ml-3">
          <Text variant="body" className="font-semibold" numberOfLines={1}>{section.displayName}</Text>
          <Text variant="caption" color="muted">{section.totalSounds} sounds{ownedCount > 0 && ` • ${ownedCount} owned`}</Text>
        </View>
        <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size="sm" color={colors.neutral[400]} />
      </Pressable>

      {isExpanded && (
        <View className="px-3 pb-3">
          {section.subSections.map((sub) => (
            <View key={sub.id} className="mb-2">
              <Pressable onPress={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)} delayPressIn={0} className="flex-row items-center p-2.5 rounded-xl" style={{ backgroundColor: colors.neutral[50] }}>
                <Icon name="musical-note" size="sm" color={colors.primary[500]} />
                <Text variant="body-sm" className="flex-1 ml-2 font-medium" numberOfLines={1}>{sub.displayName}</Text>
                <Text variant="caption" color="muted" className="mr-2">{sub.sounds.length}</Text>
                <Icon name={expandedSubId === sub.id ? "chevron-up" : "chevron-down"} size="xs" color={colors.neutral[400]} />
              </Pressable>
              {expandedSubId === sub.id && (
                <View className="mt-2 ml-1">
                  {sub.sounds.map((sound) => (
                    <SoundListItem key={sound.id} sound={sound} onPress={() => onSoundPress(sound)} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// SOUND PREVIEW MODAL
// ============================================================================

interface SoundPreviewModalProps {
  visible: boolean;
  sound: SoundItem | null;
  userCoins: number;
  onClose: () => void;
  onPurchase: () => void;
  onBuyCoins: () => void;
}

export function SoundPreviewModal({ visible, sound, userCoins, onClose, onPurchase, onBuyCoins }: SoundPreviewModalProps) {
  const toast = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 15, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      if (soundRef.current) {
        soundRef.current.stopAsync();
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    }
  }, [visible]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  const handlePlay = async () => {
    if (!sound) return;
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
        setIsPlaying(true);
      } else {
        setIsLoading(true);
        const { sound: audioSound } = await Audio.Sound.createAsync(
          { uri: sound.url },
          { shouldPlay: true },
          (status) => { if (status.isLoaded && status.didJustFinish) setIsPlaying(false); }
        );
        soundRef.current = audioSound;
        setIsPlaying(true);
        setIsLoading(false);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  if (!sound) return null;
  const canAfford = userCoins >= sound.price;

  return (
    <RNModal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center">
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: withOpacity(colors.black, 0.7), opacity: opacityAnim }}>
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <Animated.View className="bg-white rounded-3xl p-6 mx-6 items-center" style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim, maxWidth: 320, width: "100%" }}>
          <Animated.View className="rounded-full items-center justify-center mb-4" style={{ width: 100, height: 100, backgroundColor: withOpacity(colors.primary[500], 0.1), transform: [{ scale: pulseAnim }] }}>
            <Pressable onPress={handlePlay} disabled={isLoading} className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary[500] }}>
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Icon name={isPlaying ? "pause" : "play"} customSize={28} color={colors.white} />
              )}
            </Pressable>
          </Animated.View>

          <Text variant="h3" className="font-bold text-center mb-1">{sound.displayName}</Text>
          <Text variant="caption" color="muted" className="mb-4">Tap to preview</Text>

          {sound.isOwned ? (
            <View className="flex-row items-center px-4 py-2 rounded-full mb-4" style={{ backgroundColor: withOpacity(colors.success, 0.1) }}>
              <Icon name="checkmark-circle" customSize={18} color={colors.success} />
              <Text variant="body" className="ml-2 font-bold" style={{ color: colors.success }}>Already owned</Text>
            </View>
          ) : (
            <View className="flex-row items-center px-4 py-2 rounded-full mb-4" style={{ backgroundColor: withOpacity(colors.gold, 0.15) }}>
              <Icon name="diamond" customSize={18} color={colors.gold} />
              <Text variant="body" className="ml-2 font-bold" style={{ color: colors.gold }}>{sound.price} coins</Text>
            </View>
          )}

          <View className="flex-row w-full">
            <Button variant="outline" size="md" className="flex-1 mr-2" onPress={onClose}>Close</Button>
            {!sound.isOwned && (
              <Pressable onPress={canAfford ? onPurchase : onBuyCoins} delayPressIn={0} className="flex-1 ml-2 py-3 rounded-xl items-center" style={{ backgroundColor: colors.primary[500] }}>
                <View className="flex-row items-center">
                  <Icon name={canAfford ? "cart" : "diamond"} customSize={16} color={colors.white} />
                  <Text variant="body-sm" className="ml-1.5 font-semibold" style={{ color: colors.white }}>
                    {canAfford ? "Buy" : `Get ${sound.price - userCoins} Coins`}
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </RNModal>
  );
}

// ============================================================================
// SOUNDS TAB
// ============================================================================

interface SoundsTabProps {
  data: SoundSection[] | null;
  ownedSounds: SoundItem[] | null;
  isLoading: boolean;
  onSoundPress: (sound: SoundItem) => void;
}

export function SoundsTab({ data, ownedSounds, isLoading, onSoundPress }: SoundsTabProps) {
  const [showAllOwned, setShowAllOwned] = useState(false);

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text variant="body-sm" color="muted" className="mt-3">Loading store...</Text>
      </View>
    );
  }

  if (data.length === 0 && (!ownedSounds || ownedSounds.length === 0)) {
    return (
      <View className="flex-1 items-center justify-center">
        <Icon name="musical-notes-outline" size="xl" color={colors.neutral[300]} />
        <Text variant="body" color="muted" className="mt-3">No sounds available yet</Text>
      </View>
    );
  }

  const displayedOwned = showAllOwned ? ownedSounds : ownedSounds?.slice(0, 4);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {ownedSounds && ownedSounds.length > 0 && (
        <View className="mb-6">
          <SectionHeader icon="checkmark-circle" title="My Sounds" badge={`${ownedSounds.length} owned`} badgeColor="success" />
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: colors.white, borderWidth: 2, borderColor: colors.success }}>
            <View className="p-3">
              {displayedOwned?.map((sound) => (
                <SoundListItem key={sound.id} sound={sound} onPress={() => onSoundPress(sound)} />
              ))}
            </View>
            {ownedSounds.length > 4 && (
              <Pressable onPress={() => setShowAllOwned(!showAllOwned)} delayPressIn={0} className="flex-row items-center justify-center py-2.5 border-t" style={{ borderTopColor: colors.neutral[100] }}>
                <Text variant="caption" className="font-semibold" style={{ color: colors.primary[500] }}>
                  {showAllOwned ? "Show Less" : `Show All ${ownedSounds.length} Sounds`}
                </Text>
                <Icon name={showAllOwned ? "chevron-up" : "chevron-down"} customSize={14} color={colors.primary[500]} style={{ marginLeft: 4 }} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View>
        <SectionHeader icon="musical-notes" title="Sound Library" badgeColor="primary" />
        {data.map((section) => (
          <SoundCategoryCard key={section.id} section={section} onSoundPress={onSoundPress} />
        ))}
      </View>
    </ScrollView>
  );
}
