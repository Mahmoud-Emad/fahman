/**
 * usePacks - Hook for managing pack selection data
 */
import { useState, useCallback } from "react";
import { packsService, type Pack, type PackSelectionResponse } from "@/services/packsService";
import type { PackData } from "@/components/packs/types";
import { SOCKET_URL } from "@/config/env";

/**
 * Transform server URL to use correct base URL for current platform
 */
function transformImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // Replace localhost URLs with the correct SOCKET_URL
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, SOCKET_URL);
}

export interface UsePacksReturn {
  // Pack data for selection modal
  suggestedPacks: PackData[];
  ownedPacks: PackData[];
  popularPacks: PackData[];

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPacks: () => Promise<void>;
  refreshPacks: () => Promise<void>;
}

/**
 * Transform API pack to UI pack data
 */
function transformPack(pack: Pack, isOwned: boolean = false): PackData {
  return {
    id: pack.id,
    title: pack.title,
    description: pack.description || undefined,
    logoUri: transformImageUrl(pack.imageUrl),
    logoInitials: pack.title.substring(0, 2).toUpperCase(),
    isPublic: pack.visibility === "PUBLIC",
    questionsCount: pack._count?.questions || 0,
    createdBy: pack.creator?.username,
    isOwned,
  };
}

/**
 * Hook for managing pack selection state
 */
export function usePacks(): UsePacksReturn {
  const [suggestedPacks, setSuggestedPacks] = useState<PackData[]>([]);
  const [ownedPacks, setOwnedPacks] = useState<PackData[]>([]);
  const [popularPacks, setPopularPacks] = useState<PackData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await packsService.getPacksForSelection();

      if (response.success && response.data) {
        const { systemPacks, userPacks, popularPacks: popular } = response.data;

        // Transform system packs to suggested
        setSuggestedPacks(systemPacks.map((p) => transformPack(p, false)));

        // Transform user packs to owned
        setOwnedPacks(userPacks.map((p) => transformPack(p, true)));

        // Transform popular packs
        setPopularPacks(popular.map((p) => transformPack(p, false)));
      } else {
        setError(response.message || "Failed to load packs");
      }
    } catch (err: any) {
      console.error("Error fetching packs:", err);
      setError(err.message || "Failed to load packs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPacks = useCallback(async () => {
    await fetchPacks();
  }, [fetchPacks]);

  return {
    suggestedPacks,
    ownedPacks,
    popularPacks,
    isLoading,
    error,
    fetchPacks,
    refreshPacks,
  };
}
