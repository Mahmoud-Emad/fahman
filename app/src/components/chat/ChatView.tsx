/**
 * ChatView - Reusable chat interface (message list + input)
 *
 * Used in both ChatDetailsModal (DMs) and lobby chat (room chat).
 */
import React, { useRef, useEffect } from "react";
import { View, ScrollView, Platform, Keyboard } from "react-native";
import { EmptyState } from "@/components/ui";
import { ChatBubble, type ChatBubbleProps } from "./ChatBubble";
import { MessageInput } from "@/components/messaging/MessageInput";
import type { RoomInviteData } from "@/components/messaging/types";

export interface ChatViewMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderInitials?: string;
  senderAvatar?: string;
  type: "text" | "system" | "room_invite";
  text?: string;
  roomInvite?: RoomInviteData;
  timestamp: Date;
  status?: ChatBubbleProps["status"];
  systemVariant?: ChatBubbleProps["systemVariant"];
}

export interface ChatViewProps {
  /** Messages to display */
  messages: ChatViewMessage[];
  /** Current user's ID */
  currentUserId: string;
  /** Callback when user sends a message */
  onSendMessage: (text: string) => void;

  // Optional
  /** Input placeholder text */
  placeholder?: string;
  /** Whether to show timestamps on messages */
  showTimestamps?: boolean;
  /** Callback when room invite join is pressed */
  onRoomInvitePress?: (invite: RoomInviteData) => void;
  /** Callback for deleting own messages */
  onDeleteMessage?: (messageId: string) => void;

  // Style
  /** 'room' for compact room chat, 'dm' for DM style */
  variant?: "room" | "dm";
  /** Whether to show sender avatars */
  showAvatars?: boolean;
  /** Whether to show sender names */
  showSenderNames?: boolean;

  // Empty state
  /** Custom empty state config */
  emptyIcon?: string;
  /** Custom empty title */
  emptyTitle?: string;
  /** Custom empty description */
  emptyDescription?: string;
}

/**
 * ChatView component - Reusable chat message list + input
 *
 * @example
 * ```tsx
 * <ChatView
 *   messages={messages}
 *   currentUserId={userId}
 *   onSendMessage={handleSend}
 *   variant="dm"
 *   showAvatars={false}
 * />
 * ```
 */
export function ChatView({
  messages,
  currentUserId,
  onSendMessage,
  placeholder,
  showTimestamps = true,
  onRoomInvitePress,
  onDeleteMessage,
  variant = "room",
  showAvatars = true,
  showSenderNames = true,
  emptyIcon = "chatbubble",
  emptyTitle = "No messages yet",
  emptyDescription = "Send a message to start the conversation",
}: ChatViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Scroll to bottom when keyboard shows
  useEffect(() => {
    const event =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const listener = Keyboard.addListener(event, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return () => listener.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 64,
            }}
          >
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          </View>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              isCurrentUser={msg.senderId === currentUserId}
              type={msg.type}
              text={msg.text}
              roomInvite={msg.roomInvite}
              senderName={msg.senderName}
              senderInitials={msg.senderInitials}
              senderAvatar={msg.senderAvatar}
              showAvatar={showAvatars}
              showSenderName={showSenderNames}
              timestamp={msg.timestamp}
              showTimestamp={showTimestamps}
              status={msg.status}
              systemVariant={msg.systemVariant}
              onRoomInvitePress={onRoomInvitePress}
              onDelete={onDeleteMessage}
              messageId={msg.id}
              variant={variant}
            />
          ))
        )}
      </ScrollView>

      {/* Input */}
      <MessageInput onSend={onSendMessage} placeholder={placeholder} />
    </View>
  );
}
