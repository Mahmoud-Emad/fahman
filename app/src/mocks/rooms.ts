/**
 * Mock room data for development
 * Replace with actual API calls in production
 */
import type { RoomData, EventData } from "@/components/rooms";

/**
 * Dummy popular rooms data
 */
export const MOCK_ROOMS: RoomData[] = [
  {
    id: "1",
    title: "Gaming Zone",
    description: "The ultimate gaming trivia room! Test your knowledge about video games, esports, and gaming culture.",
    logoInitials: "GZ",
    type: "public",
    users: [
      { id: "u1", initials: "AK" },
      { id: "u2", initials: "MJ" },
      { id: "u3", initials: "SR" },
    ],
    totalUsers: 128,
    questionsCount: 45,
    currentQuestion: 12,
    status: "playing",
  },
  {
    id: "2",
    title: "Chill Vibes",
    description: "Relax and enjoy casual trivia with friends. No pressure, just fun!",
    logoInitials: "CV",
    type: "public",
    users: [
      { id: "u4", initials: "LK" },
      { id: "u5", initials: "OP" },
    ],
    totalUsers: 56,
    questionsCount: 32,
    currentQuestion: 32,
    status: "playing",
  },
  {
    id: "3",
    title: "VIP Lounge",
    description: "Exclusive room for premium members. High-stakes trivia with amazing rewards.",
    logoInitials: "VL",
    type: "private",
    users: [
      { id: "u6", initials: "RK" },
      { id: "u7", initials: "TS" },
      { id: "u8", initials: "NM" },
    ],
    totalUsers: 24,
    questionsCount: 18,
    currentQuestion: 0,
    status: "waiting",
  },
  {
    id: "4",
    title: "Music Party",
    description: "Guess the song, artist, and album! Perfect for music lovers.",
    logoInitials: "MP",
    type: "public",
    users: [
      { id: "u9", initials: "DJ" },
      { id: "u10", initials: "BT" },
    ],
    totalUsers: 89,
    questionsCount: 56,
    currentQuestion: 56,
    status: "finished",
  },
  {
    id: "5",
    title: "Quiz Masters",
    description: "For the serious trivia enthusiasts. Challenge yourself with difficult questions.",
    logoInitials: "QM",
    type: "public",
    users: [
      { id: "u11", initials: "WZ" },
      { id: "u12", initials: "KL" },
      { id: "u13", initials: "PQ" },
    ],
    totalUsers: 67,
    questionsCount: 120,
    currentQuestion: 5,
    status: "playing",
  },
  {
    id: "6",
    title: "Elite Club",
    description: "Members-only room with curated questions and exclusive competitions.",
    logoInitials: "EC",
    type: "private",
    users: [
      { id: "u14", initials: "VV" },
      { id: "u15", initials: "AB" },
    ],
    totalUsers: 15,
    questionsCount: 25,
    currentQuestion: 25,
    status: "finished",
  },
];

/**
 * Dummy event data
 */
export const MOCK_EVENTS: EventData[] = [
  {
    id: "1",
    image_url: "ramadan",
    tag_title: "Ramadan",
    is_active: true,
    primary_color: "#F5A623",
    secondary_color: "#FFD54F",
  },
  {
    id: "2",
    image_url: "ramadan",
    tag_title: "Eid Special",
    is_active: true,
    primary_color: "#E65100",
    secondary_color: "#FF9800",
  },
];

/**
 * Room name options for generation
 */
const ROOM_NAMES = [
  "Fun House",
  "Trivia Night",
  "Brain Storm",
  "Quick Fire",
  "Challenge Arena",
  "Mind Games",
  "Party Room",
  "Social Hub",
  "Game Night",
  "Quiz Bowl",
];

/**
 * Room description options for generation
 */
const ROOM_DESCRIPTIONS = [
  "Join the fun and test your knowledge!",
  "Challenge your friends in exciting trivia battles.",
  "Put your thinking cap on for these brain teasers.",
  "Fast-paced questions for quick thinkers.",
  "Compete with the best in intense trivia matches.",
];

/**
 * Generate random rooms for explore section
 */
export function generateExploreRooms(startId: number, count: number): RoomData[] {
  const statuses: Array<"waiting" | "playing" | "finished"> = ["waiting", "playing", "finished"];

  return Array.from({ length: count }, (_, i) => {
    const id = startId + i;
    const nameIndex = id % ROOM_NAMES.length;
    const questionsCount = Math.floor(Math.random() * 80) + 10;
    const status = statuses[Math.floor(Math.random() * 3)];
    const currentQuestion =
      status === "waiting" ? 0 : status === "finished" ? questionsCount : Math.floor(Math.random() * questionsCount) + 1;

    return {
      id: String(id),
      title: ROOM_NAMES[nameIndex],
      description: ROOM_DESCRIPTIONS[id % ROOM_DESCRIPTIONS.length],
      logoInitials: ROOM_NAMES[nameIndex]
        .split(" ")
        .map((w) => w[0])
        .join(""),
      type: (Math.random() > 0.8 ? "private" : "public") as "public" | "private",
      users: [
        { id: `eu${id}1`, initials: "AB" },
        { id: `eu${id}2`, initials: "CD" },
      ],
      totalUsers: Math.floor(Math.random() * 100) + 5,
      questionsCount,
      currentQuestion,
      status,
    };
  });
}

/**
 * Shuffle array helper
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
