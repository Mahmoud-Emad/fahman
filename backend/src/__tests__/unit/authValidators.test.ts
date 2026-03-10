/**
 * Auth Validator Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import {
  registerSchema,
  registerWithPhoneSchema,
  loginSchema,
  loginWithPhoneSchema,
  loginWithGameIdSchema,
  verifyPhoneSchema,
  updateProfileSchema,
} from '../../modules/auth/authValidator';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should validate a correct registration payload', () => {
      const payload = {
        displayName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass1',
      };

      const result = registerSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should require displayName to be at least 2 characters', () => {
      const payload = {
        displayName: 'J',
        email: 'john@example.com',
        password: 'SecurePass1',
      };

      const result = registerSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('2 characters');
    });

    it('should reject invalid email format', () => {
      const payload = {
        displayName: 'John Doe',
        email: 'notanemail',
        password: 'SecurePass1',
      };

      const result = registerSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('email');
    });

    describe('password validation', () => {
      it('should reject password shorter than 6 characters', () => {
        const payload = {
          displayName: 'John Doe',
          email: 'john@example.com',
          password: 'Ab1',
        };

        const result = registerSchema.validate(payload);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('6 characters');
      });

      it('should reject password without uppercase letter', () => {
        const payload = {
          displayName: 'John Doe',
          email: 'john@example.com',
          password: 'securepass1',
        };

        const result = registerSchema.validate(payload);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('uppercase');
      });

      it('should reject password without lowercase letter', () => {
        const payload = {
          displayName: 'John Doe',
          email: 'john@example.com',
          password: 'SECUREPASS1',
        };

        const result = registerSchema.validate(payload);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('lowercase');
      });

      it('should reject password without number', () => {
        const payload = {
          displayName: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass',
        };

        const result = registerSchema.validate(payload);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('number');
      });

      it('should accept valid password', () => {
        const validPasswords = ['SecurePass1', 'Test123!', 'AbCdEf1', 'P@ssw0rd'];

        for (const password of validPasswords) {
          const payload = {
            displayName: 'John Doe',
            email: 'john@example.com',
            password,
          };

          const result = registerSchema.validate(payload);
          expect(result.error).toBeUndefined();
        }
      });
    });

    it('should allow optional avatar URL', () => {
      const payload = {
        displayName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass1',
        avatar: 'https://example.com/avatar.png',
      };

      const result = registerSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid avatar URL', () => {
      const payload = {
        displayName: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass1',
        avatar: 'not-a-url',
      };

      const result = registerSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('URL');
    });
  });

  describe('registerWithPhoneSchema', () => {
    it('should validate correct phone registration', () => {
      const payload = {
        username: 'johndoe',
        phoneNumber: '+1234567890',
        password: 'SecurePass1',
      };

      const result = registerWithPhoneSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should require alphanumeric username', () => {
      const payload = {
        username: 'john_doe',
        phoneNumber: '+1234567890',
        password: 'SecurePass1',
      };

      const result = registerWithPhoneSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('alphanumeric');
    });

    it('should require username to be at least 3 characters', () => {
      const payload = {
        username: 'jo',
        phoneNumber: '+1234567890',
        password: 'SecurePass1',
      };

      const result = registerWithPhoneSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('3 characters');
    });

    describe('phone number validation', () => {
      it('should accept valid phone numbers', () => {
        const validNumbers = ['+1234567890', '+12345678901234', '1234567890'];

        for (const phoneNumber of validNumbers) {
          const payload = {
            username: 'johndoe',
            phoneNumber,
            password: 'SecurePass1',
          };

          const result = registerWithPhoneSchema.validate(payload);
          expect(result.error).toBeUndefined();
        }
      });

      it('should reject invalid phone numbers', () => {
        const invalidNumbers = ['123', '+0123456789', 'abcdefghij', ''];

        for (const phoneNumber of invalidNumbers) {
          const payload = {
            username: 'johndoe',
            phoneNumber,
            password: 'SecurePass1',
          };

          const result = registerWithPhoneSchema.validate(payload);
          expect(result.error).toBeDefined();
        }
      });
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login payload', () => {
      const payload = {
        email: 'john@example.com',
        password: 'anypassword',
      };

      const result = loginSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should require email', () => {
      const payload = {
        password: 'anypassword',
      };

      const result = loginSchema.validate(payload);
      expect(result.error).toBeDefined();
    });

    it('should require password', () => {
      const payload = {
        email: 'john@example.com',
      };

      const result = loginSchema.validate(payload);
      expect(result.error).toBeDefined();
    });
  });

  describe('loginWithPhoneSchema', () => {
    it('should validate correct phone login', () => {
      const payload = {
        phoneNumber: '+1234567890',
        password: 'anypassword',
      };

      const result = loginWithPhoneSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });
  });

  describe('loginWithGameIdSchema', () => {
    it('should validate correct game ID login', () => {
      const payload = {
        gameId: 100001,
        password: 'anypassword',
      };

      const result = loginWithGameIdSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should reject game ID below 100000', () => {
      const payload = {
        gameId: 99999,
        password: 'anypassword',
      };

      const result = loginWithGameIdSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Invalid Game ID');
    });

    it('should reject non-integer game ID', () => {
      const payload = {
        gameId: 100001.5,
        password: 'anypassword',
      };

      const result = loginWithGameIdSchema.validate(payload);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyPhoneSchema', () => {
    it('should validate correct verification payload', () => {
      const payload = {
        phoneNumber: '+1234567890',
        code: '123456',
      };

      const result = verifyPhoneSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should reject code with wrong length', () => {
      const payload = {
        phoneNumber: '+1234567890',
        code: '12345', // 5 digits
      };

      const result = verifyPhoneSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('6 digits');
    });

    it('should reject non-numeric code', () => {
      const payload = {
        phoneNumber: '+1234567890',
        code: 'abcdef',
      };

      const result = verifyPhoneSchema.validate(payload);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    it('should accept all optional fields', () => {
      const payload = {};

      const result = updateProfileSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should validate displayName', () => {
      const payload = {
        displayName: 'New Name',
      };

      const result = updateProfileSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should validate bio', () => {
      const payload = {
        bio: 'This is my bio',
      };

      const result = updateProfileSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should allow empty bio', () => {
      const payload = {
        bio: '',
      };

      const result = updateProfileSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });

    it('should reject bio exceeding 500 characters', () => {
      const payload = {
        bio: 'a'.repeat(501),
      };

      const result = updateProfileSchema.validate(payload);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('500');
    });

    it('should validate avatar URL', () => {
      const payload = {
        avatar: 'https://example.com/new-avatar.png',
      };

      const result = updateProfileSchema.validate(payload);
      expect(result.error).toBeUndefined();
    });
  });
});
