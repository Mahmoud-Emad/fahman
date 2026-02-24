/**
 * Authentication Routes
 * Supports: email, phone, game ID, Google OAuth, Facebook OAuth
 */

import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validation';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import {
  registerSchema,
  registerWithPhoneSchema,
  loginSchema,
  loginWithPhoneSchema,
  loginWithGameIdSchema,
  oauthLoginSchema,
  sendPhoneVerificationSchema,
  verifyPhoneSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  updatePhoneNumberSchema,
  verifyUserPhoneSchema,
} from '../validators/authValidator';

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// =============================================================================
// REGISTRATION ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register with email
 *     description: Create a new user account with username, email, and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Password123!
 *               avatar:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/auth/register/phone:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register with phone number
 *     description: Create a new user account with phone number and password. Phone verification required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - phoneNumber
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: Password123!
 *               displayName:
 *                 type: string
 *                 example: John Doe
 *               avatar:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: User registered. Phone verification required.
 *       400:
 *         description: Validation error
 *       409:
 *         description: Phone number or username already exists
 */
router.post('/register/phone', validate(registerWithPhoneSchema), authController.registerWithPhone);

// =============================================================================
// LOGIN ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with email
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /api/auth/login/phone:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with phone number
 *     description: Authenticate user with phone number and password. Phone must be verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - password
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials or phone not verified
 */
router.post('/login/phone', validate(loginWithPhoneSchema), authController.loginWithPhone);

/**
 * @openapi
 * /api/auth/login/game-id:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login with Game ID
 *     description: Authenticate user with their unique Game ID and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *               - password
 *             properties:
 *               gameId:
 *                 type: integer
 *                 minimum: 100000
 *                 example: 100001
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid Game ID or password
 */
router.post('/login/game-id', validate(loginWithGameIdSchema), authController.loginWithGameId);

// =============================================================================
// OAUTH ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login/Register with Google
 *     description: Authenticate or create account using Google OAuth token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Google ID token
 *               email:
 *                 type: string
 *                 description: Optional fallback email (for development)
 *               displayName:
 *                 type: string
 *                 description: Optional fallback display name
 *               avatar:
 *                 type: string
 *                 description: Optional fallback avatar URL
 *               providerId:
 *                 type: string
 *                 description: Optional fallback provider ID
 *     responses:
 *       200:
 *         description: Login/Registration successful
 *       401:
 *         description: Invalid Google token
 *       409:
 *         description: Email already registered with different provider
 */
router.post('/google', validate(oauthLoginSchema), authController.loginWithGoogle);

/**
 * @openapi
 * /api/auth/facebook:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login/Register with Facebook
 *     description: Authenticate or create account using Facebook OAuth token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Facebook access token
 *               email:
 *                 type: string
 *                 description: Optional fallback email (for development)
 *               displayName:
 *                 type: string
 *                 description: Optional fallback display name
 *               avatar:
 *                 type: string
 *                 description: Optional fallback avatar URL
 *               providerId:
 *                 type: string
 *                 description: Optional fallback provider ID
 *     responses:
 *       200:
 *         description: Login/Registration successful
 *       401:
 *         description: Invalid Facebook token
 *       409:
 *         description: Email already registered with different provider
 */
router.post('/facebook', validate(oauthLoginSchema), authController.loginWithFacebook);

// =============================================================================
// PHONE VERIFICATION ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/phone/send-code:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Send phone verification code
 *     description: Send a 6-digit OTP code to the registered phone number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Verification code sent
 *       404:
 *         description: No account found with this phone number
 *       400:
 *         description: Phone already verified
 */
router.post('/phone/send-code', validate(sendPhoneVerificationSchema), authController.sendPhoneVerification);

/**
 * @openapi
 * /api/auth/phone/verify:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify phone with OTP code
 *     description: Verify phone number using the 6-digit OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully, returns auth tokens
 *       400:
 *         description: Invalid or expired code
 *       404:
 *         description: No account found with this phone number
 */
router.post('/phone/verify', validate(verifyPhoneSchema), authController.verifyPhone);

// =============================================================================
// TOKEN MANAGEMENT ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user
 *     description: Retrieve authenticated user's profile including Game ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Logout current user (client-side token removal)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, authController.logout);

// =============================================================================
// PASSWORD RESET ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send a password reset code to the user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Reset code sent (if account exists)
 *       400:
 *         description: Validation error or social login account
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password
 *     description: Reset password using the code sent to email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired code
 *       404:
 *         description: Account not found
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// =============================================================================
// PROFILE MANAGEMENT ROUTES
// =============================================================================

/**
 * @openapi
 * /api/auth/profile:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update user profile
 *     description: Update the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *               avatar:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);

/**
 * @openapi
 * /api/auth/phone:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Add or update phone number
 *     description: Add or change phone number (requires verification)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Verification code sent
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Phone number already registered
 */
router.post('/phone', authenticate, validate(updatePhoneNumberSchema), authController.updatePhoneNumber);

/**
 * @openapi
 * /api/auth/phone/verify-user:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify phone for authenticated user
 *     description: Verify phone number using the OTP code (for profile phone update)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *       400:
 *         description: Invalid or expired code
 *       401:
 *         description: Unauthorized
 */
router.post('/phone/verify-user', authenticate, validate(verifyUserPhoneSchema), authController.verifyUserPhone);

export default router;
