/**
 * Room Service - Re-export barrel for backwards compatibility
 * Core CRUD operations are in roomCoreService.ts
 * Member operations (join/leave/kick/ready/startGame) are in roomMembersService.ts
 */

import roomCoreService from './roomCoreService';
export { RoomCoreService } from './roomCoreService';

// Re-export the core service instance as the default for backwards compatibility
// All CRUD methods (createRoom, getPublicRooms, searchRooms, getPopularRooms,
// getRoomById, getRoomByCode, updateRoom, deleteRoom, getUserRooms) are on this instance.
// startGame has moved to roomMembersService.
export const RoomService = roomCoreService.constructor;
export default roomCoreService;
