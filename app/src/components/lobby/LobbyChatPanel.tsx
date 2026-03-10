/**
 * LobbyChatPanel - Chat panel for RoomLobbyScreen
 */
import React, { type RefObject } from "react";
import { View, ScrollView, type ScrollView as ScrollViewType } from "react-native";
import { Text, EmptyState } from "@/components/ui";
import { colors } from "@/themes";
import { MessageInput } from "@/components/messaging/MessageInput";
import { ChatBubble } from "@/components/chat";
import type { ChatMessage } from "./types";

interface LobbyChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  chatScrollRef: RefObject<ScrollViewType>;
  onSendMessage: (text: string) => void;
}

/**
 * Lobby chat panel with message list and input
 */
export function LobbyChatPanel({
  messages,
  currentUserId,
  chatScrollRef,
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
            <EmptyState
              icon="chatbubble-outline"
              title="No messages yet"
              description="Say hi to your fellow players!"
              className="py-8"
            />
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                isCurrentUser={message.senderId === currentUserId}
                type={message.type === "system" ? "system" : "text"}
                text={message.message}
                senderName={message.senderName}
                senderInitials={message.senderInitials}
                senderAvatar={message.senderAvatar}
                timestamp={message.timestamp}
                systemVariant={message.systemVariant}
                showAvatar
                showSenderName
                variant="room"
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Chat Input */}
      <View className="mt-2">
        <MessageInput onSend={onSendMessage} />
      </View>
    </View>
  );
}
