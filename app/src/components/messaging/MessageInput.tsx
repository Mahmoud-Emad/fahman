/**
 * MessageInput - Chat message input component
 */
import React, { useState } from "react";
import { View, TextInput } from "react-native";
import { Icon, Pressable } from "@/components/ui";
import { colors } from "@/themes";

interface MessageInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * MessageInput component
 */
export function MessageInput({
  onSend,
  placeholder = "Type a message...",
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage("");
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View
      className="flex-row items-end px-4 py-2"
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.white,
      }}
    >
      <View
        className="flex-1 flex-row items-end rounded-2xl px-4 py-2"
        style={{
          backgroundColor: colors.neutral[100],
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: 44,
          maxHeight: 120,
        }}
      >
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral[400]}
          multiline
          className="flex-1"
          style={{
            color: colors.text.primary,
            fontSize: 15,
            padding: 0,
            maxHeight: 100,
          }}
          editable={!disabled}
        />
      </View>

      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        delayPressIn={0}
        className="w-10 h-10 rounded-full items-center justify-center ml-2"
        style={{
          backgroundColor: canSend ? colors.primary[500] : colors.neutral[200],
        }}
      >
        <Icon
          name="send"
          size="sm"
          color={canSend ? colors.white : colors.neutral[400]}
        />
      </Pressable>
    </View>
  );
}
