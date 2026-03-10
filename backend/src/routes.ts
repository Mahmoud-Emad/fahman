/**
 * Main Routes Index
 */

import express from 'express';
import authRoutes from './modules/auth/authRoutes';
import packRoutes from './modules/pack/packRoutes';
import roomRoutes from './modules/room/roomRoutes';
import friendRoutes from './modules/social/friendRoutes';
import userRoutes from './modules/user/userRoutes';
import notificationRoutes from './modules/social/notificationRoutes';
import messageRoutes from './modules/social/messageRoutes';
import settingsRoutes from './modules/user/settingsRoutes';
import avatarRoutes from './modules/store/avatarRoutes';
import uploadRoutes from './modules/upload/uploadRoutes';
import storeRoutes from './modules/store/storeRoutes';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/packs', packRoutes);
router.use('/rooms', roomRoutes);
router.use('/friends', friendRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/messages', messageRoutes);
router.use('/settings', settingsRoutes);
router.use('/avatars', avatarRoutes);
router.use('/upload', uploadRoutes);
router.use('/store', storeRoutes);

export default router;
