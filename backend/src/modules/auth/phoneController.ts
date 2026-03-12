/**
 * Phone Controller
 * Handles phone verification and phone number management
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@config/database';
import { successResponse } from '@shared/utils/responseFormatter';
import { ValidationError, NotFoundError, ConflictError } from '@shared/utils/errors';
import { hashPassword, comparePassword } from '@shared/utils/passwordUtils';
import logger from '@shared/utils/logger';
import { AuthRequest } from '@shared/types/index';
import { config } from '@config/env';
import { generateVerificationCode, getUserResponse, createAuthResponse } from './authService';

/**
 * Send phone verification code
 */
export async function sendPhoneVerification(req: Request, res: Response, next: NextFunction) {
  try {
    const { phoneNumber } = req.body;

    const user = await prisma.user.findUnique({ where: { phoneNumber } });

    if (!user) {
      throw new NotFoundError('No account found with this phone number');
    }

    if (user.phoneVerified) {
      throw new ValidationError('Phone number is already verified');
    }

    const code = generateVerificationCode();
    const codeHash = await hashPassword(code);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerificationCode: codeHash,
        phoneVerificationExpiry: expiry,
      },
    });

    logger.info(`Phone verification code sent for ${phoneNumber}`);

    res.json(
      successResponse(
        {
          message: 'Verification code sent',
          expiresAt: expiry,
          ...(config.isDev && { code }),
        },
        'Verification code sent successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Verify phone with OTP code
 */
export async function verifyPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const { phoneNumber, code } = req.body;

    const user = await prisma.user.findUnique({ where: { phoneNumber } });

    if (!user) {
      throw new NotFoundError('No account found with this phone number');
    }

    if (user.phoneVerified) {
      throw new ValidationError('Phone number is already verified');
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      throw new ValidationError('No verification code sent. Please request a new code.');
    }

    if (new Date() > user.phoneVerificationExpiry) {
      throw new ValidationError('Verification code has expired. Please request a new code.');
    }

    const isValid = await comparePassword(code, user.phoneVerificationCode);
    if (!isValid) {
      throw new ValidationError('Invalid verification code');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null,
        lastLogin: new Date(),
      },
    });

    logger.info(`Phone verified for user: ${user.username} (${phoneNumber})`);

    res.json(await createAuthResponse(updatedUser, 'Phone verified successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Add or update phone number (authenticated user)
 */
export async function updatePhoneNumber(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phoneNumber } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingUser && existingUser.id !== req.user.id) {
      throw new ConflictError('Phone number is already registered to another account');
    }

    const code = generateVerificationCode();
    const codeHash = await hashPassword(code);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        phoneNumber,
        phoneVerified: false,
        phoneVerificationCode: codeHash,
        phoneVerificationExpiry: expiry,
      },
    });

    logger.info(`Phone verification code sent for ${phoneNumber}`);

    res.json(
      successResponse(
        {
          user: getUserResponse(user),
          message: 'Verification code sent to your phone',
          expiresAt: expiry,
          ...(config.isDev && { code }),
        },
        'Phone number updated. Please verify.'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Remove phone number (authenticated user)
 */
export async function removePhoneNumber(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.phoneNumber) {
      throw new ValidationError('No phone number to remove');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneNumber: null,
        phoneVerified: false,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null,
      },
    });

    logger.info(`Phone removed for user: ${user.username}`);

    res.json(successResponse(getUserResponse(updatedUser), 'Phone number removed successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Verify phone number for authenticated user
 */
export async function verifyUserPhone(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.phoneNumber) {
      throw new ValidationError('No phone number set. Please add a phone number first.');
    }

    if (user.phoneVerified) {
      throw new ValidationError('Phone number is already verified');
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      throw new ValidationError('No verification code sent. Please request a new code.');
    }

    if (new Date() > user.phoneVerificationExpiry) {
      throw new ValidationError('Verification code has expired. Please request a new code.');
    }

    const isValid = await comparePassword(code, user.phoneVerificationCode);
    if (!isValid) {
      throw new ValidationError('Invalid verification code');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null,
      },
    });

    logger.info(`Phone verified for user: ${user.username}`);

    res.json(successResponse(getUserResponse(updatedUser), 'Phone number verified successfully'));
  } catch (error) {
    next(error);
  }
}
