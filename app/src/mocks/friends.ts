/**
 * Mock data for friends feature
 * Replace with actual API calls in production
 */
import type { Friend, FriendRequest } from "@/components/friends/types";

/**
 * Mock friends list
 */
export const MOCK_FRIENDS: Friend[] = [
  {
    id: "f1",
    name: "Sarah Ahmed",
    username: "@saraha",
    initials: "SA",
    status: "online",
    stats: { gamesPlayed: 120, wins: 65 },
  },
  {
    id: "f2",
    name: "Omar Khalid",
    username: "@omark",
    initials: "OK",
    status: "in_game",
    currentGame: "Pop Culture Trivia",
    stats: { gamesPlayed: 89, wins: 42 },
  },
  {
    id: "f3",
    name: "Fatima Hassan",
    username: "@fatimah",
    initials: "FH",
    status: "online",
    stats: { gamesPlayed: 156, wins: 98 },
  },
  {
    id: "f4",
    name: "Youssef Ali",
    username: "@youssefa",
    initials: "YA",
    status: "offline",
    lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    stats: { gamesPlayed: 45, wins: 20 },
  },
  {
    id: "f5",
    name: "Layla Mohammed",
    username: "@laylam",
    initials: "LM",
    status: "offline",
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    stats: { gamesPlayed: 200, wins: 130 },
  },
  {
    id: "f6",
    name: "Karim Nasser",
    username: "@karimn",
    initials: "KN",
    status: "in_game",
    currentGame: "Science Quiz",
    stats: { gamesPlayed: 78, wins: 35 },
  },
  {
    id: "f7",
    name: "Nour Saleh",
    username: "@nours",
    initials: "NS",
    status: "online",
    stats: { gamesPlayed: 112, wins: 67 },
  },
];

/**
 * Mock friend requests
 */
export const MOCK_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "fr1",
    from: {
      id: "u10",
      name: "Hana Ibrahim",
      username: "@hanai",
      initials: "HI",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: "fr2",
    from: {
      id: "u11",
      name: "Tariq Mansour",
      username: "@tariqm",
      initials: "TM",
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

/**
 * Get online friends count
 */
export function getOnlineFriendsCount(): number {
  return MOCK_FRIENDS.filter(
    (f) => f.status === "online" || f.status === "in_game"
  ).length;
}
