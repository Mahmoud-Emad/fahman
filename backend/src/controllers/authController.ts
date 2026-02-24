/**
 * Authentication Controller
 * Handles all authentication methods: email, phone, game ID, Google, Facebook
 */

import { Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/passwordUtils';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/tokenUtils';
import { successResponse } from '../utils/responseFormatter';
import { UnauthorizedError, ConflictError, ValidationError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';
import { AuthRequest } from '../types';
import { StreakService } from '../services/streakService';

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * List of bird names for username generation
 */
const BIRD_NAMES = [
  'owl', 'eagle', 'hawk', 'falcon', 'raven', 'crow', 'sparrow', 'robin',
  'dove', 'pigeon', 'swan', 'duck', 'goose', 'heron', 'crane', 'stork',
  'flamingo', 'pelican', 'penguin', 'puffin', 'parrot', 'macaw', 'toucan',
  'woodpecker', 'kingfisher', 'hummingbird', 'cardinal', 'bluejay', 'finch',
  'canary', 'phoenix', 'thunderbird', 'griffin', 'peacock', 'condor',
];

/**
 * Generate a unique username from display name and game ID
 * Format: {firstName}_{birdName}{lastTwoDigits}
 * Example: "john_owl45" for "John Doe" with gameId 100045
 */
async function generateUniqueUsername(displayName: string, gameId: number): Promise<string> {
  // Extract first name and normalize
  const firstName = displayName
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  // Get last 2 digits of game ID
  const lastTwoDigits = (gameId % 100).toString().padStart(2, '0');

  // Try to generate a unique username
  let attempts = 0;
  const maxAttempts = BIRD_NAMES.length;

  while (attempts < maxAttempts) {
    const birdName = BIRD_NAMES[Math.floor(Math.random() * BIRD_NAMES.length)];
    const username = `${firstName}_${birdName}${lastTwoDigits}`;

    // Check if username exists
    const exists = await prisma.user.findUnique({ where: { username } });
    if (!exists) {
      return username;
    }

    attempts++;
  }

  // Fallback: add random suffix if all bird names are taken
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const birdName = BIRD_NAMES[Math.floor(Math.random() * BIRD_NAMES.length)];
  return `${firstName}_${birdName}${lastTwoDigits}${randomSuffix}`;
}

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Standard user response fields
 */
function getUserResponse(user: any) {
  return {
    id: user.id,
    gameId: user.gameId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    email: user.email,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    avatar: user.avatar,
    role: user.role,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    coins: user.coins,
  };
}

/**
 * Generate tokens and return auth response
 */
function createAuthResponse(user: any, message: string, isNewUser: boolean = false) {
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  return successResponse(
    {
      user: getUserResponse(user),
      tokens: { accessToken, refreshToken },
      isNewUser,
    },
    message
  );
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register a new user with email and password
 * Username is auto-generated from displayName
 */
export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { displayName, email, password, avatar } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await hashPassword(password);

    // Create user with temporary username (will update after getting gameId)
    const tempUsername = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const user = await prisma.user.create({
      data: {
        username: tempUsername,
        email,
        passwordHash,
        displayName,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
        authProvider: 'LOCAL',
        lastLogin: new Date(),
      },
    });

    // Generate unique username using displayName and gameId
    const username = await generateUniqueUsername(displayName, user.gameId);

    // Update user with generated username
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });

    logger.info(`New user registered: ${updatedUser.username} (${updatedUser.email}) - Game ID: ${updatedUser.gameId}`);

    res.status(201).json(createAuthResponse(updatedUser, 'User registered successfully', true));
  } catch (error) {
    next(error);
  }
}

/**
 * Register a new user with phone number and password
 */
export async function registerWithPhone(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { username, phoneNumber, password, displayName, avatar } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.phoneNumber === phoneNumber) {
        throw new ConflictError('Phone number already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictError('Username already taken');
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        phoneNumber,
        passwordHash,
        displayName: displayName || username,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        authProvider: 'LOCAL',
        phoneVerified: false, // Must verify phone before logging in
        lastLogin: new Date(),
      },
    });

    logger.info(`New user registered with phone: ${user.username} - Game ID: ${user.gameId}`);

    // Note: Phone must be verified before user can log in
    res.status(201).json(
      successResponse(
        {
          user: getUserResponse(user),
          message: 'Please verify your phone number to complete registration',
        },
        'User registered successfully. Phone verification required.'
      )
    );
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// LOGIN METHODS
// =============================================================================

/**
 * Login with email and password
 */
export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please use Google or Facebook.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update streak and last login
    await StreakService.updateStreak(user.id);

    logger.info(`User logged in: ${user.username}`);

    res.json(createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

/**
 * Login with phone number and password
 */
export async function loginWithPhone(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phoneNumber, password } = req.body;

    const user = await prisma.user.findUnique({ where: { phoneNumber } });

    if (!user) {
      throw new UnauthorizedError('Invalid phone number or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.phoneVerified) {
      throw new UnauthorizedError('Phone number not verified. Please verify your phone first.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please use Google or Facebook.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid phone number or password');
    }

    // Update streak and last login
    await StreakService.updateStreak(user.id);

    logger.info(`User logged in with phone: ${user.username}`);

    res.json(createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

/**
 * Login with game ID and password
 */
export async function loginWithGameId(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { gameId, password } = req.body;

    const user = await prisma.user.findUnique({ where: { gameId } });

    if (!user) {
      throw new UnauthorizedError('Invalid Game ID or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please use Google or Facebook.');
    }

    // For phone users, ensure phone is verified
    if (user.phoneNumber && !user.phoneVerified) {
      throw new UnauthorizedError('Phone number not verified. Please verify your phone first.');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid Game ID or password');
    }

    // Update streak and last login
    await StreakService.updateStreak(user.id);

    logger.info(`User logged in with Game ID: ${user.gameId} (${user.username})`);

    res.json(createAuthResponse(user, 'Login successful'));
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// OAUTH LOGIN
// =============================================================================

/**
 * Login/Register with Google OAuth
 */
export async function loginWithGoogle(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token, email: providedEmail, displayName: providedName, avatar: providedAvatar, providerId: providedId } = req.body;

    let email: string;
    let displayName: string;
    let avatar: string | undefined;
    let providerId: string;

    // Verify Google token
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
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
      // If Google verification fails, use provided data (for development/testing)
      if (!providedId || !providedEmail) {
        throw new UnauthorizedError('Invalid Google token');
      }
      email = providedEmail;
      displayName = providedName || providedEmail.split('@')[0];
      avatar = providedAvatar;
      providerId = providedId;
      logger.warn('Using provided OAuth data (Google token verification failed)');
    }

    // Check if user already exists with this Google account
    let user = await prisma.user.findFirst({
      where: {
        authProvider: 'GOOGLE',
        providerId: providerId,
      },
    });

    if (!user) {
      // Check if email is already used with different auth method
      const existingEmailUser = await prisma.user.findUnique({ where: { email } });
      if (existingEmailUser) {
        throw new ConflictError('Email already registered with a different account');
      }

      // Create new user
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
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          // Update profile info in case it changed
          displayName,
          avatar: avatar || user.avatar,
        },
      });

      // Update streak and last login
      await StreakService.updateStreak(user.id);

      logger.info(`Google user logged in: ${user.displayName}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isNewGoogleUser = user.createdAt.getTime() === user.updatedAt.getTime();
    res.json(createAuthResponse(user, isNewGoogleUser ? 'Account created successfully' : 'Login successful', isNewGoogleUser));
  } catch (error) {
    next(error);
  }
}

/**
 * Login/Register with Facebook OAuth
 */
export async function loginWithFacebook(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token, email: providedEmail, displayName: providedName, avatar: providedAvatar, providerId: providedId } = req.body;

    let email: string | null = null;
    let displayName: string;
    let avatar: string | undefined;
    let providerId: string;

    // Verify Facebook token by calling Facebook Graph API
    try {
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
      );

      if (!fbResponse.ok) {
        throw new Error('Facebook token verification failed');
      }

      const fbData = await fbResponse.json();
      email = fbData.email || null;
      displayName = fbData.name;
      avatar = fbData.picture?.data?.url;
      providerId = fbData.id;
    } catch (fbError) {
      // If Facebook verification fails, use provided data (for development/testing)
      if (!providedId) {
        throw new UnauthorizedError('Invalid Facebook token');
      }
      email = providedEmail || null;
      displayName = providedName || 'Facebook User';
      avatar = providedAvatar;
      providerId = providedId;
      logger.warn('Using provided OAuth data (Facebook token verification failed)');
    }

    // Check if user already exists with this Facebook account
    let user = await prisma.user.findFirst({
      where: {
        authProvider: 'FACEBOOK',
        providerId: providerId,
      },
    });

    if (!user) {
      // Check if email is already used with different auth method (if email provided)
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({ where: { email } });
        if (existingEmailUser) {
          throw new ConflictError('Email already registered with a different account');
        }
      }

      // Create new user
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
      // Update profile info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName,
          avatar: avatar || user.avatar,
        },
      });

      // Update streak and last login
      await StreakService.updateStreak(user.id);

      logger.info(`Facebook user logged in: ${user.displayName}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isNewFacebookUser = user.createdAt.getTime() === user.updatedAt.getTime();
    res.json(createAuthResponse(user, isNewFacebookUser ? 'Account created successfully' : 'Login successful', isNewFacebookUser));
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// PHONE VERIFICATION
// =============================================================================

/**
 * Send phone verification code
 */
export async function sendPhoneVerification(req: AuthRequest, res: Response, next: NextFunction) {
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
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerificationCode: code,
        phoneVerificationExpiry: expiry,
      },
    });

    // TODO: Send SMS with verification code
    // For now, we'll log it (in production, integrate with SMS service like Twilio)
    logger.info(`Phone verification code for ${phoneNumber}: ${code}`);

    res.json(
      successResponse(
        {
          message: 'Verification code sent',
          expiresAt: expiry,
          // Remove this in production - only for development
          ...(process.env.NODE_ENV === 'development' && { code }),
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
export async function verifyPhone(req: AuthRequest, res: Response, next: NextFunction) {
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

    if (user.phoneVerificationCode !== code) {
      throw new ValidationError('Invalid verification code');
    }

    // Mark phone as verified and clear verification fields
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

    // Return auth tokens so user can proceed to use the app
    res.json(createAuthResponse(updatedUser, 'Phone verified successfully'));
  } catch (error) {
    next(error);
  }
}

// =============================================================================
// TOKEN & SESSION MANAGEMENT
// =============================================================================

/**
 * Refresh access token
 */
export async function refresh(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;

    const decoded = verifyToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    res.json(
      successResponse(
        {
          tokens: { accessToken: newAccessToken, refreshToken: newRefreshToken },
        },
        'Token refreshed successfully'
      )
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json(successResponse(getUserResponse(user), 'User retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Logout
 */
export function logout(req: AuthRequest, res: Response) {
  logger.info(`User logged out: ${req.user.username}`);
  res.json(successResponse(null, 'Logout successful'));
}

// =============================================================================
// PASSWORD RESET
// =============================================================================

/**
 * Request password reset - sends reset code to email
 */
export async function forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
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
        phoneVerificationCode: code, // Reusing this field for password reset
        phoneVerificationExpiry: expiry,
      },
    });

    // TODO: Send email with reset code
    // For now, we'll log it (in production, integrate with email service)
    logger.info(`Password reset code for ${email}: ${code}`);

    res.json(
      successResponse(
        {
          message: 'Reset code sent to your email',
          expiresAt: expiry,
          // Remove this in production - only for development
          ...(process.env.NODE_ENV === 'development' && { code }),
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
export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
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

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * Update user profile
 */
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { displayName, bio, avatar } = req.body;

    const updateData: any = {};

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    logger.info(`Profile updated for user: ${user.username}`);

    res.json(successResponse(getUserResponse(user), 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
}

/**
 * Add or update phone number
 */
export async function updatePhoneNumber(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { phoneNumber } = req.body;

    // Check if phone number is already used by another user
    const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingUser && existingUser.id !== req.user.id) {
      throw new ConflictError('Phone number is already registered to another account');
    }

    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        phoneNumber,
        phoneVerified: false,
        phoneVerificationCode: code,
        phoneVerificationExpiry: expiry,
      },
    });

    // TODO: Send SMS with verification code
    logger.info(`Phone verification code for ${phoneNumber}: ${code}`);

    res.json(
      successResponse(
        {
          user: getUserResponse(user),
          message: 'Verification code sent to your phone',
          expiresAt: expiry,
          // Remove this in production
          ...(process.env.NODE_ENV === 'development' && { code }),
        },
        'Phone number updated. Please verify.'
      )
    );
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

    if (user.phoneVerificationCode !== code) {
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
