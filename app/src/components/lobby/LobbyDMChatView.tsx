/**
 * LobbyDMChatView - Chat panel content with messages list and input
 */
import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { EmptyState } from "@/components/ui";
import { ChatBubble } from "@/components/chat";
import { MessageInput } from "@/components/messaging/MessageInput";
import type { DirectMessage, RoomInviteData } from "@/components/messaging/types";
import { colors } from "@/themes";

interface LobbyDMChatViewProps {
  messages: DirectMessage[];
  currentUserId: string;
  scrollViewRef: React.RefObject<FlatList | null>;
  onSendMessage: (text: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onJoinRoom?: (invite: RoomInviteData) => void;
}

export function LobbyDMChatView({
  messages,
  currentUserId,
  scrollViewRef,
  onSendMessage,
  onDeleteMessage,
  onJoinRoom,
}: LobbyDMChatViewProps) {
  return (
    <View style={styles.chatContent}>
      <FlatList
        ref={scrollViewRef as any}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContent,
          messages.length === 0 && styles.messagesEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble"
            title="No messages yet"
            description="Send a message to start chatting"
            iconSize="md"
          />
        }
        renderItem={({ item: message }) => (
          <ChatBubble
            isCurrentUser={message.senderId === currentUserId}
            type={message.type === "room_invite" ? "room_invite" : message.type === "system" ? "system" : "text"}
            text={message.text}
            roomInvite={message.roomInvite}
            senderName={message.senderName}
            senderInitials={message.senderInitials}
            timestamp={message.timestamp}
            status={message.status}
            onRoomInvitePress={onJoinRoom}
            onDelete={onDeleteMessage}
            messageId={message.id}
            variant="dm"
          />
        )}
      />
      <View style={styles.inputContainer}>
        <MessageInput onSend={onSendMessage} placeholder="Message..." />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chatContent: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  messagesEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
});
