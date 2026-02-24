/**
 * Game configuration constants
 * Centralizes magic numbers for easy modification
 */

/**
 * Game timing configuration (in seconds unless noted)
 */
export const GAME_TIMING = {
  /** Default timer duration for answering questions */
  DEFAULT_TIMER_DURATION: 20,
  /** Low time warning threshold (shows warning color) */
  LOW_TIME_WARNING: 10,
  /** Critical time threshold (shows error color) */
  CRITICAL_TIME: 5,
} as const;

/**
 * Betting configuration
 */
export const BETTING = {
  /** Default maximum bet value */
  DEFAULT_MAX_BET: 10,
  /** Minimum bet value */
  MIN_BET: 1,
  /** Maximum possible bet value */
  MAX_POSSIBLE_BET: 20,
} as const;

/**
 * Question configuration
 */
export const QUESTIONS = {
  /** Default total questions per game */
  DEFAULT_TOTAL: 20,
  /** Minimum questions per game */
  MIN_QUESTIONS: 5,
  /** Maximum questions per game */
  MAX_QUESTIONS: 100,
} as const;

/**
 * UI timing configuration (in milliseconds)
 */
export const UI_TIMING = {
  /** Event carousel auto-scroll interval */
  EVENT_CHANGE_INTERVAL: 30000,
  /** Modal close animation delay before navigation */
  MODAL_CLOSE_DELAY: 350,
  /** Delay between closing one modal and opening another */
  MODAL_TRANSITION_DELAY: 300,
  /** Loading simulation delay for modals */
  LOADING_SIMULATION_DELAY: 800,
  /** Auto-scroll chat delay */
  CHAT_AUTO_SCROLL_DELAY: 100,
} as const;

/**
 * Mock data loading delays (in milliseconds)
 * These simulate network latency during development
 */
export const MOCK_DELAYS = {
  /** Initial data load delay */
  INITIAL_LOAD: 1500,
  /** Refresh data delay */
  REFRESH: 1000,
  /** Load more (pagination) delay */
  LOAD_MORE: 1000,
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION = {
  /** Number of rooms to load per page */
  ROOMS_PER_PAGE: 10,
  /** Initial explore room ID offset */
  INITIAL_EXPLORE_ID: 100,
  /** Scroll threshold for infinite scroll (pixels from bottom) */
  SCROLL_THRESHOLD: 50,
} as const;

/**
 * Input validation limits
 */
export const INPUT_LIMITS = {
  /** Maximum room ID length */
  MAX_ROOM_ID_LENGTH: 15,
  /** Maximum room title length */
  MAX_ROOM_TITLE_LENGTH: 50,
  /** Maximum answer length */
  MAX_ANSWER_LENGTH: 200,
  /** Maximum chat message length */
  MAX_CHAT_MESSAGE_LENGTH: 500,
} as const;

/**
 * Score configuration
 */
export const SCORING = {
  /** Points for correct answer (base) */
  CORRECT_ANSWER_BASE: 5,
  /** Points deducted for incorrect answer (base) */
  INCORRECT_ANSWER_PENALTY: 5,
} as const;

/**
 * Player limits
 */
export const PLAYER_LIMITS = {
  /** Maximum players shown in avatar stack */
  MAX_AVATAR_STACK: 4,
  /** Maximum players shown on podium */
  PODIUM_SIZE: 3,
} as const;

/**
 * Pack creation limits
 * Note: Backend enforces 5-15 questions for publishing
 */
export const PACK_LIMITS = {
  /** Maximum pack title length */
  TITLE_MAX_LENGTH: 200,
  /** Maximum pack description length */
  DESCRIPTION_MAX_LENGTH: 1000,
  /** Minimum questions per pack (to publish) */
  MIN_QUESTIONS: 5,
  /** Maximum questions per pack */
  MAX_QUESTIONS: 15,
  /** Minimum answers per question (correct answers for auto-correction) */
  MIN_ANSWERS_PER_QUESTION: 1,
  /** Maximum answers per question */
  MAX_ANSWERS_PER_QUESTION: 6,
  /** Maximum question text length */
  QUESTION_TEXT_MAX_LENGTH: 1000,
  /** Maximum answer text length */
  ANSWER_TEXT_MAX_LENGTH: 100,
} as const;

/**
 * Room configuration limits
 */
export const ROOM_LIMITS = {
  /** Maximum room title length */
  TITLE_MAX_LENGTH: 50,
  /** Maximum room description length */
  DESCRIPTION_MAX_LENGTH: 200,
  /** Minimum players per room */
  MIN_PLAYERS: 2,
  /** Maximum players per room */
  MAX_PLAYERS: 50,
  /** Default max players */
  DEFAULT_MAX_PLAYERS: 8,
  /** Maximum room password length */
  PASSWORD_MAX_LENGTH: 20,
} as const;
