/**
 * LobbyDMList - Conversation list panel content
 */
import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { EmptyState } from "@/components/ui";
import { ConversationItem } from "@/components/messaging/ConversationItem";
import { ConversationSkeletonList } from "@/components/messaging/ConversationItemSkeleton";
import type { Conversation } from "@/components/messaging/types";

interface LobbyDMListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onConversationPress: (conversation: Conversation) => void;
}

export function LobbyDMList({
  conversations,
  isLoading,
  onConversationPress,
}: LobbyDMListProps) {
  return (
    <View style={styles.listContent}>
      {isLoading ? (
        <ConversationSkeletonList count={4} />
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: conv }) => (
            <ConversationItem
              conversation={conv}
              onPress={() => onConversationPress(conv)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="chatbubbles"
            title="No conversations"
            description="Your private messages will appear here"
            iconSize="md"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
});
