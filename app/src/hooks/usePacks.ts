/**
 * usePacks - Hook for managing pack selection data
 */
import { useState, useCallback } from "react";
import { packsService, type Pack, type PackSelectionResponse } from "@/services/packsService";
import type { PackData } from "@/components/packs/types";
import { useToast } from "@/contexts";
import { transformUrl } from "@/utils/transformUrl";

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
    logoUri: transformUrl(pack.imageUrl) || undefined,
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
  const toast = useToast();
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

        const suggested = systemPacks.map((p) => transformPack(p, false));
        const owned = userPacks.map((p) => transformPack(p, true));

        // Deduplicate popular: exclude packs already in suggested or owned
        const excludeIds = new Set([
          ...suggested.map((p) => p.id),
          ...owned.map((p) => p.id),
        ]);
        const uniquePopular = popular
          .map((p) => transformPack(p, false))
          .filter((p) => !excludeIds.has(p.id));

        setSuggestedPacks(suggested);
        setOwnedPacks(owned);
        setPopularPacks(uniquePopular);
      } else {
        setError(response.message || "Failed to load packs");
      }
    } catch (err: any) {
      const message = err.message || "Failed to load packs";
      setError(message);
      toast.error(message);
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
