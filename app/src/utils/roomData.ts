/**
 * Room data utilities
 * Helpers for constructing room data for navigation
 */
import type { RoomInviteData } from "@/components/messaging/types";

/**
 * Room data structure for navigation
 */
export interface RoomNavigationData {
  room: {
    id: string;
    title: string;
    type: "public" | "private";
    users: never[];
    totalUsers: number;
    questionsCount: number;
    currentQuestion: number;
    status: "waiting" | "in_progress" | "finished";
  };
  roomCode: string;
  password?: string;
}

/**
 * Action data from room invite notifications
 */
interface RoomInviteActionData {
  packId: string;
  packName: string;
  roomCode: string;
  password?: string;
}

/**
 * Build room navigation data from notification action data
 */
export function buildRoomDataFromNotification(
  actionData: RoomInviteActionData
): RoomNavigationData {
  return {
    room: {
      id: actionData.packId,
      title: actionData.packName,
      type: actionData.password ? "private" : "public",
      users: [],
      totalUsers: 1,
      questionsCount: 20,
      currentQuestion: 1,
      status: "waiting",
    },
    roomCode: actionData.roomCode,
    password: actionData.password,
  };
}

/**
 * Build room navigation data from chat invite
 */
export function buildRoomDataFromChatInvite(
  invite: RoomInviteData
): RoomNavigationData {
  return {
    room: {
      id: invite.packId,
      title: invite.packName,
      type: invite.password ? "private" : "public",
      users: [],
      totalUsers: invite.currentPlayers,
      questionsCount: 20,
      currentQuestion: 1,
      status: "waiting",
    },
    roomCode: invite.roomCode,
    password: invite.password,
  };
}
