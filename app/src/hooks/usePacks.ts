/**
 * usePacks - Hook for managing pack selection data
 */
import { useState, useCallback } from "react";
import { packsService, type Pack, type FreeStorePack } from "@/services/packsService";
import type { PackData } from "@/components/packs/types";
import { useToast } from "@/contexts";
import { getErrorMessage } from "@/utils/errorUtils";
import { transformUrl } from "@/utils/transformUrl";

export interface UsePacksReturn {
  suggestedPacks: PackData[];
  ownedPacks: PackData[];
  popularPacks: PackData[];
  freeStorePacks: PackData[];
  paidStorePacks: PackData[];
  isLoading: boolean;
  error: string | null;
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
    price: 0,
  };
}

/**
 * Transform store pack to UI pack data
 */
function transformStorePack(pack: FreeStorePack, isOwned: boolean = false): PackData {
  return {
    id: pack.id,
    title: pack.name,
    description: pack.description || undefined,
    logoUri: transformUrl(pack.coverUrl) || undefined,
    logoInitials: pack.name.substring(0, 2).toUpperCase(),
    isPublic: true,
    questionsCount: pack.numberOfQuestions,
    createdBy: pack.author,
    isOwned,
    isStorePack: true,
    storePackId: pack.id,
    price: pack.free ? 0 : pack.price,
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
  const [freeStorePacks, setFreeStorePacks] = useState<PackData[]>([]);
  const [paidStorePacks, setPaidStorePacks] = useState<PackData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPacks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await packsService.getPacksForSelection();

      if (response.success && response.data) {
        const {
          systemPacks,
          userPacks,
          popularPacks: popular,
          freeStorePacks: free,
          paidStorePacks: paid,
          ownedStorePacks: ownedStore,
        } = response.data;

        const suggested = systemPacks.map((p) => transformPack(p, false));
        const userOwned = userPacks.map((p) => transformPack(p, true));
        const purchasedStore = (ownedStore || []).map((p) => transformStorePack(p, true));
        const owned = [...userOwned, ...purchasedStore];
        const freeStore = (free || []).map((p) => transformStorePack(p));
        const paidStore = (paid || []).map((p) => transformStorePack(p));

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
        setFreeStorePacks(freeStore);
        setPaidStorePacks(paidStore);
      } else {
        setError(response.message || "Failed to load packs");
      }
    } catch (err) {
      const message = getErrorMessage(err);
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
    freeStorePacks,
    paidStorePacks,
    isLoading,
    error,
    fetchPacks,
    refreshPacks,
  };
}
