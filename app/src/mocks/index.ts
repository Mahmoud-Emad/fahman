/**
 * Centralized mock data exports
 * Import all mock data from this file to avoid duplication
 */

// Rooms
export {
  MOCK_ROOMS,
  MOCK_EVENTS,
  generateExploreRooms,
  shuffleArray,
} from "./rooms";

// Packs
export {
  MOCK_SUGGESTED_PACKS,
  MOCK_OWNED_PACKS,
  MOCK_POPULAR_PACKS,
  MOCK_ALL_PACKS,
} from "./packs";

// Friends
export {
  MOCK_FRIENDS,
  MOCK_FRIEND_REQUESTS,
  getOnlineFriendsCount,
} from "./friends";

// Messaging
export {
  CURRENT_USER_ID,
  MOCK_NOTIFICATIONS,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES_CONV1,
  MOCK_MESSAGES_CONV2,
  getMessagesForConversation,
  getUnreadNotificationCount,
  getUnreadMessageCount,
} from "./messaging";
