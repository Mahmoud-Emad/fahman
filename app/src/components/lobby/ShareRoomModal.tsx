/**
 * ShareRoomModal - Modal for sharing room with others
 * Two sharing options: In-app invite and social media share
 */
import React from "react";
import { View, Pressable, Share, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Modal, Text, Icon, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";

interface ShareRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onInAppShare: () => void;
  roomCode: string;
  packName: string;
  password?: string;
}

/**
 * Share room modal with in-app and social sharing options
 */
export function ShareRoomModal({
  visible,
  onClose,
  onInAppShare,
  roomCode,
  packName,
  password,
}: ShareRoomModalProps) {
  const toast = useToast();

  // Generate deep link for direct join
  const deepLink = password
    ? `fahman://join-room?code=${roomCode}&password=${encodeURIComponent(password)}`
    : `fahman://join-room?code=${roomCode}`;

  // Share message with deep link
  const shareMessage = password
    ? `Come join me playing "${packName}" on Fahman Party Game!\n\n🎮 Tap to join: ${deepLink}\n\nOr enter manually:\nRoom Code: ${roomCode}\nPassword: ${password}`
    : `Come join me playing "${packName}" on Fahman Party Game!\n\n🎮 Tap to join: ${deepLink}\n\nOr enter Room Code: ${roomCode}`;

  const handleSocialShare = async () => {
    try {
      if (Platform.OS === "web") {
        // For web, just copy to clipboard
        await Clipboard.setStringAsync(shareMessage);
        toast.success("Link copied to clipboard!");
      } else {
        await Share.share({
          message: shareMessage,
          title: "Join my Fahman Party Game room!",
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(shareMessage);
      toast.success("Room info copied to clipboard!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Share Room"
    >
      <View className="gap-4">
        {/* Room Code Display */}
        <View
          className="p-4 rounded-xl items-center"
          style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
        >
          <Text variant="caption" color="muted" className="mb-1">
            Room Code
          </Text>
          <Text
            variant="h2"
            className="font-bold tracking-widest"
            style={{ color: colors.primary[500] }}
          >
            {roomCode}
          </Text>
          {password && (
            <View className="mt-2 flex-row items-center">
              <Icon name="lock-closed" size="sm" color={colors.neutral[500]} />
              <Text variant="caption" color="muted" className="ml-1">
                Password protected
              </Text>
            </View>
          )}
        </View>

        {/* In-App Share Option */}
        <Pressable
          onPress={onInAppShare}
          className="flex-row items-center p-4 rounded-xl active:opacity-70"
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
          >
            <Icon name="person-add" size="md" color={colors.primary[500]} />
          </View>
          <View className="flex-1">
            <Text variant="body" className="font-semibold">
              Invite Friends
            </Text>
            <Text variant="caption" color="muted">
              Send private invitations to players
            </Text>
          </View>
          <Icon name="chevron-forward" size="md" color={colors.neutral[400]} />
        </Pressable>

        {/* Social Media Share Option */}
        <Pressable
          onPress={handleSocialShare}
          className="flex-row items-center p-4 rounded-xl active:opacity-70"
          style={{
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: withOpacity(colors.success, 0.1) }}
          >
            <Icon name="share-social" size="md" color={colors.success} />
          </View>
          <View className="flex-1">
            <Text variant="body" className="font-semibold">
              Share via Apps
            </Text>
            <Text variant="caption" color="muted">
              Share to WhatsApp, Telegram, etc.
            </Text>
          </View>
          <Icon name="chevron-forward" size="md" color={colors.neutral[400]} />
        </Pressable>

        {/* Copy Link Button */}
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onPress={handleCopyLink}
        >
          <View className="flex-row items-center">
            <Icon name="copy" size="sm" color={colors.primary[500]} />
            <Text
              variant="body"
              className="ml-2 font-medium"
              style={{ color: colors.primary[500] }}
            >
              Copy Room Info
            </Text>
          </View>
        </Button>
      </View>
    </Modal>
  );
}
