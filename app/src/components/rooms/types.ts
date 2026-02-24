/**
 * Room-related type definitions
 */

/**
 * Room user data for avatar display
 */
export interface RoomUser {
  id: string;
  initials: string;
  avatar?: string;
}

/**
 * Room data structure - matches backend API
 */
export interface RoomData {
  id: string;
  title: string;
  description?: string;
  logo?: any;
  logoInitials?: string;
  type: "public" | "private";
  users: RoomUser[];
  totalUsers: number;
  questionsCount: number;
  currentQuestion: number;
  status: "waiting" | "playing" | "finished";
}

/**
 * Event data structure - matches backend API
 * Colors are provided by backend (extracted when image is uploaded)
 */
export interface EventData {
  id: string;
  image_url: string;
  tag_title: string;
  is_active: boolean;
  /** Primary color extracted from image (provided by backend) */
  primary_color: string;
  /** Secondary/vibrant color extracted from image (provided by backend) */
  secondary_color: string;
}
