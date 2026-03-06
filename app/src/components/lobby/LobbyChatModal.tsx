/**
 * LobbyChatModal - Lightweight full-screen chat overlay for the lobby
 *
 * Uses a custom slide-up animation (no Modal wrapper) and FlatList for
 * virtualized rendering so scrolling stays smooth even with many messages.
 */
import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { MODAL_SIZES } from "@/constants";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage } from "./types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LobbyChatModalProps {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId: string;
  chatInput: string;
  onChatInputChange: (text: string) => void;
  onSendMessage: () => void;
}

const ANIM_DURATION = 250;
const PANEL_HEIGHT = SCREEN_HEIGHT * MODAL_SIZES.DEFAULT_HEIGHT;

export function LobbyChatModal({
  visible,
  onClose,
  messages,
  currentUserId,
  chatInput,
  onChatInputChange,
  onSendMessage,
}: LobbyChatModalProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const inputRef = useRef<TextInput>(null);

  // Slide in / out
  useEffect(() => {
    if (visible) {
      isOpen.current = true;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 200,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isOpen.current) {
      // Dismiss keyboard before animating out
      inputRef.current?.blur();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isOpen.current = false;
      });
    }
  }, [visible]);

  // Auto-scroll when new messages arrive while open
  useEffect(() => {
    if (visible && messages.length > 0) {
      // Small delay so FlatList has time to append the item
      const id = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(id);
    }
  }, [visible, messages.length]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble message={item} isOwn={item.senderId === currentUserId} />
    ),
    [currentUserId],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const canSend = chatInput.trim().length > 0;

  // Don't mount anything until first open
  if (!visible && !isOpen.current) return null;

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
      pointerEvents={visible ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          opacity: fadeAnim,
        }}
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* Chat panel */}
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: PANEL_HEIGHT,
          backgroundColor: colors.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          transform: [{ translateY: slideAnim }],
          overflow: "hidden",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={10}
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-5 pt-3 pb-3"
            style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral[100] }}
          >
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2.5"
                style={{ backgroundColor: withOpacity(colors.primary[500], 0.1) }}
              >
                <Icon name="chatbubble-ellipses" customSize={16} color={colors.primary[500]} />
              </View>
              <View>
                <Text variant="body" className="font-bold">
                  Room Chat
                </Text>
                <Text variant="caption" color="muted">
                  {messages.length} {messages.length === 1 ? "message" : "messages"}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.neutral[100] }}
            >
              <Icon name="close" customSize={18} color={colors.neutral[500]} />
            </Pressable>
          </View>

          {/* Messages */}
          {messages.length === 0 ? (
            <View className="items-center justify-center py-16">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: withOpacity(colors.primary[500], 0.08) }}
              >
                <Icon name="chatbubble-outline" size="lg" color={colors.neutral[300]} />
              </View>
              <Text variant="body-sm" color="muted">
                No messages yet
              </Text>
              <Text variant="caption" color="muted" className="mt-1">
                Say hi to your fellow players!
              </Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={15}
              windowSize={7}
              removeClippedSubviews={Platform.OS === "android"}
              onContentSizeChange={() => {
                listRef.current?.scrollToEnd({ animated: false });
              }}
            />
          )}

          {/* Input bar */}
          <View
            className="flex-row items-center gap-2 px-4 pt-2"
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.neutral[100],
              paddingBottom: insets.bottom + 16,
            }}
          >
            <TextInput
              ref={inputRef}
              value={chatInput}
              onChangeText={onChatInputChange}
              placeholder="Type a message..."
              placeholderTextColor={colors.neutral[400]}
              className="flex-1 rounded-full px-4 py-2.5"
              style={{
                backgroundColor: colors.neutral[50],
                fontSize: 14,
                color: colors.text.primary,
                borderWidth: 1,
                borderColor: canSend ? colors.primary[500] : colors.neutral[200],
              }}
              onSubmitEditing={onSendMessage}
              returnKeyType="send"
              maxLength={500}
            />
            <Pressable
              onPress={onSendMessage}
              disabled={!canSend}
              className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
              style={{
                backgroundColor: canSend ? colors.primary[500] : colors.neutral[200],
              }}
            >
              <Icon
                name="send"
                customSize={18}
                color={canSend ? colors.white : colors.neutral[400]}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
