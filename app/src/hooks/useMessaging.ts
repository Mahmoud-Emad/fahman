/**
 * useMessaging - Centralized hook for messaging state management
 * Handles notifications, conversations, and chat details
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RootStackParamList } from "../../App";
import type {
  Notification,
  NotificationAction,
  Conversation,
  DirectMessage,
  RoomInviteData,
} from "@/components/messaging/types";
import { UI_TIMING } from "@/constants";
import {
  buildRoomDataFromNotification,
  buildRoomDataFromChatInvite,
  transformUrl,
} from "@/utils";
import { notificationService } from "@/services/notificationService";
import { messageService, type Conversation as ApiConversation } from "@/services/messageService";
import { socketService } from "@/services/socketService";
import { friendsService } from "@/services/friendsService";
import { useToast, useAuth } from "@/contexts";

type NavigationProp = StackNavigationProp<RootStackParamList>;

export interface UseMessagingReturn {
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  notificationsVisible: boolean;
  notificationsLoading: boolean;
  setNotificationsVisible: (visible: boolean) => void;
  handleNotificationPress: (notification: Notification) => void;
  handleNotificationAction: (
    notification: Notification,
    action: NotificationAction
  ) => void;
  handleMarkAllNotificationsRead: () => void;
  handleDeleteNotification: (notificationId: string) => void;
  handleClearReadNotifications: () => void;

  // Conversations
  conversations: Conversation[];
  unreadMessageCount: number;
  chatsListVisible: boolean;
  chatsLoading: boolean;
  setChatsListVisible: (visible: boolean) => void;
  handleConversationPress: (conversation: Conversation) => void;

  // Chat Details
  chatDetailsVisible: boolean;
  activeConversation: Conversation | null;
  activeMessages: DirectMessage[];
  setChatDetailsVisible: (visible: boolean) => void;
  handleSendDirectMessage: (text: string) => void;
  handleDeleteMessage: (messageId: string) => void;
  handleChatDetailsBack: () => void;
  handleJoinRoomFromChat: (invite: RoomInviteData) => void;

  // Direct chat
  openDirectChat: (friend: { id: string; name: string; initials: string; avatar?: string }) => void;

  // Current user
  currentUserId: string;

  // Actions
  openNotifications: () => void;
  openChatsList: () => void;
  closeAllModals: () => void;
}

/**
 * Transform API conversation to frontend Conversation type
 */
function transformApiConversation(apiConv: ApiConversation): Conversation {
  const name = apiConv.otherName || "Unknown";
  return {
    id: apiConv.otherId,
    otherId: apiConv.otherId,
    participants: [{
      id: apiConv.otherId,
      name,
      initials: name.substring(0, 2).toUpperCase(),
      avatar: apiConv.otherAvatar || undefined,
      isOnline: false,
    }],
    lastMessage: apiConv.lastMessage ? {
      text: apiConv.lastMessage.text,
      timestamp: new Date(apiConv.lastMessage.createdAt),
      senderId: apiConv.lastMessage.senderId,
    } : { text: "", timestamp: new Date(), senderId: "" },
    unreadCount: apiConv.unreadCount,
  };
}

/**
 * Hook for managing messaging state across screens
 */
export function useMessaging(): UseMessagingReturn {
  const navigation = useNavigation<NavigationProp>();
  const toast = useToast();
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatsListVisible, setChatsListVisible] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);

  // Chat details state
  const [chatDetailsVisible, setChatDetailsVisible] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<DirectMessage[]>([]);

  // Ref to track active conversation for socket handler
  const activeConversationRef = useRef<Conversation | null>(null);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Computed values
  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;
  const unreadMessageCount = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  // Listen for real-time notifications via socket
  useEffect(() => {
    const unsubscribe = socketService.onNotification((data) => {
      // Map backend notification type to frontend type (FRIEND_REQUEST -> friend_request)
      const typeMap: Record<string, Notification["type"]> = {
        FRIEND_REQUEST: "friend_request",
        FRIEND_ACCEPTED: "friend_accepted",
        ROOM_INVITE: "room_invite",
        SYSTEM: "system",
      };

      const notificationType = typeMap[data.type] || "system";

      // Get sender info from the full notification data
      const senderData = data.sender;
      const actionData = data.actionData as Record<string, any> | null;
      const senderName = senderData?.displayName || senderData?.username || actionData?.senderName || data.senderName;
      // Use sender relation avatar first, then actionData.senderAvatar as fallback
      const rawAvatar = senderData?.avatar || actionData?.senderAvatar;
      const senderAvatar = transformUrl(rawAvatar);

      // Transform socket notification to Notification type
      const newNotification: Notification = {
        id: data.id,
        type: notificationType,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.createdAt),
        isRead: false,
        sender: data.senderId && senderName ? {
          id: data.senderId,
          name: senderName,
          initials: senderName.substring(0, 2).toUpperCase(),
          avatar: senderAvatar,
        } : undefined,
        actionData: data.actionData as Notification["actionData"],
      };

      // Add to beginning of notifications list (avoid duplicates)
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });

      // Show toast alert for real-time notification
      toast.info(data.message || data.title);
    });

    return unsubscribe;
  }, [toast]);

  // Listen for real-time direct messages via socket
  useEffect(() => {
    const unsub = socketService.onDirectMessage((dm) => {
      // Don't process our own sent messages (they come back via socket echo)
      if (dm.senderId === currentUserId) return;

      const activeConv = activeConversationRef.current;

      // If chat is open with this sender, add to active messages
      if (activeConv?.otherId === dm.senderId) {
        const newMsg: DirectMessage = {
          id: dm.id,
          conversationId: activeConv.id,
          senderId: dm.senderId,
          senderName: dm.senderName,
          senderInitials: dm.senderName.substring(0, 2).toUpperCase(),
          type: dm.type === "ROOM_INVITE" ? "room_invite" : "text",
          text: dm.text,
          timestamp: new Date(dm.timestamp),
          isRead: true,
          status: "delivered",
        };
        setActiveMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === dm.id)) return prev;
          return [...prev, newMsg];
        });
        // Mark as read since chat is open
        messageService.markConversationAsRead(dm.senderId);
      }

      // Update conversations list
      setConversations((prev) => {
        const existing = prev.find((c) => c.otherId === dm.senderId);
        if (existing) {
          return prev.map((c) =>
            c.otherId === dm.senderId
              ? {
                  ...c,
                  lastMessage: {
                    text: dm.text,
                    timestamp: new Date(dm.timestamp),
                    senderId: dm.senderId,
                  },
                  unreadCount: activeConv?.otherId === dm.senderId
                    ? c.unreadCount
                    : c.unreadCount + 1,
                }
              : c
          );
        }
        // New conversation from this sender
        const newConv: Conversation = {
          id: dm.senderId,
          otherId: dm.senderId,
          participants: [{
            id: dm.senderId,
            name: dm.senderName,
            initials: dm.senderName.substring(0, 2).toUpperCase(),
            avatar: dm.senderAvatar || undefined,
          }],
          lastMessage: {
            text: dm.text,
            timestamp: new Date(dm.timestamp),
            senderId: dm.senderId,
          },
          unreadCount: activeConv?.otherId === dm.senderId ? 0 : 1,
        };
        return [newConv, ...prev];
      });
    });

    return unsub;
  }, [currentUserId]);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationService.getNotifications(1, 50, false);

      if (response.success && response.data) {
        // Map backend notification type to frontend type
        const typeMap: Record<string, Notification["type"]> = {
          FRIEND_REQUEST: "friend_request",
          FRIEND_ACCEPTED: "friend_accepted",
          ROOM_INVITE: "room_invite",
          SYSTEM: "system",
        };

        // Transform API notifications to frontend Notification type
        const transformedNotifications: Notification[] = response.data.map((n: any) => {
          const actionDataObj = n.actionData as Record<string, any> | null;
          const senderName = n.sender?.displayName || n.sender?.username || actionDataObj?.senderName;
          // Use sender relation avatar first, then actionData.senderAvatar as fallback
          const rawAvatar = n.sender?.avatar || actionDataObj?.senderAvatar;
          const avatar = transformUrl(rawAvatar);

          return {
            id: n.id,
            type: typeMap[n.type] || "system",
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt),
            isRead: n.isRead,
            sender: n.senderId && senderName ? {
              id: n.senderId,
              name: senderName,
              initials: senderName.substring(0, 2).toUpperCase(),
              avatar,
            } : undefined,
            actionData: n.actionData,
          };
        });

        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    try {
      setChatsLoading(true);
      const response = await messageService.getConversations();
      if (response.success && response.data) {
        const transformed = response.data.map(transformApiConversation);
        setConversations(transformed);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setChatsLoading(false);
    }
  }, []);

  // Open notifications and load data
  const openNotifications = useCallback(() => {
    setNotificationsVisible(true);
    loadNotifications();
  }, [loadNotifications]);

  // Open chats list and load data
  const openChatsList = useCallback(() => {
    setChatsListVisible(true);
    loadConversations();
  }, [loadConversations]);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setNotificationsVisible(false);
    setChatsListVisible(false);
    setChatDetailsVisible(false);
    setActiveConversation(null);
    setActiveMessages([]);
  }, []);

  // Helper to load messages for a conversation
  const loadMessagesForConversation = useCallback(async (conversation: Conversation) => {
    try {
      const response = await messageService.getConversationMessages(conversation.otherId, 50);
      if (response.success && response.data) {
        const messages: DirectMessage[] = response.data.messages.map((msg) => ({
          id: msg.id,
          conversationId: conversation.id,
          senderId: msg.senderId,
          senderName: msg.sender?.displayName || msg.sender?.username || "Unknown",
          senderInitials: (msg.sender?.displayName || msg.sender?.username || "?").substring(0, 2).toUpperCase(),
          type: msg.messageType === "ROOM_INVITE" ? "room_invite" as const : "text" as const,
          text: msg.text,
          timestamp: new Date(msg.createdAt),
          isRead: msg.isRead,
          status: "sent" as const,
        }));
        setActiveMessages(messages);

        // Mark conversation as read
        await messageService.markConversationAsRead(conversation.otherId);

        // Update unread count in conversations list
        setConversations((prev) =>
          prev.map((c) =>
            c.otherId === conversation.otherId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  // Notification handlers
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      // Handle room invite
      if (
        notification.type === "room_invite" &&
        notification.actionData?.type === "room_invite"
      ) {
        const actionData = notification.actionData;
        setNotificationsVisible(false);
        setTimeout(() => {
          navigation.navigate("JoinRoom", buildRoomDataFromNotification(actionData));
        }, UI_TIMING.MODAL_TRANSITION_DELAY);
      }
    },
    [navigation]
  );

  const handleNotificationAction = useCallback(
    async (notification: Notification, action: NotificationAction) => {
      if (
        action === "join" &&
        notification.actionData?.type === "room_invite"
      ) {
        const actionData = notification.actionData;
        setNotificationsVisible(false);
        setTimeout(() => {
          navigation.navigate("JoinRoom", buildRoomDataFromNotification(actionData));
        }, UI_TIMING.MODAL_TRANSITION_DELAY);
      } else if (notification.type === "friend_request") {
        // Get the friendship ID from actionData
        const friendshipId = notification.actionData?.friendshipId;

        // Helper to handle errors - remove stale notification and show message
        const handleError = (error: any) => {
          const errorMessage = error?.message || "Failed to process request";
          if (errorMessage.includes("not found") || error?.status === 404) {
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            toast.info("This request is no longer available");
          } else {
            toast.error(errorMessage);
          }
        };

        if (!friendshipId) {
          const senderId = notification.actionData?.senderId || notification.sender?.id;
          if (!senderId) {
            toast.error("Unable to process this request");
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            return;
          }

          try {
            const statusResponse = await friendsService.getFriendshipStatus(senderId);
            if (statusResponse.success && statusResponse.data?.friendshipId) {
              const fId = statusResponse.data.friendshipId;
              if (action === "accept") {
                const response = await friendsService.acceptFriendRequest(fId);
                if (response.success) {
                  setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                  toast.success("Friend request accepted!");
                }
              } else if (action === "decline") {
                const response = await friendsService.declineFriendRequest(fId);
                if (response.success) {
                  setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                }
              }
            } else {
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              toast.info("This request is no longer available");
            }
          } catch (error: any) {
            handleError(error);
          }
          return;
        }

        try {
          if (action === "accept") {
            const response = await friendsService.acceptFriendRequest(friendshipId);
            if (response.success) {
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              toast.success("Friend request accepted!");
            }
          } else if (action === "decline") {
            const response = await friendsService.declineFriendRequest(friendshipId);
            if (response.success) {
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
            }
          }
        } catch (error: any) {
          handleError(error);
        }
      }
    },
    [navigation, toast]
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error: any) {
      console.error("Error marking notifications as read:", error);
    }
  }, []);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error: any) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const handleClearReadNotifications = useCallback(async () => {
    try {
      const response = await notificationService.deleteReadNotifications();
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      }
    } catch (error: any) {
      console.error("Error clearing read notifications:", error);
    }
  }, []);

  // Conversation handlers
  const handleConversationPress = useCallback(async (conversation: Conversation) => {
    setChatsListVisible(false);
    setActiveConversation(conversation);
    setActiveMessages([]);
    setChatDetailsVisible(true);
    await loadMessagesForConversation(conversation);
  }, [loadMessagesForConversation]);

  const handleChatDetailsBack = useCallback(() => {
    setChatDetailsVisible(false);
    setTimeout(() => {
      setActiveConversation(null);
      setActiveMessages([]);
      setChatsListVisible(true);
    }, UI_TIMING.MODAL_TRANSITION_DELAY);
  }, []);

  // Open direct chat with a friend
  const openDirectChat = useCallback(async (friend: { id: string; name: string; initials: string; avatar?: string }) => {
    // Find existing conversation or create temp one
    const existing = conversations.find((c) => c.otherId === friend.id);
    const conversation: Conversation = existing || {
      id: friend.id,
      otherId: friend.id,
      participants: [{
        id: friend.id,
        name: friend.name,
        initials: friend.initials,
        avatar: friend.avatar,
      }],
      lastMessage: { text: "", timestamp: new Date(), senderId: "" },
      unreadCount: 0,
    };

    setActiveConversation(conversation);
    setActiveMessages([]);
    setChatDetailsVisible(true);
    await loadMessagesForConversation(conversation);
  }, [conversations, loadMessagesForConversation]);

  // Send message handler
  const handleSendDirectMessage = useCallback(
    async (text: string) => {
      if (!activeConversation || !currentUserId) return;

      // Optimistically add message to UI
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: DirectMessage = {
        id: tempId,
        conversationId: activeConversation.id,
        senderId: currentUserId,
        senderName: "You",
        senderInitials: "YO",
        type: "text",
        text,
        timestamp: new Date(),
        isRead: true,
        status: "sending",
      };

      setActiveMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await messageService.sendMessage(activeConversation.otherId, text);
        if (response.success && response.data) {
          // Replace temp message with real one
          setActiveMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? { ...msg, id: response.data!.id, status: "sent" as const }
                : msg
            )
          );

          // Update conversation last message
          setConversations((prev) => {
            const exists = prev.some((c) => c.otherId === activeConversation.otherId);
            if (exists) {
              return prev.map((c) =>
                c.otherId === activeConversation.otherId
                  ? {
                      ...c,
                      lastMessage: {
                        text,
                        timestamp: new Date(),
                        senderId: currentUserId,
                      },
                    }
                  : c
              );
            }
            // Add new conversation if it didn't exist
            return [{
              ...activeConversation,
              lastMessage: { text, timestamp: new Date(), senderId: currentUserId },
            }, ...prev];
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setActiveMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, status: "failed" as const } : msg
          )
        );
        toast.error("Failed to send message");
      }
    },
    [activeConversation, currentUserId, toast]
  );

  // Delete message handler
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) {
        setActiveMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }, []);

  // Join room from chat handler
  const handleJoinRoomFromChat = useCallback(
    (invite: RoomInviteData) => {
      setChatDetailsVisible(false);
      setTimeout(() => {
        navigation.navigate("JoinRoom", buildRoomDataFromChatInvite(invite));
      }, UI_TIMING.MODAL_TRANSITION_DELAY);
    },
    [navigation]
  );

  return {
    // Notifications
    notifications,
    unreadNotificationCount,
    notificationsVisible,
    notificationsLoading,
    setNotificationsVisible,
    handleNotificationPress,
    handleNotificationAction,
    handleMarkAllNotificationsRead,
    handleDeleteNotification,
    handleClearReadNotifications,

    // Conversations
    conversations,
    unreadMessageCount,
    chatsListVisible,
    chatsLoading,
    setChatsListVisible,
    handleConversationPress,

    // Chat Details
    chatDetailsVisible,
    activeConversation,
    activeMessages,
    setChatDetailsVisible,
    handleSendDirectMessage,
    handleDeleteMessage,
    handleChatDetailsBack,
    handleJoinRoomFromChat,

    // Direct chat
    openDirectChat,

    // Current user
    currentUserId,

    // Actions
    openNotifications,
    openChatsList,
    closeAllModals,
  };
}
