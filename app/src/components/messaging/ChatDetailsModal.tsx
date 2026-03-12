/**
 * ChatDetailsModal - Modal for viewing and sending messages in a conversation
 *
 * Uses RNModal (required for React Navigation compatibility) with manual
 * keyboard tracking via state. Uses translateY to shift the modal above keyboard.
 */
import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Platform,
  Modal as RNModal,
  Animated,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  type EmitterSubscription,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Icon, Avatar, EmptyState } from "@/components/ui";
import { colors, withOpacity } from "@/themes";
import { ChatBubble } from "@/components/chat";
import { MessageInput } from "./MessageInput";
import type { Conversation, DirectMessage, RoomInviteData } from "./types";
import { messageService } from "@/services/messageService";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import type { RootStackParamList } from "../../../App";

const SCREEN_HEIGHT = Dimensions.get("window").height;

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
  const [kbHeight, setKbHeight] = useState(0);

  const participant = conversation?.participants[0];
  const isOnline = participant?.isOnline;

  // Track keyboard height for all keyboard types
  useEffect(() => {
    const subs: EmitterSubscription[] = [];

    if (Platform.OS === "ios") {
      subs.push(
        Keyboard.addListener("keyboardWillChangeFrame", (e) => {
          const screenH = Dimensions.get("screen").height;
          const h = Math.max(0, screenH - e.endCoordinates.screenY);
          setKbHeight(h);
          if (h > 0) setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
        })
      );
    } else {
      subs.push(
        Keyboard.addListener("keyboardDidShow", (e) => {
          setKbHeight(e.endCoordinates.height);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
        }),
        Keyboard.addListener("keyboardDidHide", () => setKbHeight(0)),
      );
    }

    return () => subs.forEach((s) => s.remove());
  }, []);

  // Open/close animation
  useEffect(() => {
    if (visible) {
      setIsClosing(false);
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 150, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      setKbHeight(0);
    }
  }, [visible]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, messages.length]);

  const handleViewProfile = useCallback(() => {
    if (!participant?.id) return;
    onClose();
    setTimeout(() => navigation.navigate("UserProfile", { userId: participant.id }), 300);
  }, [participant?.id, navigation, onClose]);

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) onDeleteMessage?.(messageId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    Keyboard.dismiss();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setIsClosing(false);
        onClose();
      });
    }, Platform.OS === "ios" ? 50 : 100);
  };

  if (!conversation) return null;

  // Modal height shrinks to fit above keyboard
  const maxHeight = SCREEN_HEIGHT * 0.92;
  const availableForModal = SCREEN_HEIGHT - kbHeight - insets.top;
  const modalHeight = Math.min(maxHeight, availableForModal);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: withOpacity(colors.black, 0.5),
            opacity: fadeAnim,
          }}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Outer wrapper — keyboard offset via plain style (no animation driver) */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: kbHeight,
            height: modalHeight,
          }}
        >
          {/* Inner — slide animation via native driver */}
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: colors.white,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: colors.black,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 10,
              transform: [{ translateY: slideAnim }],
            }}
          >
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.neutral[300] }} />
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
            {onBack && (
              <Pressable onPress={handleClose} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                <Icon name="arrow-back" size="md" color={colors.text.primary} />
              </Pressable>
            )}
            <Pressable onPress={handleViewProfile} style={{ flexDirection: "row", alignItems: "center", flex: 1 }} delayPressIn={0}>
              <View style={{ position: "relative" }}>
                <Avatar source={participant?.avatar} initials={participant?.initials || "??"} size="md" />
                {isOnline && (
                  <View style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.white }} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text variant="body" className="font-semibold">{participant?.name || "Unknown"}</Text>
                <Text variant="caption" style={{ color: isOnline ? colors.success : colors.text.muted }}>{isOnline ? "Online" : "Offline"}</Text>
              </View>
            </Pressable>
            <Pressable onPress={handleClose} style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }}>
              <Text variant="body" color="muted" className="font-bold">✕</Text>
            </Pressable>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            {messages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center" }}>
                <EmptyState icon="chatbubble" title="No messages yet" description="Send a message to start the conversation" />
              </View>
            ) : (
              messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  isCurrentUser={message.senderId === currentUserId}
                  type={message.type === "room_invite" ? "room_invite" : message.type === "system" ? "system" : "text"}
                  text={message.text}
                  roomInvite={message.roomInvite}
                  senderName={message.senderName}
                  senderInitials={message.senderInitials}
                  timestamp={message.timestamp}
                  status={message.status}
                  onRoomInvitePress={onJoinRoom}
                  onDelete={handleDeleteMessage}
                  messageId={message.id}
                  variant="dm"
                />
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={{ paddingBottom: kbHeight > 0 ? 4 : Math.max(insets.bottom, 8) }}>
            <MessageInput onSend={onSendMessage} />
          </View>
        </Animated.View>
        </View>
      </View>
    </RNModal>
  );
}
