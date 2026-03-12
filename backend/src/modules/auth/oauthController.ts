/**
 * OAuth Controller
 * Handles Google and Facebook OAuth authentication
 */

import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@config/database';
import { UnauthorizedError, ConflictError } from '@shared/utils/errors';
import logger from '@shared/utils/logger';
import { StreakService } from '../user/streakService';
import { config } from '@config/env';
import { createAuthResponse } from './authService';

const googleClient = new OAuth2Client(config.oauth.googleClientId);

/**
 * Login/Register with Google OAuth
 */
export async function loginWithGoogle(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;

    let email: string;
    let displayName: string;
    let avatar: string | undefined;
    let providerId: string;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config.oauth.googleClientId,
      });
      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedError('Invalid Google token');
      }

      email = payload.email!;
      displayName = payload.name || email.split('@')[0];
      avatar = payload.picture;
      providerId = payload.sub;
    } catch (googleError) {
      throw new UnauthorizedError('Google authentication failed');
    }

    let user = await prisma.user.findFirst({
      where: {
        authProvider: 'GOOGLE',
        providerId: providerId,
      },
    });

    if (!user) {
      const existingEmailUser = await prisma.user.findUnique({ where: { email } });
      if (existingEmailUser) {
        throw new ConflictError('Email already registered with a different account');
      }

      const username = `g_${providerId.substring(0, 8)}_${Date.now().toString(36)}`;

      user = await prisma.user.create({
        data: {
          username,
          email,
          displayName,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          authProvider: 'GOOGLE',
          providerId,
          lastLogin: new Date(),
        },
      });

      logger.info(`New Google user registered: ${user.displayName} (${user.email}) - Game ID: ${user.gameId}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName,
          avatar: avatar || user.avatar,
        },
      });

      await StreakService.updateStreak(user.id);
      logger.info(`Google user logged in: ${user.displayName}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isNewGoogleUser = user.createdAt.getTime() === user.updatedAt.getTime();
    res.json(await createAuthResponse(user, isNewGoogleUser ? 'Account created successfully' : 'Login successful', isNewGoogleUser));
  } catch (error) {
    next(error);
  }
}

/**
 * Login/Register with Facebook OAuth
 */
export async function loginWithFacebook(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;

    let email: string | null = null;
    let displayName: string;
    let avatar: string | undefined;
    let providerId: string;

    try {
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
      );

      if (!fbResponse.ok) {
        throw new Error('Facebook token verification failed');
      }

      const fbData = await fbResponse.json() as { id: string; name: string; email?: string; picture?: { data?: { url?: string } } };
      email = fbData.email || null;
      displayName = fbData.name;
      avatar = fbData.picture?.data?.url;
      providerId = fbData.id;
    } catch (fbError) {
      throw new UnauthorizedError('Facebook authentication failed');
    }

    let user = await prisma.user.findFirst({
      where: {
        authProvider: 'FACEBOOK',
        providerId: providerId,
      },
    });

    if (!user) {
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({ where: { email } });
        if (existingEmailUser) {
          throw new ConflictError('Email already registered with a different account');
        }
      }

      const username = `fb_${providerId.substring(0, 8)}_${Date.now().toString(36)}`;

      user = await prisma.user.create({
        data: {
          username,
          email,
          displayName,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          authProvider: 'FACEBOOK',
          providerId,
          lastLogin: new Date(),
        },
      });

      logger.info(`New Facebook user registered: ${user.displayName} - Game ID: ${user.gameId}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName,
          avatar: avatar || user.avatar,
        },
      });

      await StreakService.updateStreak(user.id);
      logger.info(`Facebook user logged in: ${user.displayName}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isNewFacebookUser = user.createdAt.getTime() === user.updatedAt.getTime();
    res.json(await createAuthResponse(user, isNewFacebookUser ? 'Account created successfully' : 'Login successful', isNewFacebookUser));
  } catch (error) {
    next(error);
  }
}
