/**
 * JoinRoomModal - Modal for joining a room by ID or entering password
 */
import React, { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Text, Icon, Modal, Input, Button } from "@/components/ui";
import { colors, withOpacity } from "@/themes";

interface JoinRoomModalProps {
  visible: boolean;
  onClose: () => void;
  mode: "id" | "password";
  roomTitle?: string;
  onJoin: (value: string) => void;
  isLoading?: boolean;
}

/**
 * Join Room Modal - for joining by ID or entering password for private rooms
 */
export function JoinRoomModal({
  visible,
  onClose,
  mode,
  roomTitle,
  onJoin,
  isLoading = false,
}: JoinRoomModalProps) {
  const [inputValue, setInputValue] = useState("");

  // Clear input when modal opens or mode changes
  useEffect(() => {
    if (visible) {
      setInputValue("");
    }
  }, [visible, mode]);

  const handleJoin = () => {
    if (!inputValue.trim() || isLoading) return;
    onJoin(inputValue);
  };

  const handleClose = () => {
    if (isLoading) return;
    setInputValue("");
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} onClose={handleClose} title="">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="items-center">
          {/* Icon */}
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
          >
            <Icon
              name={mode === "id" ? "log-in" : "lock-closed"}
              size="xl"
              color={colors.primary[500]}
            />
          </View>

          {/* Title */}
          <Text variant="h3" className="font-bold mb-2">
            {mode === "id" ? "Join Room by Code" : "Enter Password"}
          </Text>

          {/* Subtitle */}
          <Text variant="body" color="secondary" center className="mb-6">
            {mode === "id"
              ? "Enter a room code to join directly"
              : `Enter password to join "${roomTitle}"`}
          </Text>

          {/* Input */}
          <Input
            variant="filled"
            placeholder={mode === "id" ? "Enter room code" : "Password"}
            value={inputValue}
            onChangeText={(text) => setInputValue(mode === "id" ? text.toUpperCase().slice(0, 8) : text.slice(0, 50))}
            maxLength={mode === "id" ? 8 : 50}
            autoCapitalize={mode === "id" ? "characters" : "none"}
            autoCorrect={false}
            secureTextEntry={mode === "password"}
            keyboardType="default"
            containerClassName="w-full mb-4"
            className="text-center"
            editable={!isLoading}
          />

          {/* Join Button */}
          <Button
            variant="primary"
            onPress={handleJoin}
            disabled={!inputValue.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color={colors.white} />
                <Text className="ml-2 font-semibold" style={{ color: colors.white }}>
                  Joining...
                </Text>
              </View>
            ) : (
              "Join Room"
            )}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
