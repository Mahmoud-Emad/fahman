/**
 * useRoomData - Hook for room data fetching and pagination
 */
import { useState, useRef, useCallback, useEffect } from "react";
import type { RoomData, EventData } from "../types";
import { roomsService, type Room } from "@/services/roomsService";
import { socketService } from "@/services/socketService";
import { PAGINATION } from "@/constants";
import { transformUrl } from "@/utils/transformUrl";

interface UseRoomDataReturn {
  // Data
  events: EventData[];
  rooms: RoomData[];
  exploreRooms: RoomData[];
  myRooms: RoomData[];

  // Loading states
  isLoading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  myRoomsLoading: boolean;

  // Actions
  onRefresh: () => Promise<void>;
  loadMoreRooms: () => Promise<void>;
  handleScrollEnd: (event: any) => void;
  fetchMyRooms: () => Promise<void>;
}

/**
 * Transform API Room to UI RoomData
 */
function transformRoom(room: Room): RoomData {
  return {
    id: room.id,
    title: room.title,
    description: room.description || undefined,
    logo: transformUrl(room.selectedPack?.imageUrl),
    logoInitials: room.title.substring(0, 2).toUpperCase(),
    type: room.isPublic ? "public" : "private",
    users: room.members?.slice(0, 3).map((m) => ({
      id: m.user.id,
      initials: (m.user.displayName || m.user.username).substring(0, 2).toUpperCase(),
      avatar: transformUrl(m.user.avatar),
    })) || [],
    totalUsers: room.currentPlayers,
    questionsCount: 0, // Will be populated when room details are fetched
    currentQuestion: room.currentQuestionIndex,
    status: room.status === "WAITING" ? "waiting" : room.status === "PLAYING" ? "playing" : "finished",
  };
}

/**
 * Hook for managing room data fetching and pagination
 */
export function useRoomData(): UseRoomDataReturn {
  // Data state
  const [events] = useState<EventData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [exploreRooms, setExploreRooms] = useState<RoomData[]>([]);
  const [myRooms, setMyRooms] = useState<RoomData[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myRoomsLoading, setMyRoomsLoading] = useState(false);

  // Pagination ref
  const currentPage = useRef(1);
  const hasMoreRooms = useRef(true);

  /**
   * Fetch popular rooms (top 6 by current players)
   */
  const fetchPopularRooms = async () => {
    try {
      const response = await roomsService.getPopularRooms(6);
      if (response.success && response.data && Array.isArray(response.data)) {
        setRooms(response.data.map(transformRoom));
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Error fetching popular rooms:", error);
      setRooms([]);
    }
  };

  /**
   * Fetch explore rooms (paginated public rooms)
   */
  const fetchExploreRooms = async (page: number = 1, append: boolean = false) => {
    try {
      const response = await roomsService.getPublicRooms({ page, limit: PAGINATION.ROOMS_PER_PAGE });
      if (response.success && response.data) {
        // Handle both array and paginated response formats
        const roomsArray = Array.isArray(response.data)
          ? response.data
          : response.data.rooms || [];
        const transformedRooms = roomsArray.map(transformRoom);
        if (append) {
          setExploreRooms((prev) => [...prev, ...transformedRooms]);
        } else {
          setExploreRooms(transformedRooms);
        }
        // Handle meta if available
        if (response.data.meta) {
          hasMoreRooms.current = response.data.meta.hasNext;
        } else {
          hasMoreRooms.current = false;
        }
      }
    } catch (error) {
      console.error("Error fetching explore rooms:", error);
      if (!append) {
        setExploreRooms([]);
      }
    }
  };

  /**
   * Fetch user's rooms
   */
  const fetchMyRooms = useCallback(async () => {
    setMyRoomsLoading(true);
    try {
      const response = await roomsService.getMyRooms();
      if (response.success && response.data && Array.isArray(response.data)) {
        setMyRooms(response.data.map(transformRoom));
      } else {
        setMyRooms([]);
      }
    } catch (error) {
      console.error("Error fetching my rooms:", error);
      setMyRooms([]);
    } finally {
      setMyRoomsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadRooms = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPopularRooms(),
        fetchExploreRooms(1),
        fetchMyRooms(),
      ]);
      setIsLoading(false);
    };
    loadRooms();
  }, []);

  // Listen for real-time room list updates (player join/leave/room close)
  useEffect(() => {
    const updateRoomInList = (data: { roomId: string; currentPlayers: number; status: string }) => {
      const statusMap: Record<string, RoomData["status"]> = {
        WAITING: "waiting",
        PLAYING: "playing",
        FINISHED: "finished",
        CLOSED: "finished",
      };
      const uiStatus = statusMap[data.status] || "finished";

      const updater = (prev: RoomData[]) => {
        // If room is closed, remove it from the list
        if (data.status === "CLOSED") {
          return prev.filter((r) => r.id !== data.roomId);
        }
        // Otherwise update player count and status
        return prev.map((r) =>
          r.id === data.roomId
            ? { ...r, totalUsers: data.currentPlayers, status: uiStatus }
            : r
        );
      };

      setRooms(updater);
      setExploreRooms(updater);
      setMyRooms(updater);
    };

    const unsub = socketService.onRoomListUpdate(updateRoomInList);
    return unsub;
  }, []);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    currentPage.current = 1;
    hasMoreRooms.current = true;
    await Promise.all([
      fetchPopularRooms(),
      fetchExploreRooms(1),
      fetchMyRooms(),
    ]);
    setRefreshing(false);
  }, [fetchMyRooms]);

  // Load more handler
  const loadMoreRooms = useCallback(async () => {
    if (loadingMore || !hasMoreRooms.current) return;
    setLoadingMore(true);
    currentPage.current += 1;
    await fetchExploreRooms(currentPage.current, true);
    setLoadingMore(false);
  }, [loadingMore]);

  // Scroll end handler for infinite scroll
  const handleScrollEnd = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - PAGINATION.SCROLL_THRESHOLD;
      if (isCloseToBottom && !loadingMore && !refreshing && hasMoreRooms.current) {
        loadMoreRooms();
      }
    },
    [loadMoreRooms, loadingMore, refreshing]
  );

  // Silent refresh — re-fetches all data without showing loading indicators
  const refreshSilently = useCallback(async () => {
    await Promise.all([
      fetchPopularRooms(),
      fetchExploreRooms(1),
      fetchMyRooms(),
    ]);
  }, [fetchMyRooms]);

  return {
    events,
    rooms,
    exploreRooms,
    myRooms,
    isLoading,
    refreshing,
    loadingMore,
    myRoomsLoading,
    onRefresh,
    loadMoreRooms,
    handleScrollEnd,
    fetchMyRooms,
    refreshSilently,
  };
}
