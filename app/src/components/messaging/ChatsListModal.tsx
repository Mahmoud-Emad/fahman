/**
 * ChatsListModal - Modal for viewing all chat conversations
 */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { View, ScrollView, Animated } from "react-native";
import { Modal, Text, Icon, SearchInput, EmptyState, Pressable } from "@/components/ui";
import { colors } from "@/themes";
import { ConversationItem } from "./ConversationItem";
import { ConversationSkeletonList } from "./ConversationItemSkeleton";
import type { Conversation } from "./types";

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
  const [searchQuery, setSearchQuery] = useState("");

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) =>
      conv.participants.some((p) => p.name.toLowerCase().includes(query))
    );
  }, [conversations, searchQuery]);

  const isEmpty = conversations.length === 0 && !isLoading;
  const noResults =
    filteredConversations.length === 0 && searchQuery.trim() && !isLoading;

  // Smooth crossfade animation between loading and content
  const fadeAnim = useRef(new Animated.Value(isLoading ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isLoading ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isLoading, fadeAnim]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Chats"
      padding="p-0"
    >
      {/* Search Input */}
      <View className="px-4 pb-3">
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
        />
      </View>

      {/* Conversations List */}
      <View style={{ flex: 1 }}>
        {/* Loading skeleton with fade out */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            opacity: Animated.subtract(1, fadeAnim),
          }}
          pointerEvents={isLoading ? "auto" : "none"}
        >
          <ConversationSkeletonList count={6} />
        </Animated.View>

        {/* Content with fade in */}
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
          }}
          pointerEvents={isLoading ? "none" : "auto"}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24, minHeight: 400 }}
          >
            {isEmpty ? (
              <View className="flex-1 justify-center" style={{ minHeight: 350 }}>
                <EmptyState
                  icon="chatbubbles"
                  title="No conversations yet"
                  description="Start a conversation by inviting friends to play"
                />
              </View>
            ) : noResults ? (
              <View className="flex-1 justify-center" style={{ minHeight: 350 }}>
                <EmptyState
                  icon="search"
                  title="No conversations found"
                  description="Try a different search term"
                  variant="search"
                />
              </View>
            ) : (
              <View>
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    onPress={() => onConversationPress(conversation)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      {/* New Chat Button (optional) */}
      {onNewChat && !isEmpty && (
        <View
          className="px-4 pt-2 border-t"
          style={{ borderTopColor: colors.border }}
        >
          <Pressable
            onPress={onNewChat}
            delayPressIn={0}
            className="flex-row items-center justify-center py-3"
          >
            <Icon name="add-circle" size="md" color={colors.primary[500]} />
            <Text
              variant="body"
              className="ml-2 font-medium"
              style={{ color: colors.primary[500] }}
            >
              New Conversation
            </Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}
