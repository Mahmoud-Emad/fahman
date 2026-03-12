/**
 * useFriends - Thin wrapper around FriendsContext for backwards compatibility
 *
 * All state and socket logic now lives in FriendsContext.
 * Use `useFriendsContext()` from `@/contexts` directly in new code.
 */
import { useFriendsContext, type UseFriendsReturn } from "@/contexts/FriendsContext";

export type { UseFriendsReturn };
export { findOrCreateConversationForFriend } from "@/contexts/FriendsContext";

/**
 * @deprecated Use `useFriendsContext()` from `@/contexts` instead.
 */
export function useFriends(): UseFriendsReturn {
  return useFriendsContext();
}
