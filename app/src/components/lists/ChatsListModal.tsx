/**
 * ChatsListModal - Modal for viewing all chat conversations
 */
import React from "react";
import { ListModal } from "@/components/ui";
import { ConversationItem } from "@/components/messaging/ConversationItem";
import { ConversationSkeletonList } from "@/components/messaging/ConversationItemSkeleton";
import type { Conversation } from "@/components/messaging/types";

interface ChatsListModalProps {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onConversationPress: (conversation: Conversation) => void;
  onNewChat?: () => void;
  isLoading?: boolean;
}

/**
 * ChatsListModal component
 */
export function ChatsListModal({
  visible,
  onClose,
  conversations,
  onConversationPress,
  onNewChat,
  isLoading = false,
}: ChatsListModalProps) {
  return (
    <ListModal<Conversation>
      visible={visible}
      onClose={onClose}
      title="Chats"
      data={conversations}
      renderItem={(conversation) => (
        <ConversationItem
          conversation={conversation}
          onPress={() => onConversationPress(conversation)}
        />
      )}
      keyExtractor={(conv) => conv.id}
      searchable
      searchPlaceholder="Search conversations..."
      filterFn={(conv, query) =>
        conv.participants.some((p) =>
          p.name.toLowerCase().includes(query)
        )
      }
      isLoading={isLoading}
      loadingSkeleton={<ConversationSkeletonList count={6} />}
      emptyState={{
        icon: "chatbubbles",
        title: "No conversations yet",
        description: "Start a conversation by inviting friends to play",
      }}
      noResultsState={{
        icon: "search",
        title: "No conversations found",
        description: "Try a different search term",
        variant: "search",
      }}
      footerAction={
        onNewChat
          ? {
              icon: "add-circle",
              label: "New Conversation",
              onPress: onNewChat,
            }
          : undefined
      }
    />
  );
}
