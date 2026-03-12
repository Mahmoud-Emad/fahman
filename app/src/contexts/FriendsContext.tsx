/**
 * FriendsContext - Global friends state management
 * Provides friend lists, online status, friend requests, and related actions.
 * Always mounted while authenticated so socket listeners register once
 * and state persists across navigation.
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
import type { Friend, FriendRequest } from "@/components/friends/types";
import type { Conversation, DirectMessage } from "@/components/messaging/types";
import {
  friendsService,
  type FriendWithStatus,
  type FriendRequest as ApiFriendRequest,
} from "@/services/friendsService";
import { socketService } from "@/services/socketService";
import { transformUrl } from "@/utils/transformUrl";
import { UI_TIMING } from "@/constants";
import { getErrorMessage } from "@/utils/errorUtils";
import { useToast } from "./ToastContext";

// ============================================
// Types
// ============================================

export interface UseFriendsReturn {
  // Friends data
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onlineFriendsCount: number;

  // Modal state
  friendsListVisible: boolean;
  friendsLoading: boolean;
  setFriendsListVisible: (visible: boolean) => void;

  // Add Friend modal state
  addFriendVisible: boolean;
  setAddFriendVisible: (visible: boolean) => void;

  // Close all modals (used when navigating to profile from AddFriendModal)
  closeAllModals: () => void;

  // Handlers
  handleFriendPress: (friend: Friend) => void;
  handleMessageFriend: (friend: Friend) => void;
  handleInviteFriend: (friend: Friend) => void;
  handleAcceptFriendRequest: (request: FriendRequest) => void;
  handleDeclineFriendRequest: (request: FriendRequest) => void;
  handleCancelFriendRequest: (request: FriendRequest) => void;
  handleAddFriend: () => void;
  handleFriendAdded: () => void;

  // Chat integration (for opening chat from friend press)
  pendingChatFriend: Friend | null;
  clearPendingChatFriend: () => void;

  // Play integration (for creating game with friend)
  playFriend: Friend | null;
  setPlayFriend: (friend: Friend | null) => void;

  // Actions
  openFriendsList: () => void;
  refreshFriends: () => Promise<void>;

  // Error state
  error: string | null;
}

// ============================================
// Helpers
// ============================================

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function transformFriend(apiFriend: FriendWithStatus, onlineIds: Set<string>): Friend {
  const isOnline = onlineIds.has(apiFriend.id);
  return {
    id: apiFriend.id,
    name: apiFriend.displayName || apiFriend.username,
    username: apiFriend.username,
    initials: getInitials(apiFriend.displayName || apiFriend.username),
    avatar: transformUrl(apiFriend.avatar) || undefined,
    status: isOnline ? "online" : "offline",
    stats: {
      gamesPlayed: 0,
      wins: 0,
    },
  };
}

function transformFriendRequest(apiRequest: ApiFriendRequest): FriendRequest {
  return {
    id: apiRequest.id,
    from: {
      id: apiRequest.user.id,
      name: apiRequest.user.displayName || apiRequest.user.username,
      username: apiRequest.user.username,
      initials: getInitials(apiRequest.user.displayName || apiRequest.user.username),
      avatar: transformUrl(apiRequest.user.avatar) || undefined,
    },
    timestamp: new Date(apiRequest.requestedAt),
  };
}

/**
 * Helper to find or create conversation for a friend
 */
export function findOrCreateConversationForFriend(
  friend: Friend,
  conversations: Conversation[]
): { conversation: Conversation; messages: DirectMessage[] } {
  const existingConversation = conversations.find((c) =>
    c.participants.some((p) => p.id === friend.id)
  );

  if (existingConversation) {
    return {
      conversation: existingConversation,
      messages: [],
    };
  }

  const newConversation: Conversation = {
    id: `temp-${friend.id}`,
    otherId: friend.id,
    participants: [
      {
        id: friend.id,
        name: friend.name,
        initials: friend.initials,
        isOnline: friend.status === "online",
      },
    ],
    lastMessage: { text: "", timestamp: new Date(), senderId: "" },
    unreadCount: 0,
  };

  return {
    conversation: newConversation,
    messages: [],
  };
}

// ============================================
// Context
// ============================================

const FriendsContext = createContext<UseFriendsReturn | undefined>(undefined);

interface FriendsProviderProps {
  children: ReactNode;
  navigationRef: React.RefObject<any>;
}

export function FriendsProvider({ children, navigationRef }: FriendsProviderProps) {
  const toast = useToast();

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());
  const onlineFriendIdsRef = useRef<Set<string>>(onlineFriendIds);
  const [error, setError] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    onlineFriendIdsRef.current = onlineFriendIds;
  }, [onlineFriendIds]);

  // Modal state
  const [friendsListVisible, setFriendsListVisible] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [addFriendVisible, setAddFriendVisible] = useState(false);

  // Ref to prevent double-opening (synchronous check)
  const isOpeningRef = useRef(false);

  // Pending chat friend (for integration with messaging)
  const [pendingChatFriend, setPendingChatFriend] = useState<Friend | null>(null);

  // Play friend state for CreateGameDialog
  const [playFriend, setPlayFriend] = useState<Friend | null>(null);

  // Computed values
  const onlineFriendsCount = friends.filter(
    (f) => f.status === "online" || f.status === "in_game"
  ).length;

  // ============================================
  // API Fetch
  // ============================================

  const fetchFriends = useCallback(async () => {
    try {
      setError(null);
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getFriendRequests(),
        friendsService.getSentRequests(),
      ]);

      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data.map((f) => transformFriend(f, onlineFriendIdsRef.current)));
      }

      if (requestsRes.success && requestsRes.data) {
        setFriendRequests(requestsRes.data.map(transformFriendRequest));
      }

      if (sentRes.success && sentRes.data) {
        setSentRequests(sentRes.data.map(transformFriendRequest));
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  }, [toast]);

  const refreshFriends = useCallback(async () => {
    setFriendsLoading(true);
    await fetchFriends();
    setFriendsLoading(false);
  }, [fetchFriends]);

  // ============================================
  // Modal Actions
  // ============================================

  const setFriendsListVisibleWrapper = useCallback((visible: boolean) => {
    setFriendsListVisible(visible);
    if (!visible) {
      isOpeningRef.current = false;
    }
  }, []);

  const openFriendsList = useCallback(() => {
    if (isOpeningRef.current || friendsListVisible) return;
    isOpeningRef.current = true;

    setFriendsListVisible(true);
    setFriendsLoading(true);

    setTimeout(async () => {
      await fetchFriends();
      setFriendsLoading(false);
      isOpeningRef.current = false;
      socketService.requestFriendStatuses();
    }, UI_TIMING.MODAL_TRANSITION_DELAY);
  }, [fetchFriends, friendsListVisible]);

  const closeAllModals = useCallback(() => {
    setAddFriendVisible(false);
    setFriendsListVisible(false);
    isOpeningRef.current = false;
  }, []);

  // ============================================
  // Socket Listeners (registered ONCE)
  // ============================================

  useEffect(() => {
    const unsubOnline = socketService.onFriendOnline(({ userId }) => {
      setOnlineFriendIds((prev) => new Set([...prev, userId]));
      setFriends((prev) =>
        prev.map((f) =>
          f.id === userId ? { ...f, status: "online" as const } : f
        )
      );
    });

    const unsubOffline = socketService.onFriendOffline(({ userId }) => {
      setOnlineFriendIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setFriends((prev) =>
        prev.map((f) =>
          f.id === userId ? { ...f, status: "offline" as const } : f
        )
      );
    });

    const unsubStatusList = socketService.onFriendStatusList(({ online }) => {
      setOnlineFriendIds(new Set(online));
      setFriends((prev) =>
        prev.map((f) => ({
          ...f,
          status: online.includes(f.id) ? ("online" as const) : ("offline" as const),
        }))
      );
    });

    const unsubConnect = socketService.onConnect(() => {
      socketService.requestFriendStatuses();
    });

    if (socketService.isConnected) {
      socketService.requestFriendStatuses();
    }

    return () => {
      unsubOnline();
      unsubOffline();
      unsubStatusList();
      unsubConnect();
    };
  }, []);

  // Listen for friend request / accepted notifications to auto-refresh lists
  useEffect(() => {
    const unsub = socketService.onNotification((data) => {
      if (data.type === "FRIEND_REQUEST") {
        friendsService.getFriendRequests().then((res) => {
          if (res.success && res.data) {
            setFriendRequests(res.data.map(transformFriendRequest));
          }
        }).catch(() => {});
      } else if (data.type === "FRIEND_ACCEPTED") {
        friendsService.getFriends().then((res) => {
          if (res.success && res.data) {
            setFriends(res.data.map((f) => transformFriend(f, onlineFriendIdsRef.current)));
          }
        }).catch(() => {});
        friendsService.getSentRequests().then((res) => {
          if (res.success && res.data) {
            setSentRequests(res.data.map(transformFriendRequest));
          }
        }).catch(() => {});
      }
    });
    return unsub;
  }, []);

  // ============================================
  // Friend Action Handlers
  // ============================================

  const clearPendingChatFriend = useCallback(() => {
    setPendingChatFriend(null);
  }, []);

  const handleFriendPress = useCallback((friend: Friend) => {
    setFriendsListVisibleWrapper(false);
    setTimeout(() => {
      navigationRef.current?.navigate("UserProfile", { userId: friend.id });
    }, UI_TIMING.MODAL_TRANSITION_DELAY);
  }, [setFriendsListVisibleWrapper, navigationRef]);

  const handleMessageFriend = useCallback(
    (friend: Friend) => {
      setFriendsListVisibleWrapper(false);
      setPendingChatFriend(friend);
    },
    [setFriendsListVisibleWrapper]
  );

  const handleInviteFriend = useCallback((friend: Friend) => {
    setFriendsListVisibleWrapper(false);
    setTimeout(() => setPlayFriend(friend), UI_TIMING.MODAL_TRANSITION_DELAY);
  }, [setFriendsListVisibleWrapper]);

  const handleAcceptFriendRequest = useCallback(async (request: FriendRequest) => {
    try {
      const response = await friendsService.acceptFriendRequest(request.id);
      if (response.success) {
        const newFriend: Friend = {
          id: request.from.id,
          name: request.from.name,
          username: request.from.username,
          initials: request.from.initials,
          avatar: request.from.avatar,
          status: "offline",
          stats: { gamesPlayed: 0, wins: 0 },
        };
        setFriends((prev) => [newFriend, ...prev]);
        setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  }, [toast]);

  const handleDeclineFriendRequest = useCallback(async (request: FriendRequest) => {
    try {
      const response = await friendsService.declineFriendRequest(request.id);
      if (response.success) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  }, [toast]);

  const handleCancelFriendRequest = useCallback(async (request: FriendRequest) => {
    try {
      const response = await friendsService.cancelFriendRequest(request.id);
      if (response.success) {
        setSentRequests((prev) => prev.filter((r) => r.id !== request.id));
      }
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    }
  }, [toast]);

  const handleAddFriend = useCallback(() => {
    setAddFriendVisible(true);
  }, []);

  const handleFriendAdded = useCallback(() => {
    friendsService.getSentRequests().then((res) => {
      if (res.success && res.data) {
        setSentRequests(res.data.map(transformFriendRequest));
      }
    }).catch(() => {});
  }, []);

  // ============================================
  // Context Value
  // ============================================

  const contextValue = useMemo<UseFriendsReturn>(
    () => ({
      friends,
      friendRequests,
      sentRequests,
      onlineFriendsCount,

      friendsListVisible,
      friendsLoading,
      setFriendsListVisible: setFriendsListVisibleWrapper,

      addFriendVisible,
      setAddFriendVisible,

      closeAllModals,

      handleFriendPress,
      handleMessageFriend,
      handleInviteFriend,
      handleAcceptFriendRequest,
      handleDeclineFriendRequest,
      handleCancelFriendRequest,
      handleAddFriend,
      handleFriendAdded,

      pendingChatFriend,
      clearPendingChatFriend,

      playFriend,
      setPlayFriend,

      openFriendsList,
      refreshFriends,

      error,
    }),
    [
      friends,
      friendRequests,
      sentRequests,
      onlineFriendsCount,
      friendsListVisible,
      friendsLoading,
      setFriendsListVisibleWrapper,
      addFriendVisible,
      closeAllModals,
      handleFriendPress,
      handleMessageFriend,
      handleInviteFriend,
      handleAcceptFriendRequest,
      handleDeclineFriendRequest,
      handleCancelFriendRequest,
      handleAddFriend,
      handleFriendAdded,
      pendingChatFriend,
      clearPendingChatFriend,
      playFriend,
      openFriendsList,
      refreshFriends,
      error,
    ]
  );

  return (
    <FriendsContext.Provider value={contextValue}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriendsContext(): UseFriendsReturn {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error("useFriendsContext must be used within a FriendsProvider");
  }
  return context;
}
