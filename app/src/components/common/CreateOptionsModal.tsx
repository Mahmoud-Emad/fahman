/**
 * CreateOptionsModal - Modal for selecting create action
 * Two options: Create Room and Create Pack
 * Shows skeleton loading briefly before revealing buttons
 */
import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { Modal, Text, Icon, Pressable, Skeleton } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface CreateOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateRoom: () => void;
  onCreatePack: () => void;
}

/** Skeleton placeholder matching the shape of each option row */
function OptionSkeleton() {
  return (
    <View
      className="flex-row items-center p-4 rounded-xl"
      style={{ borderWidth: 1, borderColor: colors.border }}
    >
      <Skeleton.Circle size={48} className="mr-4" />
      <View className="flex-1 gap-2">
        <Skeleton.Box width="50%" height={16} borderRadius={8} />
        <Skeleton.Box width="75%" height={12} borderRadius={6} />
      </View>
      <Skeleton.Box width={20} height={20} borderRadius={10} className="ml-2" />
    </View>
  );
}

/**
 * Create options modal with room and pack creation options
 */
export function CreateOptionsModal({
  visible,
  onClose,
  onCreateRoom,
  onCreatePack,
}: CreateOptionsModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleCreateRoom = () => {
    onClose();
    // Small delay for animation
    setTimeout(() => {
      onCreateRoom();
    }, 300);
  };

  const handleCreatePack = () => {
    onClose();
    // Small delay for animation
    setTimeout(() => {
      onCreatePack();
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Create"
      maxHeight="50%"
    >
      <View className="gap-4">
        {isLoading ? (
          <>
            <OptionSkeleton />
            <OptionSkeleton />
          </>
        ) : (
          <>
            {/* Create Room Option */}
            <Pressable
              onPress={handleCreateRoom}
              delayPressIn={0}
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
                <Icon name="game-controller" size="md" color={colors.primary[500]} />
              </View>
              <View className="flex-1">
                <Text variant="body" className="font-semibold">
                  Create Room
                </Text>
                <Text variant="caption" color="muted">
                  Host a new game for friends to join
                </Text>
              </View>
              <Icon name="chevron-forward" size="md" color={colors.neutral[400]} />
            </Pressable>

            {/* Create Pack Option */}
            <Pressable
              onPress={handleCreatePack}
              delayPressIn={0}
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
                <Icon name="albums" size="md" color={colors.success} />
              </View>
              <View className="flex-1">
                <Text variant="body" className="font-semibold">
                  Create Pack
                </Text>
                <Text variant="caption" color="muted">
                  Build your own question pack
                </Text>
              </View>
              <Icon name="chevron-forward" size="md" color={colors.neutral[400]} />
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}
