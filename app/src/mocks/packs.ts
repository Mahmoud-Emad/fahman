/**
 * Mock pack data for development
 * Replace with actual API calls in production
 */
import type { PackData } from "@/components/packs/types";

/**
 * Suggested packs for the user
 */
export const MOCK_SUGGESTED_PACKS: PackData[] = [
  {
    id: "s1",
    title: "General Knowledge",
    questionsCount: 25,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/knowledge/200",
  },
  {
    id: "s2",
    title: "Sports Trivia",
    questionsCount: 20,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/sports/200",
  },
  {
    id: "s3",
    title: "Movie Quotes",
    questionsCount: 15,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/movies/200",
  },
];

/**
 * User's owned packs
 */
export const MOCK_OWNED_PACKS: PackData[] = [
  {
    id: "o1",
    title: "My Fun Pack",
    questionsCount: 12,
    isPublic: false,
    isOwned: true,
  },
];

/**
 * Popular packs in the app
 */
export const MOCK_POPULAR_PACKS: PackData[] = [
  {
    id: "p1",
    title: "Music Hits",
    questionsCount: 25,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/music/200",
  },
  {
    id: "p2",
    title: "Science Facts",
    questionsCount: 20,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/science/200",
  },
  {
    id: "p3",
    title: "History Quiz",
    questionsCount: 18,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/history/200",
  },
  {
    id: "p4",
    title: "Food & Drinks",
    questionsCount: 15,
    isPublic: true,
    logoUri: "https://picsum.photos/seed/food/200",
  },
];

/**
 * All available packs combined
 */
export const MOCK_ALL_PACKS: PackData[] = [
  ...MOCK_SUGGESTED_PACKS,
  ...MOCK_OWNED_PACKS,
  ...MOCK_POPULAR_PACKS,
];
