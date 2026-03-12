/**
 * Custom hooks exports
 */

export { useAuth } from "@/contexts/AuthContext";

export {
  useMessaging,
  type UseMessagingReturn,
} from "./useMessaging";

// useFriends is a thin wrapper — prefer useFriendsContext() from @/contexts
export {
  useFriends,
  findOrCreateConversationForFriend,
  type UseFriendsReturn,
} from "./useFriends";

export {
  usePacks,
  type UsePacksReturn,
} from "./usePacks";

export { useRoomPresence } from "./useRoomPresence";

export { useSound } from "./useSound";
