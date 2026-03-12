/**
 * Message Service - Re-export barrel for backwards compatibility
 * DM operations are in dmService.ts
 * Room chat operations are in roomChatService.ts
 */

import dmService from './dmService';
import roomChatService from './roomChatService';

// Compose a unified facade that preserves the original API surface
const messageService = {
  // DM methods
  getConversations: dmService.getConversations.bind(dmService),
  getConversationMessages: dmService.getConversationMessages.bind(dmService),
  sendDirectMessage: dmService.sendDirectMessage.bind(dmService),
  sendRoomInvite: dmService.sendRoomInvite.bind(dmService),
  markAsRead: dmService.markAsRead.bind(dmService),
  markConversationAsRead: dmService.markConversationAsRead.bind(dmService),
  getUnreadCount: dmService.getUnreadCount.bind(dmService),
  deleteMessage: dmService.deleteMessage.bind(dmService),
  // Room chat methods
  getRoomMessages: roomChatService.getRoomMessages.bind(roomChatService),
};

export default messageService;
