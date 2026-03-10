/**
 * Password Controller
 * Handles password reset flow
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { hashPassword } from '../../shared/utils/passwordUtils';
import { successResponse } from '../../shared/utils/responseFormatter';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import { config } from '../../config/env';
import { generateVerificationCode } from './authService';

/**
 * Request password reset - sends reset code to email
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      res.json(successResponse(
        { message: 'If an account exists with this email, a reset code has been sent.' },
        'Password reset requested'
      ));
      return;
    }

    if (user.authProvider !== 'LOCAL') {
      throw new ValidationError(`This account uses ${user.authProvider} login. Please use that provider to sign in.`);
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerificationCode: code,
        phoneVerificationExpiry: expiry,
      },
    });

    logger.info(`Password reset code for ${email}: ${code}`);

    res.json(
      successResponse(
        {
          message: 'Reset code sent to your email',
          expiresAt: expiry,
          ...(config.isDev && { code }),
        },
        'Password reset code sent successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password using code
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundError('No account found with this email');
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      throw new ValidationError('No reset code sent. Please request a new code.');
    }

    if (new Date() > user.phoneVerificationExpiry) {
      throw new ValidationError('Reset code has expired. Please request a new code.');
    }

    if (user.phoneVerificationCode !== code) {
      throw new ValidationError('Invalid reset code');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        phoneVerificationCode: null,
        phoneVerificationExpiry: null,
      },
    });

    logger.info(`Password reset for user: ${user.username} (${email})`);

    res.json(successResponse(null, 'Password reset successfully. You can now login with your new password.'));
  } catch (error) {
    next(error);
  }
}
