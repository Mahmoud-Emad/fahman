/**
 * useFriends - Centralized hook for friends management
 * Handles friends list, friend requests, and related actions
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { Friend, FriendRequest } from "@/components/friends/types";
import type { Conversation, DirectMessage } from "@/components/messaging/types";
import { friendsService, type FriendWithStatus, type FriendRequest as ApiFriendRequest } from "@/services/friendsService";
import { socketService } from "@/services/socketService";
import { transformUrl } from "@/utils/transformUrl";
import type { RootStackParamList } from "../../App";

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

/**
 * Transform API friend to UI friend type
 */
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

/**
 * Transform API friend request to UI friend request type
 */
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
 * Get initials from a name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Hook for managing friends state across screens
 *
 * @example
 * ```tsx
 * const {
 *   friends,
 *   friendRequests,
 *   friendsListVisible,
 *   handleFriendPress,
 *   handleAcceptFriendRequest,
 * } = useFriends();
 * ```
 */
export function useFriends(): UseFriendsReturn {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [friendsListVisible, setFriendsListVisible] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [addFriendVisible, setAddFriendVisible] = useState(false);

  // Ref to prevent double-opening (synchronous check)
  const isOpeningRef = useRef(false);

  // Pending chat friend (for integration with messaging)
  const [pendingChatFriend, setPendingChatFriend] = useState<Friend | null>(null);

  // Computed values
  const onlineFriendsCount = friends.filter(
    (f) => f.status === "online" || f.status === "in_game"
  ).length;

  // Fetch friends data from API
  const fetchFriends = useCallback(async () => {
    try {
      setError(null);
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getFriendRequests(),
        friendsService.getSentRequests(),
      ]);

      if (friendsRes.success && friendsRes.data) {
        setFriends(friendsRes.data.map((f) => transformFriend(f, onlineFriendIds)));
      }

      if (requestsRes.success && requestsRes.data) {
        setFriendRequests(requestsRes.data.map(transformFriendRequest));
      }

      if (sentRes.success && sentRes.data) {
        setSentRequests(sentRes.data.map(transformFriendRequest));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch friends");
      console.error("Error fetching friends:", err);
    }
  }, [onlineFriendIds]);

  // Refresh friends data
  const refreshFriends = useCallback(async () => {
    setFriendsLoading(true);
    await fetchFriends();
    setFriendsLoading(false);
  }, [fetchFriends]);

  // Open friends list with API fetch
  const openFriendsList = useCallback(() => {
    // Synchronous ref check prevents race conditions from async state updates
    if (isOpeningRef.current || friendsListVisible) return;
    isOpeningRef.current = true;

    // First open the modal (start animation)
    setFriendsListVisible(true);
    setFriendsLoading(true);

    // Wait for animation to complete before fetching data
    // This prevents re-renders during animation that cause "struggling"
    setTimeout(async () => {
      await fetchFriends();
      setFriendsLoading(false);
      isOpeningRef.current = false;
      // Request friend statuses from socket
      socketService.requestFriendStatuses();
    }, 300);
  }, [fetchFriends, friendsListVisible]);

  // Setup socket listeners for friend online status
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

    // Auto-request friend statuses when socket connects
    const unsubConnect = socketService.onConnect(() => {
      socketService.requestFriendStatuses();
    });

    // Also request immediately if already connected
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
        // Refresh incoming friend requests
        friendsService.getFriendRequests().then((res) => {
          if (res.success && res.data) {
            setFriendRequests(res.data.map(transformFriendRequest));
          }
        });
      } else if (data.type === "FRIEND_ACCEPTED") {
        // Refresh friends list to include the new friend
        friendsService.getFriends().then((res) => {
          if (res.success && res.data) {
            setFriends(res.data.map((f) => transformFriend(f, onlineFriendIds)));
          }
        });
        // Remove from sent requests
        friendsService.getSentRequests().then((res) => {
          if (res.success && res.data) {
            setSentRequests(res.data.map(transformFriendRequest));
          }
        });
      }
    });
    return unsub;
  }, [onlineFriendIds]);

  // Clear pending chat friend
  const clearPendingChatFriend = useCallback(() => {
    setPendingChatFriend(null);
  }, []);

  // Wrapper for setFriendsListVisible that resets ref when closing
  const setFriendsListVisibleWrapper = useCallback((visible: boolean) => {
    setFriendsListVisible(visible);
    if (!visible) {
      isOpeningRef.current = false;
    }
  }, []);

  // Handle friend press - navigate to user profile
  const handleFriendPress = useCallback((friend: Friend) => {
    setFriendsListVisibleWrapper(false);
    setTimeout(() => {
      navigation.navigate("UserProfile", { userId: friend.id });
    }, 300);
  }, [setFriendsListVisibleWrapper, navigation]);

  // Handle message friend - close friends list and set pending chat friend
  const handleMessageFriend = useCallback(
    (friend: Friend) => {
      setFriendsListVisibleWrapper(false);
      setPendingChatFriend(friend);
    },
    [setFriendsListVisibleWrapper]
  );

  // Play friend state for CreateGameDialog
  const [playFriend, setPlayFriend] = useState<Friend | null>(null);

  // Handle invite friend to game - close friends list, then open create game dialog
  const handleInviteFriend = useCallback((friend: Friend) => {
    setFriendsListVisibleWrapper(false);
    setTimeout(() => setPlayFriend(friend), 300);
  }, [setFriendsListVisibleWrapper]);

  // Handle accept friend request
  const handleAcceptFriendRequest = useCallback(async (request: FriendRequest) => {
    try {
      const response = await friendsService.acceptFriendRequest(request.id);
      if (response.success) {
        // Add to friends list
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
    } catch (err: any) {
      console.error("Error accepting friend request:", err);
      setError(err.message || "Failed to accept friend request");
    }
  }, []);

  // Handle decline friend request
  const handleDeclineFriendRequest = useCallback(async (request: FriendRequest) => {
    try {
      const response = await friendsService.declineFriendRequest(request.id);
      if (response.success) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
      }
    } catch (err: any) {
      console.error("Error declining friend request:", err);
      setError(err.message || "Failed to decline friend request");
    }
  }, []);

  // Handle cancel sent friend request
  const handleCancelFriendRequest = useCallback(async (request: FriendRequest) => {
    try {
      const response = await friendsService.cancelFriendRequest(request.id);
      if (response.success) {
        setSentRequests((prev) => prev.filter((r) => r.id !== request.id));
      }
    } catch (err: any) {
      console.error("Error canceling friend request:", err);
      setError(err.message || "Failed to cancel friend request");
    }
  }, []);

  // Handle add friend button - opens AddFriendModal
  const handleAddFriend = useCallback(() => {
    setAddFriendVisible(true);
  }, []);

  // Close all modals (used when navigating to profile from AddFriendModal)
  const closeAllModals = useCallback(() => {
    setAddFriendVisible(false);
    setFriendsListVisible(false);
    isOpeningRef.current = false;
  }, []);

  // Handle when a friend request is successfully sent
  const handleFriendAdded = useCallback(() => {
    // Refresh sent requests to show the new pending request
    friendsService.getSentRequests().then((res) => {
      if (res.success && res.data) {
        setSentRequests(res.data.map(transformFriendRequest));
      }
    });
  }, []);

  return {
    // Friends data
    friends,
    friendRequests,
    sentRequests,
    onlineFriendsCount,

    // Modal state
    friendsListVisible,
    friendsLoading,
    setFriendsListVisible: setFriendsListVisibleWrapper,

    // Add Friend modal state
    addFriendVisible,
    setAddFriendVisible,

    // Close all modals
    closeAllModals,

    // Handlers
    handleFriendPress,
    handleMessageFriend,
    handleInviteFriend,
    handleAcceptFriendRequest,
    handleDeclineFriendRequest,
    handleCancelFriendRequest,
    handleAddFriend,
    handleFriendAdded,

    // Chat integration
    pendingChatFriend,
    clearPendingChatFriend,

    // Play integration
    playFriend,
    setPlayFriend,

    // Actions
    openFriendsList,
    refreshFriends,

    // Error state
    error,
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
      messages: [], // Messages will be loaded from API
    };
  }

  // Create a temporary conversation for new chat
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
