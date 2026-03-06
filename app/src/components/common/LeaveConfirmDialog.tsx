/**
 * LeaveConfirmDialog - Centered confirmation dialog for leaving a room/lobby
 * Note: This uses a centered modal design (unlike the standard bottom-sheet Modal)
 * Uses RNModal directly for centered positioning which differs from the UI Modal component
 */
import React from "react";
import { View, Pressable, Modal as RNModal } from "react-native";
import { Text, Icon, Button, type IconName } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface LeaveConfirmDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when user confirms leaving */
  onConfirm: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog message */
  message?: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Icon name in the warning circle */
  icon?: IconName;
}

/**
 * Centered confirmation dialog for leaving a room
 * Shows warning icon with Cancel/Leave actions
 */
export function LeaveConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title = "Leave Room?",
  message = "Are you sure you want to leave this room? You can rejoin later if the game is still active.",
  confirmLabel = "Leave",
  icon = "log-out",
}: LeaveConfirmDialogProps) {
  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: withOpacity(colors.black, 0.5) }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="rounded-2xl overflow-hidden mx-6"
          style={{
            maxWidth: 340,
            backgroundColor: colors.white,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Header with Icon */}
          <View className="items-center pt-6 pb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: withOpacity(colors.error, 0.1) }}
            >
              <Icon name={icon} size="xl" color={colors.error} />
            </View>

            <Text variant="h3" className="font-bold text-center px-4">
              {title}
            </Text>

            <Text
              variant="body"
              color="secondary"
              center
              className="mt-2 px-6"
            >
              {message}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 px-4 pb-4">
            <Button
              variant="ghost"
              onPress={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={onConfirm}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
