/**
 * MessagingContext - Global messaging state management
 * Provides real-time notifications, conversations, and chat across all screens.
 * Always mounted while authenticated so socket listeners and unread counts
 * persist across navigation.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import type {
  Notification,
  NotificationAction,
  Conversation,
  DirectMessage,
  RoomInviteData,
} from "@/components/messaging/types";
import { UI_TIMING } from "@/constants";
import { getErrorMessage } from "@/utils/errorUtils";
import {
  buildRoomDataFromNotification,
  buildRoomDataFromChatInvite,
  transformUrl,
} from "@/utils";
import { notificationService } from "@/services/notificationService";
import {
  messageService,
  type Conversation as ApiConversation,
} from "@/services/messageService";
import { socketService } from "@/services/socketService";
import { friendsService } from "@/services/friendsService";
import { InAppNotificationBanner } from "@/components/ui";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { useSound } from "@/hooks/useSound";

// ============================================
// Types
// ============================================

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
  openDirectChat: (friend: {
    id: string;
    name: string;
    initials: string;
    avatar?: string;
  }) => void;

  // Current user
  currentUserId: string;

  // Actions
  openNotifications: () => void;
  openChatsList: () => void;
  closeAllModals: () => void;
}

// ============================================
// Helpers
// ============================================

function transformApiConversation(apiConv: ApiConversation): Conversation {
  const name = apiConv.otherName || "Unknown";
  return {
    id: apiConv.otherId,
    otherId: apiConv.otherId,
    participants: [
      {
        id: apiConv.otherId,
        name,
        initials: name.substring(0, 2).toUpperCase(),
        avatar: apiConv.otherAvatar || undefined,
        isOnline: false,
      },
    ],
    lastMessage: apiConv.lastMessage
      ? {
          text: apiConv.lastMessage.text,
          timestamp: new Date(apiConv.lastMessage.createdAt),
          senderId: apiConv.lastMessage.senderId,
        }
      : { text: "", timestamp: new Date(), senderId: "" },
    unreadCount: apiConv.unreadCount,
  };
}

const notificationTypeMap: Record<string, Notification["type"]> = {
  FRIEND_REQUEST: "friend_request",
  FRIEND_ACCEPTED: "friend_accepted",
  ROOM_INVITE: "room_invite",
  SYSTEM: "system",
};

// Module-level dedup set for notification toasts
const toastedNotificationIds = new Set<string>();

// ============================================
// Context
// ============================================

const MessagingContext = createContext<UseMessagingReturn | undefined>(
  undefined
);

interface MessagingProviderProps {
  children: ReactNode;
  navigationRef: React.RefObject<any>;
}

export function MessagingProvider({
  children,
  navigationRef,
}: MessagingProviderProps) {
  const toast = useToast();
  const { user } = useAuth();
  const { playMessageSound, playNotificationSound } = useSound();
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

  // Ref to track whether chat details modal is open (for read-status logic)
  const chatDetailsVisibleRef = useRef(false);
  useEffect(() => {
    chatDetailsVisibleRef.current = chatDetailsVisible;
  }, [chatDetailsVisible]);

  // Track if initial fetch has been done
  const initialFetchDone = useRef(false);

  // In-app notification banner state
  const [inAppBanner, setInAppBanner] = useState<{
    visible: boolean;
    senderName: string;
    senderAvatar?: string;
    senderInitials: string;
    message: string;
    type: "message" | "notification";
  } | null>(null);

  const showInAppBanner = useCallback(
    (data: {
      senderName: string;
      senderAvatar?: string;
      senderInitials: string;
      message: string;
      type: "message" | "notification";
    }) => {
      setInAppBanner({ visible: true, ...data });
    },
    []
  );

  const hideInAppBanner = useCallback(() => {
    setInAppBanner(null);
  }, []);

  // Computed values
  const unreadNotificationCount = notifications.filter(
    (n) => !n.isRead
  ).length;
  const unreadMessageCount = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  // ============================================
  // API Fetch Functions
  // ============================================

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationService.getNotifications(1, 50, false);

      if (response.success && response.data) {
        const transformedNotifications: Notification[] = response.data.map(
          (n: any) => {
            const actionDataObj = n.actionData as Record<string, any> | null;
            const senderName =
              n.sender?.displayName ||
              n.sender?.username ||
              actionDataObj?.senderName;
            const rawAvatar = n.sender?.avatar || actionDataObj?.senderAvatar;
            const avatar = transformUrl(rawAvatar);

            return {
              id: n.id,
              type: notificationTypeMap[n.type] || "system",
              title: n.title,
              message: n.message,
              timestamp: new Date(n.createdAt),
              isRead: n.isRead,
              sender:
                n.senderId && senderName
                  ? {
                      id: n.senderId,
                      name: senderName,
                      initials: senderName.substring(0, 2).toUpperCase(),
                      avatar,
                    }
                  : undefined,
              actionData: n.actionData,
              actionTaken: n.actionTaken || null,
            };
          }
        );

        setNotifications(transformedNotifications);
      }
    } catch (error) {
      // Silent fail for background fetch
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      setChatsLoading(true);
      const response = await messageService.getConversations();
      if (response.success && response.data) {
        const transformed = response.data.map(transformApiConversation);
        setConversations(transformed);
      }
    } catch (error) {
      // Silent fail for background fetch
    } finally {
      setChatsLoading(false);
    }
  }, []);

  // ============================================
  // INITIAL FETCH - Load data on mount
  // ============================================

  useEffect(() => {
    if (currentUserId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      loadNotifications();
      loadConversations();
    }
  }, [currentUserId, loadNotifications, loadConversations]);

  // ============================================
  // SOCKET RECONNECT - Refetch on reconnect
  // ============================================

  useEffect(() => {
    const unsubscribe = socketService.onConnect(() => {
      if (currentUserId) {
        loadNotifications();
        loadConversations();
      }
    });
    return unsubscribe;
  }, [currentUserId, loadNotifications, loadConversations]);

  // ============================================
  // SOCKET LISTENERS - Always active
  // ============================================

  // Listen for real-time notification updates (actionTaken changes)
  useEffect(() => {
    const unsubscribe = socketService.onNotificationUpdate((data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.id ? { ...n, actionTaken: data.actionTaken } : n
        )
      );
    });

    return unsubscribe;
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const unsubscribe = socketService.onNotification((data) => {
      const notificationType = notificationTypeMap[data.type] || "system";

      const senderData = data.sender;
      const actionData = data.actionData as Record<string, any> | null;
      const senderName =
        senderData?.displayName ||
        senderData?.username ||
        actionData?.senderName ||
        data.senderName;
      const rawAvatar = senderData?.avatar || actionData?.senderAvatar;
      const senderAvatar = transformUrl(rawAvatar);

      const newNotification: Notification = {
        id: data.id,
        type: notificationType,
        title: data.title,
        message: data.message,
        timestamp: new Date(data.createdAt),
        isRead: false,
        sender:
          data.senderId && senderName
            ? {
                id: data.senderId,
                name: senderName,
                initials: senderName.substring(0, 2).toUpperCase(),
                avatar: senderAvatar,
              }
            : undefined,
        actionData: data.actionData as Notification["actionData"],
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotification.id)) {
          return prev;
        }
        return [newNotification, ...prev];
      });

      if (!toastedNotificationIds.has(data.id)) {
        toastedNotificationIds.add(data.id);
        const bannerName = senderName || data.title;
        showInAppBanner({
          senderName: bannerName,
          senderAvatar: senderAvatar,
          senderInitials: bannerName.substring(0, 2).toUpperCase(),
          message: data.message || data.title,
          type: "notification",
        });
        playNotificationSound();
        setTimeout(() => toastedNotificationIds.delete(data.id), 30000);
      }
    });

    return unsubscribe;
  }, [toast, playNotificationSound, showInAppBanner]);

  // Listen for real-time direct messages
  useEffect(() => {
    const unsub = socketService.onDirectMessage((dm) => {
      if (dm.senderId === currentUserId) return;

      const activeConv = activeConversationRef.current;
      const isChatOpen =
        chatDetailsVisibleRef.current && activeConv?.otherId === dm.senderId;

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
          isRead: isChatOpen,
          status: "delivered",
          ...(dm.type === "ROOM_INVITE" && dm.roomCode
            ? {
                roomInvite: {
                  roomCode: dm.roomCode,
                  packName: dm.roomTitle || "Game Room",
                  packId: "",
                  hostId: dm.senderId,
                  hostName: dm.senderName,
                  isActive: true,
                  currentPlayers: 1,
                  maxPlayers: 10,
                },
              }
            : {}),
        };
        setActiveMessages((prev) => {
          if (prev.some((m) => m.id === dm.id)) return prev;
          return [...prev, newMsg];
        });
        if (isChatOpen) {
          messageService.markConversationAsRead(dm.senderId);
        }
      }

      // Show banner + play sound when chat is not actively open
      if (!isChatOpen) {
        showInAppBanner({
          senderName: dm.senderName,
          senderAvatar: dm.senderAvatar || undefined,
          senderInitials: dm.senderName.substring(0, 2).toUpperCase(),
          message: dm.text,
          type: "message",
        });
        playMessageSound();
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
                  unreadCount: isChatOpen
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
          participants: [
            {
              id: dm.senderId,
              name: dm.senderName,
              initials: dm.senderName.substring(0, 2).toUpperCase(),
              avatar: dm.senderAvatar || undefined,
            },
          ],
          lastMessage: {
            text: dm.text,
            timestamp: new Date(dm.timestamp),
            senderId: dm.senderId,
          },
          unreadCount: isChatOpen ? 0 : 1,
        };
        return [newConv, ...prev];
      });
    });

    return unsub;
  }, [currentUserId, playMessageSound, showInAppBanner]);

  // ============================================
  // Notification Handlers
  // ============================================

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );

      notificationService.markAsRead(notification.id).catch(() => {});

      if (
        notification.type === "room_invite" &&
        notification.actionData?.type === "room_invite"
      ) {
        const actionData = notification.actionData;
        setNotificationsVisible(false);
        setTimeout(() => {
          navigationRef.current?.navigate(
            "JoinRoom",
            buildRoomDataFromNotification(actionData)
          );
        }, UI_TIMING.MODAL_TRANSITION_DELAY);
      }
    },
    [navigationRef]
  );

  const handleNotificationAction = useCallback(
    async (notification: Notification, action: NotificationAction) => {
      if (
        action === "join" &&
        notification.actionData?.type === "room_invite"
      ) {
        // Optimistically mark as joined
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, actionTaken: "joined" } : n
          )
        );
        // Persist to backend (fire-and-forget)
        notificationService.resolveAction(notification.id, "joined").catch(() => {});

        const actionData = notification.actionData;
        setNotificationsVisible(false);
        setTimeout(() => {
          navigationRef.current?.navigate(
            "JoinRoom",
            buildRoomDataFromNotification(actionData)
          );
        }, UI_TIMING.MODAL_TRANSITION_DELAY);
      } else if (notification.type === "friend_request") {
        const friendshipId = notification.actionData?.type === "friend_request" ? notification.actionData.friendshipId : undefined;
        const actionTakenValue = action === "accept" ? "accepted" : "declined";

        // Optimistically update actionTaken
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, actionTaken: actionTakenValue }
              : n
          )
        );

        const handleError = (error: unknown) => {
          const errorMessage = getErrorMessage(error);
          // Revert optimistic update on error
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id
                ? { ...n, actionTaken: null }
                : n
            )
          );
          if (errorMessage.includes("not found")) {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== notification.id)
            );
            toast.info("This request is no longer available");
          } else {
            toast.error(errorMessage);
          }
        };

        if (!friendshipId) {
          const senderId =
            (notification.actionData?.type === "friend_request" ? notification.actionData.senderId : undefined) || notification.sender?.id;
          if (!senderId) {
            toast.error("Unable to process this request");
            setNotifications((prev) =>
              prev.filter((n) => n.id !== notification.id)
            );
            return;
          }

          try {
            const statusResponse =
              await friendsService.getFriendshipStatus(senderId);
            if (
              statusResponse.success &&
              statusResponse.data?.friendshipId
            ) {
              const fId = statusResponse.data.friendshipId;
              if (action === "accept") {
                const response =
                  await friendsService.acceptFriendRequest(fId);
                if (response.success) {
                  toast.success("Friend request accepted!");
                }
              } else if (action === "decline") {
                await friendsService.declineFriendRequest(fId);
              }
            } else {
              setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
              );
              toast.info("This request is no longer available");
            }
          } catch (error) {
            handleError(error);
          }
          return;
        }

        try {
          if (action === "accept") {
            const response =
              await friendsService.acceptFriendRequest(friendshipId);
            if (response.success) {
              toast.success("Friend request accepted!");
            }
          } else if (action === "decline") {
            await friendsService.declineFriendRequest(friendshipId);
          }
        } catch (error) {
          handleError(error);
        }
      }
    },
    [navigationRef, toast]
  );

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response =
          await notificationService.deleteNotification(notificationId);
        if (response.success) {
          setNotifications((prev) =>
            prev.filter((n) => n.id !== notificationId)
          );
        }
      } catch (error) {
        // Silent fail
      }
    },
    []
  );

  const handleClearReadNotifications = useCallback(async () => {
    try {
      const response = await notificationService.deleteReadNotifications();
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  // ============================================
  // Conversation Handlers
  // ============================================

  const loadMessagesForConversation = useCallback(
    async (conversation: Conversation) => {
      try {
        const response = await messageService.getConversationMessages(
          conversation.otherId,
          50
        );
        if (response.success && response.data) {
          const messages: DirectMessage[] = response.data.messages.map(
            (msg) => {
              const senderName =
                msg.sender?.displayName || msg.sender?.username || "Unknown";
              const meta = msg.metadata as {
                roomCode?: string;
                roomTitle?: string;
              } | null;
              const isInvite = msg.messageType === "ROOM_INVITE";

              return {
                id: msg.id,
                conversationId: conversation.id,
                senderId: msg.senderId,
                senderName,
                senderInitials: senderName.substring(0, 2).toUpperCase(),
                type: isInvite
                  ? ("room_invite" as const)
                  : ("text" as const),
                text: msg.text,
                timestamp: new Date(msg.createdAt),
                isRead: msg.isRead,
                status: "sent" as const,
                ...(isInvite && meta?.roomCode
                  ? {
                      roomInvite: {
                        roomCode: meta.roomCode,
                        packName: meta.roomTitle || "Game Room",
                        packId: "",
                        hostId: msg.senderId,
                        hostName: senderName,
                        isActive: (msg as any).roomStatus?.isActive ?? false,
                        currentPlayers: (msg as any).roomStatus?.currentPlayers ?? 0,
                        maxPlayers: (msg as any).roomStatus?.maxPlayers ?? 0,
                        expiredReason: (msg as any).roomStatus?.expiredReason ?? "deleted",
                      },
                    }
                  : {}),
              };
            }
          );
          setActiveMessages(messages);

          await messageService.markConversationAsRead(conversation.otherId);

          setConversations((prev) =>
            prev.map((c) =>
              c.otherId === conversation.otherId
                ? { ...c, unreadCount: 0 }
                : c
            )
          );
        }
      } catch (error) {
        // Silent fail
      }
    },
    []
  );

  const handleConversationPress = useCallback(
    async (conversation: Conversation) => {
      setChatsListVisible(false);
      setActiveConversation(conversation);
      setActiveMessages([]);
      setChatDetailsVisible(true);
      await loadMessagesForConversation(conversation);
    },
    [loadMessagesForConversation]
  );

  const handleChatDetailsBack = useCallback(() => {
    setChatDetailsVisible(false);
    setTimeout(() => {
      setActiveConversation(null);
      setActiveMessages([]);
      setChatsListVisible(true);
    }, UI_TIMING.MODAL_TRANSITION_DELAY);
  }, []);

  // Ref to avoid stale closure over conversations in openDirectChat
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const openDirectChat = useCallback(
    async (friend: {
      id: string;
      name: string;
      initials: string;
      avatar?: string;
    }) => {
      const existing = conversationsRef.current.find((c) => c.otherId === friend.id);
      const conversation: Conversation = existing || {
        id: friend.id,
        otherId: friend.id,
        participants: [
          {
            id: friend.id,
            name: friend.name,
            initials: friend.initials,
            avatar: friend.avatar,
          },
        ],
        lastMessage: { text: "", timestamp: new Date(), senderId: "" },
        unreadCount: 0,
      };

      setActiveConversation(conversation);
      setActiveMessages([]);
      setChatDetailsVisible(true);
      await loadMessagesForConversation(conversation);
    },
    [loadMessagesForConversation]
  );

  // ============================================
  // Message Handlers
  // ============================================

  const handleSendDirectMessage = useCallback(
    async (text: string) => {
      if (!activeConversation || !currentUserId) return;

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
        const response = await messageService.sendMessage(
          activeConversation.otherId,
          text
        );
        if (response.success && response.data) {
          setActiveMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId
                ? { ...msg, id: response.data!.id, status: "sent" as const }
                : msg
            )
          );

          setConversations((prev) => {
            const exists = prev.some(
              (c) => c.otherId === activeConversation.otherId
            );
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
            return [
              {
                ...activeConversation,
                lastMessage: {
                  text,
                  timestamp: new Date(),
                  senderId: currentUserId,
                },
              },
              ...prev,
            ];
          });
        }
      } catch (error) {
        setActiveMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId
              ? { ...msg, status: "failed" as const }
              : msg
          )
        );
        toast.error("Failed to send message");
      }
    },
    [activeConversation, currentUserId, toast]
  );

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.success) {
        setActiveMessages((prev) =>
          prev.filter((m) => m.id !== messageId)
        );
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  const handleJoinRoomFromChat = useCallback(
    (invite: RoomInviteData) => {
      setChatDetailsVisible(false);
      setTimeout(() => {
        navigationRef.current?.navigate(
          "JoinRoom",
          buildRoomDataFromChatInvite(invite)
        );
      }, UI_TIMING.MODAL_TRANSITION_DELAY);
    },
    [navigationRef]
  );

  // ============================================
  // Modal Actions
  // ============================================

  const openNotifications = useCallback(() => {
    setNotificationsVisible(true);
    loadNotifications();
  }, [loadNotifications]);

  const openChatsList = useCallback(() => {
    setChatsListVisible(true);
    loadConversations();
  }, [loadConversations]);

  const closeAllModals = useCallback(() => {
    setNotificationsVisible(false);
    setChatsListVisible(false);
    setChatDetailsVisible(false);
    setActiveConversation(null);
    setActiveMessages([]);
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const contextValue = useMemo<UseMessagingReturn>(
    () => ({
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

      conversations,
      unreadMessageCount,
      chatsListVisible,
      chatsLoading,
      setChatsListVisible,
      handleConversationPress,

      chatDetailsVisible,
      activeConversation,
      activeMessages,
      setChatDetailsVisible,
      handleSendDirectMessage,
      handleDeleteMessage,
      handleChatDetailsBack,
      handleJoinRoomFromChat,

      openDirectChat,
      currentUserId,

      openNotifications,
      openChatsList,
      closeAllModals,
    }),
    [
      notifications,
      unreadNotificationCount,
      notificationsVisible,
      notificationsLoading,
      handleNotificationPress,
      handleNotificationAction,
      handleMarkAllNotificationsRead,
      handleDeleteNotification,
      handleClearReadNotifications,
      conversations,
      unreadMessageCount,
      chatsListVisible,
      chatsLoading,
      handleConversationPress,
      chatDetailsVisible,
      activeConversation,
      activeMessages,
      handleSendDirectMessage,
      handleDeleteMessage,
      handleChatDetailsBack,
      handleJoinRoomFromChat,
      openDirectChat,
      currentUserId,
      openNotifications,
      openChatsList,
      closeAllModals,
    ]
  );

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
      {inAppBanner && (
        <InAppNotificationBanner
          {...inAppBanner}
          onDismiss={hideInAppBanner}
        />
      )}
    </MessagingContext.Provider>
  );
}

export function useMessaging(): UseMessagingReturn {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}
