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
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, EmptyState } from "@/components/ui";
import { MessageInput } from "@/components/messaging/MessageInput";
import { colors, withOpacity } from "@/themes";
import { MODAL_SIZES } from "@/constants";
import { ChatBubble } from "@/components/chat";
import type { ChatMessage } from "./types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface LobbyChatModalProps {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
}

const ANIM_DURATION = 250;
const PANEL_HEIGHT = SCREEN_HEIGHT * MODAL_SIZES.DEFAULT_HEIGHT;

export function LobbyChatModal({
  visible,
  onClose,
  messages,
  currentUserId,
  onSendMessage,
}: LobbyChatModalProps) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

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
      const id = setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(id);
    }
  }, [visible, messages.length]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <ChatBubble
        isCurrentUser={item.senderId === currentUserId}
        type={item.type === "system" ? "system" : "text"}
        text={item.message}
        senderName={item.senderName}
        senderInitials={item.senderInitials}
        senderAvatar={item.senderAvatar}
        timestamp={item.timestamp}
        systemVariant={item.systemVariant}
        showAvatar
        showSenderName
        variant="room"
      />
    ),
    [currentUserId],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

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
            <View style={{ flex: 1, justifyContent: "center" }}>
              <EmptyState
                icon="chatbubble-outline"
                title="No messages yet"
                description="Say hi to your fellow players!"
              />
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
          <View style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}>
            <MessageInput onSend={onSendMessage} />
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
