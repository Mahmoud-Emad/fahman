/**
 * LobbyChatPanel - Chat panel for RoomLobbyScreen
 */
import React, { type RefObject } from "react";
import { View, ScrollView, TextInput, Pressable, type ScrollView as ScrollViewType } from "react-native";
import { Text, Icon } from "@/components/ui";
import { colors } from "@/themes";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage } from "./types";

interface LobbyChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  chatScrollRef: RefObject<ScrollViewType>;
  chatInput: string;
  onChatInputChange: (text: string) => void;
  onSendMessage: () => void;
}

/**
 * Lobby chat panel with message list and input
 */
export function LobbyChatPanel({
  messages,
  currentUserId,
  chatScrollRef,
  chatInput,
  onChatInputChange,
  onSendMessage,
}: LobbyChatPanelProps) {
  return (
    <View className="flex-1">
      <Text variant="body" className="font-semibold mb-2">
        Chat
      </Text>
      <View
        className="rounded-xl"
        style={{
          backgroundColor: colors.neutral[50],
          borderWidth: 1,
          borderColor: colors.neutral[200],
          minHeight: 200,
        }}
      >
        <ScrollView
          ref={chatScrollRef}
          className="p-3"
          style={{ maxHeight: 200, marginBottom: 10 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {messages.length === 0 ? (
            <View className="items-center justify-center py-8">
              <Icon name="chatbubble-outline" size="xl" color={colors.neutral[300]} />
              <Text variant="caption" color="muted" className="mt-2">
                No messages yet
              </Text>
              <Text variant="caption" color="muted">
                Say hi to your fellow players!
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Chat Input */}
      <View className="flex-row items-center gap-2 mt-2">
        <TextInput
          value={chatInput}
          onChangeText={onChatInputChange}
          placeholder="Type a message..."
          placeholderTextColor={colors.neutral[400]}
          className="flex-1 rounded-xl px-4 py-2.5"
          style={{
            backgroundColor: colors.neutral[100],
            fontSize: 14,
            color: colors.text.primary,
            borderWidth: 1,
            borderColor: colors.primary[500],
          }}
        />
        <Pressable
          onPress={onSendMessage}
          disabled={!chatInput.trim()}
          className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
          style={{
            backgroundColor: chatInput.trim() ? colors.primary[500] : colors.neutral[200],
          }}
        >
          <Icon
            name="send"
            customSize={18}
            color={chatInput.trim() ? colors.white : colors.neutral[400]}
          />
        </Pressable>
      </View>
    </View>
  );
}
