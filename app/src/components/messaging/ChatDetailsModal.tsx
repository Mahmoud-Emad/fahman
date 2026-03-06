/**
 * ChatDetailsModal - Modal for viewing and sending messages in a conversation
 */
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal as RNModal,
  Animated,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, Avatar } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { DirectMessageBubble } from "./DirectMessageBubble";
import { MessageInput } from "./MessageInput";
import type { Conversation, DirectMessage, RoomInviteData } from "./types";
import { messageService } from "@/services/messageService";
import { useToast } from "@/contexts";
import { MODAL_SIZES } from "@/constants";
import type { RootStackParamList } from "../../../App";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ChatDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  messages: DirectMessage[];
  onSendMessage: (text: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onJoinRoom?: (invite: RoomInviteData) => void;
  currentUserId?: string;
  onBack?: () => void;
}

/**
 * ChatDetailsModal component
 */
export function ChatDetailsModal({
  visible,
  onClose,
  conversation,
  messages,
  onSendMessage,
  onDeleteMessage,
  onJoinRoom,
  currentUserId = "",
  onBack,
}: ChatDetailsModalProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isClosing, setIsClosing] = useState(false);

  const participant = conversation?.participants[0];
  const isOnline = participant?.isOnline;

  // Handle viewing participant profile
  const handleViewProfile = useCallback(() => {
    if (!participant?.id) return;
    // Close modal first, then navigate
    onClose();
    setTimeout(() => {
      navigation.navigate("UserProfile", { userId: participant.id });
    }, 300);
  }, [participant?.id, navigation, onClose]);

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) {
        // Notify parent to update messages list
        onDeleteMessage?.(messageId);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete message");
    }
  };

  // Animation effect
  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible, slideAnim, fadeAnim]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, messages.length]);

  // Scroll to bottom when keyboard shows
  useEffect(() => {
    const keyboardShowEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardDidShow = Keyboard.addListener(keyboardShowEvent, () => {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      keyboardDidShow.remove();
    };
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    // Dismiss keyboard first, then animate after a short delay
    Keyboard.dismiss();

    // Wait for keyboard to start dismissing before animating modal
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsClosing(false);
        onClose();
      });
    }, Platform.OS === "ios" ? 50 : 100);
  };

  const handleBack = () => {
    if (onBack) {
      handleClose();
    } else {
      handleClose();
    }
  };

  if (!conversation) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Animated Backdrop */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: fadeAnim,
          }}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal Content Container */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
          keyboardVerticalOffset={0}
          enabled={!isClosing}
        >
          {/* Animated Modal Content */}
          <Animated.View
            style={{
              backgroundColor: colors.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: SCREEN_HEIGHT * MODAL_SIZES.DEFAULT_HEIGHT,
              minHeight: SCREEN_HEIGHT * MODAL_SIZES.KEYBOARD_HEIGHT,
              transform: [{ translateY: slideAnim }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            {/* Drag Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.neutral[300],
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              {/* Back Button */}
              {onBack && (
                <Pressable
                  onPress={handleBack}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <Icon name="arrow-back" size="md" color={colors.text.primary} />
                </Pressable>
              )}

              {/* Participant Info - Clickable to view profile */}
              <Pressable
                onPress={handleViewProfile}
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                delayPressIn={0}
              >
                <View style={{ position: "relative" }}>
                  <Avatar source={participant?.avatar} initials={participant?.initials || "??"} size="md" />
                  {isOnline && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.success,
                        borderWidth: 2,
                        borderColor: colors.white,
                      }}
                    />
                  )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="body" className="font-semibold">
                    {participant?.name || "Unknown"}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: isOnline ? colors.success : colors.text.muted }}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </Text>
                </View>
              </Pressable>

              {/* Close Button */}
              <Pressable
                onPress={handleClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="body" color="muted" className="font-bold">
                  ✕
                </Text>
              </Pressable>
            </View>

            {/* Messages - Takes remaining space */}
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 ? (
                <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      backgroundColor: withOpacity(colors.neutral[400], 0.1),
                    }}
                  >
                    <Icon name="chatbubble" size="xl" color={colors.neutral[400]} />
                  </View>
                  <Text variant="body" color="muted" className="font-medium">
                    No messages yet
                  </Text>
                  <Text variant="body-sm" color="muted" center className="mt-1">
                    Send a message to start the conversation
                  </Text>
                </View>
              ) : (
                messages.map((message) => (
                  <DirectMessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    onJoinRoom={onJoinRoom}
                    onDelete={handleDeleteMessage}
                  />
                ))
              )}
            </ScrollView>

            {/* Message Input - Fixed at bottom */}
            <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
              <MessageInput onSend={onSendMessage} />
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}
