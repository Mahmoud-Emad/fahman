/**
 * useRoomFilters - Hook for room filtering state and logic
 */
import { useState, useCallback } from "react";
import type { RoomData } from "../types";

export type PrivacyFilter = "all" | "public" | "private";
export type StatusFilter = "all" | "waiting" | "playing" | "finished";

interface UseRoomFiltersReturn {
  // Filter state
  privacyFilter: PrivacyFilter;
  statusFilter: StatusFilter;
  showMyRoomsOnly: boolean;

  // Filter setters
  setPrivacyFilter: (filter: PrivacyFilter) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  setShowMyRoomsOnly: (show: boolean) => void;

  // Filter function
  filterRooms: (rooms: RoomData[]) => RoomData[];

  // Reset all filters
  resetFilters: () => void;
}

/**
 * Hook for managing room filter state and logic
 */
export function useRoomFilters(): UseRoomFiltersReturn {
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showMyRoomsOnly, setShowMyRoomsOnly] = useState<boolean>(false);

  const filterRooms = useCallback(
    (roomsList: RoomData[]) => {
      return roomsList.filter((room) => {
        if (privacyFilter !== "all" && room.type !== privacyFilter) return false;
        if (statusFilter !== "all" && room.status !== statusFilter) return false;
        return true;
      });
    },
    [privacyFilter, statusFilter]
  );

  const resetFilters = useCallback(() => {
    setPrivacyFilter("all");
    setStatusFilter("all");
    setShowMyRoomsOnly(false);
  }, []);

  return {
    privacyFilter,
    statusFilter,
    showMyRoomsOnly,
    setPrivacyFilter,
    setStatusFilter,
    setShowMyRoomsOnly,
    filterRooms,
    resetFilters,
  };
}
