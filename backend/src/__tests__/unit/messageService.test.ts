/**
 * Message Service Unit Tests
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { AppError } from '../../shared/utils/errors';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const userAlice = { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null, isActive: true };
const userBob = { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png', isActive: true };
const userInactive = { id: 'user-3', username: 'inactive', displayName: 'Inactive', avatar: null, isActive: false };

const now = new Date('2026-01-15T12:00:00Z');
const earlier = new Date('2026-01-15T11:00:00Z');
const earliest = new Date('2026-01-15T10:00:00Z');

function buildMessage(overrides: Record<string, any> = {}) {
  return {
    id: 'msg-1',
    senderId: 'user-1',
    recipientId: 'user-2',
    text: 'Hello!',
    messageType: 'PRIVATE',
    roomId: null,
    isRead: false,
    createdAt: now,
    sender: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
    recipient: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

const mockMessageFindMany = mock(() => Promise.resolve([]));
const mockMessageFindUnique = mock(() => Promise.resolve(null));
const mockMessageCreate = mock(() => Promise.resolve(buildMessage()));
const mockMessageCount = mock(() => Promise.resolve(0));
const mockMessageUpdateMany = mock(() => Promise.resolve({ count: 0 }));
const mockMessageDelete = mock(() => Promise.resolve({}));

const mockUserFindUnique = mock(() => Promise.resolve(userBob));
const mockFriendshipFindFirst = mock(() => Promise.resolve(null));
const mockRoomMemberFindFirst = mock(() => Promise.resolve(null));

mock.module('../../config/database', () => ({
  prisma: {
    message: {
      findMany: mockMessageFindMany,
      findUnique: mockMessageFindUnique,
      create: mockMessageCreate,
      count: mockMessageCount,
      updateMany: mockMessageUpdateMany,
      delete: mockMessageDelete,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    friendship: {
      findFirst: mockFriendshipFindFirst,
    },
    roomMember: {
      findFirst: mockRoomMemberFindFirst,
    },
  },
}));

// Import after mocking so the module picks up the mocked prisma
import messageService from '../../modules/social/messageService';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessageService', () => {
  beforeEach(() => {
    mockMessageFindMany.mockReset();
    mockMessageFindUnique.mockReset();
    mockMessageCreate.mockReset();
    mockMessageCount.mockReset();
    mockMessageUpdateMany.mockReset();
    mockMessageDelete.mockReset();
    mockUserFindUnique.mockReset();
    mockFriendshipFindFirst.mockReset();
    mockRoomMemberFindFirst.mockReset();

    // Defaults
    mockMessageFindMany.mockResolvedValue([]);
    mockMessageFindUnique.mockResolvedValue(null);
    mockMessageCount.mockResolvedValue(0);
    mockMessageUpdateMany.mockResolvedValue({ count: 0 } as any);
    mockMessageDelete.mockResolvedValue({} as any);
    mockUserFindUnique.mockResolvedValue(userBob as any);
    mockFriendshipFindFirst.mockResolvedValue(null);
    mockRoomMemberFindFirst.mockResolvedValue(null);
  });

  // =========================================================================
  // getConversations
  // =========================================================================
  describe('getConversations', () => {
    it('should return empty array when user has no messages', async () => {
      mockMessageFindMany.mockResolvedValue([]);

      const result = await messageService.getConversations('user-1');

      expect(result).toEqual([]);
      expect(mockMessageFindMany).toHaveBeenCalledTimes(1);
    });

    it('should return grouped conversations with unread counts', async () => {
      const msg1 = buildMessage({
        id: 'msg-1',
        senderId: 'user-2',
        recipientId: 'user-1',
        text: 'Hey Alice!',
        createdAt: now,
        sender: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png' },
        recipient: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
      });

      const msg2 = buildMessage({
        id: 'msg-2',
        senderId: 'user-1',
        recipientId: 'user-2',
        text: 'Hi Bob!',
        createdAt: earlier,
        sender: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
        recipient: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png' },
      });

      mockMessageFindMany.mockResolvedValue([msg1, msg2] as any);
      mockMessageCount.mockResolvedValue(3);

      const result = await messageService.getConversations('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].otherId).toBe('user-2');
      expect(result[0].otherName).toBe('Bob');
      expect(result[0].otherAvatar).toBe('bob.png');
      expect(result[0].lastMessage.id).toBe('msg-1');
      expect(result[0].lastMessage.text).toBe('Hey Alice!');
      expect(result[0].unreadCount).toBe(3);
    });

    it('should group messages by conversation partner and only use the latest message', async () => {
      const msgFromBob = buildMessage({
        id: 'msg-1',
        senderId: 'user-2',
        recipientId: 'user-1',
        text: 'Latest from Bob',
        createdAt: now,
        sender: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png' },
        recipient: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
      });

      const msgFromCarol = buildMessage({
        id: 'msg-2',
        senderId: 'user-4',
        recipientId: 'user-1',
        text: 'From Carol',
        createdAt: earlier,
        sender: { id: 'user-4', username: 'carol', displayName: 'Carol', avatar: null },
        recipient: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
      });

      const olderMsgFromBob = buildMessage({
        id: 'msg-3',
        senderId: 'user-2',
        recipientId: 'user-1',
        text: 'Older from Bob',
        createdAt: earliest,
        sender: { id: 'user-2', username: 'bob', displayName: 'Bob', avatar: 'bob.png' },
        recipient: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
      });

      mockMessageFindMany.mockResolvedValue([msgFromBob, msgFromCarol, olderMsgFromBob] as any);
      mockMessageCount.mockResolvedValue(1);

      const result = await messageService.getConversations('user-1');

      expect(result).toHaveLength(2);
      // Bob's conversation should use the latest message (msg-1)
      const bobConvo = result.find((c) => c.otherId === 'user-2');
      expect(bobConvo?.lastMessage.id).toBe('msg-1');
      expect(bobConvo?.lastMessage.text).toBe('Latest from Bob');
    });

    it('should use displayName for otherName, falling back to username', async () => {
      const msgNoDisplayName = buildMessage({
        id: 'msg-1',
        senderId: 'user-5',
        recipientId: 'user-1',
        text: 'Hi',
        createdAt: now,
        sender: { id: 'user-5', username: 'noname', displayName: null, avatar: null },
        recipient: { id: 'user-1', username: 'alice', displayName: 'Alice', avatar: null },
      });

      mockMessageFindMany.mockResolvedValue([msgNoDisplayName] as any);
      mockMessageCount.mockResolvedValue(0);

      const result = await messageService.getConversations('user-1');

      expect(result[0].otherName).toBe('noname');
    });
  });

  // =========================================================================
  // getConversationMessages
  // =========================================================================
  describe('getConversationMessages', () => {
    it('should return messages in chronological order', async () => {
      const msg1 = buildMessage({ id: 'msg-1', createdAt: earliest });
      const msg2 = buildMessage({ id: 'msg-2', createdAt: earlier });
      const msg3 = buildMessage({ id: 'msg-3', createdAt: now });

      // Service fetches in desc order, then reverses
      mockMessageFindMany.mockResolvedValue([msg3, msg2, msg1] as any);

      const result = await messageService.getConversationMessages('user-1', 'user-2');

      // After reverse, should be in chronological order
      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].id).toBe('msg-2');
      expect(result.messages[2].id).toBe('msg-3');
    });

    it('should set hasMore to false when messages fit within limit', async () => {
      const msgs = [buildMessage({ id: 'msg-1' })];
      mockMessageFindMany.mockResolvedValue(msgs as any);

      const result = await messageService.getConversationMessages('user-1', 'user-2', { limit: 50 });

      expect(result.hasMore).toBe(false);
      expect(result.messages).toHaveLength(1);
    });

    it('should set hasMore to true when there are more messages than the limit', async () => {
      // Service fetches limit+1 to check for more
      const msgs = Array.from({ length: 4 }, (_, i) =>
        buildMessage({ id: `msg-${i}`, createdAt: new Date(now.getTime() - i * 1000) })
      );
      mockMessageFindMany.mockResolvedValue(msgs as any);

      const result = await messageService.getConversationMessages('user-1', 'user-2', { limit: 3 });

      expect(result.hasMore).toBe(true);
      expect(result.messages).toHaveLength(3);
    });

    it('should use cursor-based pagination when before is provided', async () => {
      const cursorMessage = { createdAt: earlier };
      mockMessageFindUnique.mockResolvedValue(cursorMessage as any);
      mockMessageFindMany.mockResolvedValue([]);

      await messageService.getConversationMessages('user-1', 'user-2', {
        before: 'cursor-msg-id',
      });

      expect(mockMessageFindUnique).toHaveBeenCalledWith({
        where: { id: 'cursor-msg-id' },
        select: { createdAt: true },
      });
    });

    it('should default limit to 50 when not provided', async () => {
      mockMessageFindMany.mockResolvedValue([]);

      await messageService.getConversationMessages('user-1', 'user-2');

      // Should take 51 (limit+1)
      const call = mockMessageFindMany.mock.calls[0] as any[];
      expect(call[0].take).toBe(51);
    });
  });

  // =========================================================================
  // sendDirectMessage
  // =========================================================================
  describe('sendDirectMessage', () => {
    beforeEach(() => {
      mockUserFindUnique.mockResolvedValue(userBob as any);
      // First call returns null (no block), second returns friendship
      mockFriendshipFindFirst
        .mockResolvedValueOnce(null) // blocked check
        .mockResolvedValueOnce({ id: 'friendship-1', status: 'ACCEPTED' }); // friends check
      mockMessageCreate.mockResolvedValue(buildMessage() as any);
    });

    it('should create a message when all validations pass', async () => {
      const result = await messageService.sendDirectMessage('user-1', 'user-2', 'Hello!');

      expect(result).toBeDefined();
      expect(mockMessageCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw 404 when recipient does not exist', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await expect(
        messageService.sendDirectMessage('user-1', 'user-999', 'Hello!')
      ).rejects.toThrow('Recipient not found');

      try {
        mockUserFindUnique.mockResolvedValue(null);
        await messageService.sendDirectMessage('user-1', 'user-999', 'Hello!');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).statusCode).toBe(404);
      }
    });

    it('should throw 400 when recipient is not active', async () => {
      mockUserFindUnique.mockResolvedValue(userInactive as any);

      await expect(
        messageService.sendDirectMessage('user-1', 'user-3', 'Hello!')
      ).rejects.toThrow('Cannot message this user');

      try {
        mockUserFindUnique.mockResolvedValue(userInactive as any);
        await messageService.sendDirectMessage('user-1', 'user-3', 'Hello!');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(400);
      }
    });

    it('should throw 403 when users are blocked', async () => {
      mockFriendshipFindFirst.mockReset();
      mockFriendshipFindFirst.mockResolvedValueOnce({ id: 'block-1', status: 'BLOCKED' } as any);

      await expect(
        messageService.sendDirectMessage('user-1', 'user-2', 'Hello!')
      ).rejects.toThrow('Cannot message this user');

      try {
        mockFriendshipFindFirst.mockReset();
        mockFriendshipFindFirst.mockResolvedValueOnce({ id: 'block-1', status: 'BLOCKED' } as any);
        await messageService.sendDirectMessage('user-1', 'user-2', 'Hello!');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(403);
      }
    });

    it('should throw 403 when users are not friends', async () => {
      mockFriendshipFindFirst.mockReset();
      mockFriendshipFindFirst
        .mockResolvedValueOnce(null) // not blocked
        .mockResolvedValueOnce(null); // not friends

      await expect(
        messageService.sendDirectMessage('user-1', 'user-2', 'Hello!')
      ).rejects.toThrow('You can only message friends');

      try {
        mockFriendshipFindFirst.mockReset();
        mockFriendshipFindFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null);
        await messageService.sendDirectMessage('user-1', 'user-2', 'Hello!');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(403);
      }
    });

    it('should throw 400 when text is empty', async () => {
      await expect(
        messageService.sendDirectMessage('user-1', 'user-2', '')
      ).rejects.toThrow('Message cannot be empty');
    });

    it('should throw 400 when text is only whitespace', async () => {
      await expect(
        messageService.sendDirectMessage('user-1', 'user-2', '   ')
      ).rejects.toThrow('Message cannot be empty');
    });

    it('should throw 400 when text exceeds 2000 characters', async () => {
      const longText = 'a'.repeat(2001);

      await expect(
        messageService.sendDirectMessage('user-1', 'user-2', longText)
      ).rejects.toThrow('Message too long (max 2000 characters)');
    });

    it('should trim whitespace from the message text', async () => {
      await messageService.sendDirectMessage('user-1', 'user-2', '  Hello!  ');

      const createCall = mockMessageCreate.mock.calls[0] as any[];
      expect(createCall[0].data.text).toBe('Hello!');
    });

    it('should create the message with PRIVATE messageType', async () => {
      await messageService.sendDirectMessage('user-1', 'user-2', 'Hello!');

      const createCall = mockMessageCreate.mock.calls[0] as any[];
      expect(createCall[0].data.messageType).toBe('PRIVATE');
      expect(createCall[0].data.senderId).toBe('user-1');
      expect(createCall[0].data.recipientId).toBe('user-2');
    });
  });

  // =========================================================================
  // getRoomMessages
  // =========================================================================
  describe('getRoomMessages', () => {
    it('should throw 403 when user is not a room member', async () => {
      mockRoomMemberFindFirst.mockResolvedValue(null);

      await expect(
        messageService.getRoomMessages('user-1', 'room-1')
      ).rejects.toThrow('You are not a member of this room');

      try {
        mockRoomMemberFindFirst.mockResolvedValue(null);
        await messageService.getRoomMessages('user-1', 'room-1');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(403);
      }
    });

    it('should return messages in chronological order when user is a member', async () => {
      mockRoomMemberFindFirst.mockResolvedValue({ userId: 'user-1', roomId: 'room-1', isActive: true } as any);

      const msg1 = buildMessage({ id: 'msg-1', roomId: 'room-1', messageType: 'ROOM', createdAt: earliest });
      const msg2 = buildMessage({ id: 'msg-2', roomId: 'room-1', messageType: 'ROOM', createdAt: now });

      mockMessageFindMany.mockResolvedValue([msg2, msg1] as any);

      const result = await messageService.getRoomMessages('user-1', 'room-1');

      expect(result.messages[0].id).toBe('msg-1');
      expect(result.messages[1].id).toBe('msg-2');
    });

    it('should support cursor-based pagination with before parameter', async () => {
      mockRoomMemberFindFirst.mockResolvedValue({ userId: 'user-1', roomId: 'room-1', isActive: true } as any);
      mockMessageFindUnique.mockResolvedValue({ createdAt: earlier } as any);
      mockMessageFindMany.mockResolvedValue([]);

      await messageService.getRoomMessages('user-1', 'room-1', { before: 'cursor-id' });

      expect(mockMessageFindUnique).toHaveBeenCalledWith({
        where: { id: 'cursor-id' },
        select: { createdAt: true },
      });
    });

    it('should set hasMore correctly based on result count', async () => {
      mockRoomMemberFindFirst.mockResolvedValue({ userId: 'user-1', roomId: 'room-1', isActive: true } as any);

      // Exactly limit+1 messages means hasMore = true
      const msgs = Array.from({ length: 51 }, (_, i) =>
        buildMessage({ id: `msg-${i}`, roomId: 'room-1', messageType: 'ROOM' })
      );
      mockMessageFindMany.mockResolvedValue(msgs as any);

      const result = await messageService.getRoomMessages('user-1', 'room-1', { limit: 50 });

      expect(result.hasMore).toBe(true);
      expect(result.messages).toHaveLength(50);
    });

    it('should set hasMore to false when fewer results than limit', async () => {
      mockRoomMemberFindFirst.mockResolvedValue({ userId: 'user-1', roomId: 'room-1', isActive: true } as any);
      mockMessageFindMany.mockResolvedValue([buildMessage()] as any);

      const result = await messageService.getRoomMessages('user-1', 'room-1', { limit: 50 });

      expect(result.hasMore).toBe(false);
    });
  });

  // =========================================================================
  // markAsRead
  // =========================================================================
  describe('markAsRead', () => {
    it('should mark specified messages as read and return the count', async () => {
      mockMessageUpdateMany.mockResolvedValue({ count: 3 } as any);

      const result = await messageService.markAsRead('user-1', ['msg-1', 'msg-2', 'msg-3']);

      expect(result).toBe(3);
      expect(mockMessageUpdateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['msg-1', 'msg-2', 'msg-3'] },
          recipientId: 'user-1',
          isRead: false,
        },
        data: { isRead: true },
      });
    });

    it('should return 0 when no messages need updating', async () => {
      mockMessageUpdateMany.mockResolvedValue({ count: 0 } as any);

      const result = await messageService.markAsRead('user-1', ['msg-nonexistent']);

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // markConversationAsRead
  // =========================================================================
  describe('markConversationAsRead', () => {
    it('should mark all unread messages from a specific sender as read', async () => {
      mockMessageUpdateMany.mockResolvedValue({ count: 5 } as any);

      const result = await messageService.markConversationAsRead('user-1', 'user-2');

      expect(result).toBe(5);
      expect(mockMessageUpdateMany).toHaveBeenCalledWith({
        where: {
          senderId: 'user-2',
          recipientId: 'user-1',
          messageType: 'PRIVATE',
          isRead: false,
        },
        data: { isRead: true },
      });
    });

    it('should return 0 when no unread messages exist from the sender', async () => {
      mockMessageUpdateMany.mockResolvedValue({ count: 0 } as any);

      const result = await messageService.markConversationAsRead('user-1', 'user-2');

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // getUnreadCount
  // =========================================================================
  describe('getUnreadCount', () => {
    it('should return the count of unread private messages', async () => {
      mockMessageCount.mockResolvedValue(7);

      const result = await messageService.getUnreadCount('user-1');

      expect(result).toBe(7);
      expect(mockMessageCount).toHaveBeenCalledWith({
        where: {
          recipientId: 'user-1',
          messageType: 'PRIVATE',
          isRead: false,
        },
      });
    });

    it('should return 0 when there are no unread messages', async () => {
      mockMessageCount.mockResolvedValue(0);

      const result = await messageService.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  // =========================================================================
  // deleteMessage
  // =========================================================================
  describe('deleteMessage', () => {
    it('should delete the message when the sender requests deletion', async () => {
      mockMessageFindUnique.mockResolvedValue(buildMessage({ id: 'msg-1', senderId: 'user-1' }) as any);

      await messageService.deleteMessage('user-1', 'msg-1');

      expect(mockMessageDelete).toHaveBeenCalledWith({
        where: { id: 'msg-1' },
      });
    });

    it('should throw 404 when message does not exist', async () => {
      mockMessageFindUnique.mockResolvedValue(null);

      await expect(
        messageService.deleteMessage('user-1', 'msg-nonexistent')
      ).rejects.toThrow('Message not found');

      try {
        mockMessageFindUnique.mockResolvedValue(null);
        await messageService.deleteMessage('user-1', 'msg-nonexistent');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(404);
      }
    });

    it('should throw 403 when a non-sender tries to delete the message', async () => {
      mockMessageFindUnique.mockResolvedValue(buildMessage({ id: 'msg-1', senderId: 'user-2' }) as any);

      await expect(
        messageService.deleteMessage('user-1', 'msg-1')
      ).rejects.toThrow('You can only delete your own messages');

      try {
        mockMessageFindUnique.mockResolvedValue(buildMessage({ id: 'msg-1', senderId: 'user-2' }) as any);
        await messageService.deleteMessage('user-1', 'msg-1');
      } catch (error) {
        expect((error as AppError).statusCode).toBe(403);
      }
    });
  });
});
