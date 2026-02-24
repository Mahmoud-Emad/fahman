/**
 * BottomActions - Bottom action buttons for game phases
 */
import React from "react";
import { View, Pressable } from "react-native";
import { Text, Icon, Button } from "@/components/ui";
import { colors } from "@/themes";

interface SubmitButtonProps {
  /** Whether the submit button is enabled */
  isEnabled: boolean;
  /** Callback when submit is pressed */
  onSubmit: () => void;
}

/**
 * Submit answer button - shown during answering phase
 */
export function SubmitButton({ isEnabled, onSubmit }: SubmitButtonProps) {
  return (
    <View
      className="absolute left-0 right-0 px-4"
      style={{
        bottom: 80,
        paddingBottom: 8,
        paddingTop: 16,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[100],
      }}
    >
      <Button
        variant={isEnabled ? "primary" : "ghost"}
        onPress={onSubmit}
        disabled={!isEnabled}
        className="w-full"
        style={{
          backgroundColor: isEnabled ? colors.primary[500] : colors.neutral[300],
        }}
      >
        Submit Answer
      </Button>
    </View>
  );
}

/**
 * Waiting indicator - shown when waiting for host
 */
export function WaitingIndicator() {
  return (
    <View
      className="absolute left-0 right-0 px-4"
      style={{
        bottom: 80,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: colors.white,
      }}
    >
      <View
        className="rounded-xl py-4 items-center flex-row justify-center"
        style={{ backgroundColor: colors.neutral[100] }}
      >
        <Icon name="ellipsis-horizontal" size="sm" color={colors.neutral[500]} />
        <Text variant="body" className="font-semibold ml-2" color="secondary">
          Waiting for host to continue...
        </Text>
      </View>
    </View>
  );
}
