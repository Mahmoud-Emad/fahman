/**
 * Main Routes Index
 */

import express from 'express';
import authRoutes from './authRoutes';
import packRoutes from './packRoutes';
import roomRoutes from './roomRoutes';
import friendRoutes from './friendRoutes';
import userRoutes from './userRoutes';
import notificationRoutes from './notificationRoutes';
import messageRoutes from './messageRoutes';
import settingsRoutes from './settingsRoutes';
import avatarRoutes from './avatarRoutes';
import uploadRoutes from './uploadRoutes';
import storeRoutes from './storeRoutes';

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
