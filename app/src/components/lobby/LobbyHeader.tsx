/**
 * LobbyHeader - Header section for the RoomLobbyScreen
 * Shows room title, description, room code, player count, and pack info
 */
import React from "react";
import { View, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface LobbyHeaderProps {
  roomTitle: string;
  roomDescription: string;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  packTitle: string;
  packDescription: string;
  packImageUrl: string;
  packQuestionsCount: number;
  packCategory: string;
  onBack: () => void;
  onShare: () => void;
}

export function LobbyHeader({
  roomTitle,
  roomDescription,
  roomCode,
  playerCount,
  maxPlayers,
  packTitle,
  packDescription,
  packImageUrl,
  packQuestionsCount,
  packCategory,
  onBack,
  onShare,
}: LobbyHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="bg-primary-500">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full items-center justify-center -ml-2 active:opacity-70"
        >
          <Icon name="chevron-back" color={colors.white} size="lg" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text variant="h3" className="font-bold" style={{ color: colors.white }}>
            {roomTitle}
          </Text>
          {!!roomDescription && (
            <Text
              variant="caption"
              numberOfLines={1}
              style={{ color: withOpacity(colors.white, 0.8) }}
            >
              {roomDescription}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onShare}
          className="w-10 h-10 rounded-full items-center justify-center -mr-2 active:opacity-70"
        >
          <Icon name="share-social" color={colors.white} size="lg" />
        </Pressable>
      </View>

      {/* Room Info Banner */}
      <View className="mx-4 mb-3 flex-row gap-3">
        <View
          className="flex-1 p-3 rounded-xl"
          style={{ backgroundColor: withOpacity(colors.white, 0.15) }}
        >
          <Text variant="caption" style={{ color: withOpacity(colors.white, 0.7) }}>
            Room Code
          </Text>
          <Text variant="h3" className="font-bold tracking-widest" style={{ color: colors.white }}>
            {roomCode}
          </Text>
        </View>
        <View
          className="p-3 rounded-xl items-center justify-center"
          style={{ backgroundColor: withOpacity(colors.white, 0.15) }}
        >
          <Icon name="people" size="sm" color={colors.white} />
          <Text variant="body" className="font-medium mt-0.5" style={{ color: colors.white }}>
            {playerCount}/{maxPlayers}
          </Text>
        </View>
      </View>

      {/* Pack Info */}
      <View
        className="mx-4 mb-4 p-3 rounded-xl flex-row"
        style={{ backgroundColor: withOpacity(colors.white, 0.12) }}
      >
        {packImageUrl ? (
          <Image
            source={{ uri: packImageUrl }}
            className="w-11 h-11 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-11 h-11 rounded-lg items-center justify-center"
            style={{ backgroundColor: withOpacity(colors.white, 0.15) }}
          >
            <Icon name="library" size="md" color={colors.white} />
          </View>
        )}
        <View className="flex-1 ml-3 justify-center">
          <Text
            variant="body-sm"
            className="font-semibold"
            numberOfLines={1}
            style={{ color: colors.white }}
          >
            {packTitle}
          </Text>
          {!!packDescription && (
            <Text
              variant="caption"
              numberOfLines={1}
              style={{ color: withOpacity(colors.white, 0.7) }}
            >
              {packDescription}
            </Text>
          )}
          <View className="flex-row items-center mt-0.5 gap-3">
            <View className="flex-row items-center">
              <Icon name="help-circle" customSize={12} color={withOpacity(colors.white, 0.6)} />
              <Text
                variant="caption"
                className="ml-1"
                style={{ color: withOpacity(colors.white, 0.7) }}
              >
                {packQuestionsCount} questions
              </Text>
            </View>
            {!!packCategory && (
              <View className="flex-row items-center">
                <Icon name="pricetag" customSize={12} color={withOpacity(colors.white, 0.6)} />
                <Text
                  variant="caption"
                  className="ml-1"
                  style={{ color: withOpacity(colors.white, 0.7) }}
                >
                  {packCategory}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
