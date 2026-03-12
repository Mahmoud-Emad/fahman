/**
 * Types for pack creation and selection
 */

/**
 * Pack data structure (for display/selection)
 */
export interface PackData {
  id: string;
  title: string;
  description?: string;
  logoUri?: string;
  logoInitials?: string;
  isPublic: boolean;
  questionsCount: number;
  createdBy?: string;
  isOwned?: boolean;
  /** Whether this pack is from the store (TOML-loaded) */
  isStorePack?: boolean;
  /** Original store pack ID (e.g. "free/pack1") */
  storePackId?: string;
  /** Price in coins (0 = free, >0 = paid) */
  price?: number;
}

/**
 * Question form data for pack creation
 */
export interface QuestionFormData {
  id: string;
  text: string;
  answers: string[];
  /** Indices of correct answers (all answers are correct in fill-in-the-blank style) */
  correctAnswerIndices: number[];
  imageUri: string | null;
  isExpanded: boolean;
}

/**
 * Pack form data for creation/editing
 */
export interface PackFormData {
  title: string;
  description: string;
  textHint: string;
  logoUri: string | null;
  isPublic: boolean;
  questions: QuestionFormData[];
}

/**
 * Form validation errors
 */
export interface PackFormErrors {
  title?: string;
  description?: string;
  questions?: string;
  questionErrors: Record<string, QuestionError>;
}

/**
 * Per-question validation errors
 */
export interface QuestionError {
  text?: string;
  answers?: string;
  correctAnswers?: string;
}

/**
 * Room configuration form data
 */
export interface RoomConfigData {
  packId: string;
  title: string;
  description: string;
  maxPlayers: number;
  isPublic: boolean;
  isPasswordProtected: boolean;
  password: string;
}

/**
 * Room configuration validation errors
 */
export interface RoomConfigErrors {
  title?: string;
  description?: string;
  maxPlayers?: string;
  password?: string;
}

/**
 * Pack section type for the selection modal
 */
export type PackSectionType = "suggested" | "owned" | "popular" | "store";

/**
 * Pack section data
 */
export interface PackSectionData {
  type: PackSectionType;
  title: string;
  packs: PackData[];
  showCreateButton?: boolean;
}
