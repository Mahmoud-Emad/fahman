/**
 * TopNavBar component - App header with navigation icons
 * Left: Settings, Help icons | Right: Coins/Energy display
 */
import React from "react";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/Text";
import { Icon } from "@/components/ui/Icon";
import { colors } from "@/themes";

/**
 * Props for the TopNavBar component
 */
export interface TopNavBarProps {
  /** Current coin/energy count */
  coins?: number;
  /** Callback when settings is pressed */
  onSettingsPress?: () => void;
  /** Callback when help is pressed */
  onHelpPress?: () => void;
  /** Callback when coins is pressed */
  onCoinsPress?: () => void;
}

/**
 * TopNavBar component
 */
export function TopNavBar({
  coins = 0,
  onSettingsPress,
  onHelpPress,
  onCoinsPress,
}: TopNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: colors.primary[500],
        paddingTop: insets.top,
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        {/* Left side - Settings and Help */}
        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={onSettingsPress}
            className="p-2 rounded-full active:bg-white/20"
          >
            <Icon name="settings-outline" color={colors.white} size="md" />
          </Pressable>
          <Pressable
            onPress={onHelpPress}
            className="p-2 rounded-full active:bg-white/20"
          >
            <Icon name="help-circle-outline" color={colors.white} size="md" />
          </Pressable>
        </View>

        {/* Right side - Fahman Coins */}
        <Pressable
          onPress={onCoinsPress}
          delayPressIn={0}
          className="flex-row items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full active:bg-white/30"
        >
          <View
            className="w-5 h-5 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.gold }}
          >
            <Icon name="diamond" customSize={12} color={colors.white} />
          </View>
          <Text
            variant="label"
            className="font-bold"
            style={{ color: colors.white }}
          >
            {coins.toLocaleString()}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
