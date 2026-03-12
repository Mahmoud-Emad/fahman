/**
 * Validator Unit Tests
 * Tests for Joi validation schemas
 */

import { describe, it, expect } from 'bun:test';
import {
  sendMessageSchema,
  sendRoomInviteSchema,
  markAsReadSchema,
} from '@modules/social/messageValidator';

describe('Message Validators', () => {
  describe('sendMessageSchema', () => {
    it('should validate a correct message payload', () => {
      const payload = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        text: 'Hello, how are you?',
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeUndefined();
      expect(result.value).toEqual(payload);
    });

    it('should reject missing recipientId', () => {
      const payload = {
        text: 'Hello!',
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].path).toContain('recipientId');
    });

    it('should reject invalid UUID for recipientId', () => {
      const payload = {
        recipientId: 'not-a-uuid',
        text: 'Hello!',
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid recipient ID');
    });

    it('should reject missing text', () => {
      const payload = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].path).toContain('text');
    });

    it('should reject empty text', () => {
      const payload = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        text: '',
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('empty');
    });

    it('should reject text exceeding 2000 characters', () => {
      const payload = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        text: 'a'.repeat(2001),
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('2000');
    });

    it('should accept text at exactly 2000 characters', () => {
      const payload = {
        recipientId: '550e8400-e29b-41d4-a716-446655440000',
        text: 'a'.repeat(2000),
      };

      const result = sendMessageSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });
  });

  describe('sendRoomInviteSchema', () => {
    it('should validate a correct room invite payload', () => {
      const payload = {
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        roomCode: 'ABC123',
        roomTitle: 'Fun Quiz Night',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should accept multiple recipient IDs', () => {
      const payload = {
        recipientIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
        roomCode: 'ABC123',
        roomTitle: 'Fun Quiz Night',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty recipientIds array', () => {
      const payload = {
        recipientIds: [],
        roomCode: 'ABC123',
        roomTitle: 'Fun Quiz Night',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('At least one recipient');
    });

    it('should reject more than 20 recipients', () => {
      const payload = {
        recipientIds: Array(21)
          .fill(null)
          .map((_, i) => `550e8400-e29b-41d4-a716-4466554400${i.toString().padStart(2, '0')}`),
        roomCode: 'ABC123',
        roomTitle: 'Fun Quiz Night',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('20');
    });

    it('should reject invalid room code length', () => {
      const payload = {
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        roomCode: 'AB12', // Too short
        roomTitle: 'Fun Quiz Night',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('6 characters');
    });

    it('should reject room code longer than 6 characters', () => {
      const payload = {
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        roomCode: 'ABC1234', // Too long
        roomTitle: 'Fun Quiz Night',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeDefined();
    });

    it('should reject empty room title', () => {
      const payload = {
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        roomCode: 'ABC123',
        roomTitle: '',
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeDefined();
    });

    it('should reject room title exceeding 200 characters', () => {
      const payload = {
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        roomCode: 'ABC123',
        roomTitle: 'a'.repeat(201),
      };

      const result = sendRoomInviteSchema.validate(payload);
      expect(result.error).toBeDefined();
    });
  });

  describe('markAsReadSchema', () => {
    it('should validate correct payload', () => {
      const payload = {
        messageIds: ['550e8400-e29b-41d4-a716-446655440000'],
      };

      const result = markAsReadSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should accept multiple message IDs', () => {
      const payload = {
        messageIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
        ],
      };

      const result = markAsReadSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty messageIds array', () => {
      const payload = {
        messageIds: [],
      };

      const result = markAsReadSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('At least one message');
    });

    it('should reject more than 100 message IDs', () => {
      const payload = {
        messageIds: Array(101)
          .fill(null)
          .map(
            (_, i) =>
              `550e8400-e29b-41d4-a716-44665544${i.toString().padStart(4, '0')}`
          ),
      };

      const result = markAsReadSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('100');
    });

    it('should reject invalid UUID in messageIds', () => {
      const payload = {
        messageIds: ['not-a-uuid'],
      };

      const result = markAsReadSchema.validate(payload);
      expect(result.error).toBeDefined();
    });
  });
});
