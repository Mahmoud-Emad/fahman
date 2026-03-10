/**
 * Achievement Seed Data
 * Defines all achievement types with their rule-based conditions.
 */

export const ACHIEVEMENT_SEEDS = [
  {
    slug: 'la3eeb',
    name: 'La3eeb',
    description: 'Join more than 50 rooms',
    conditions: { rooms_joined: { gte: 50 } },
    sortOrder: 1,
  },
  {
    slug: '7akawaty',
    name: '7akawaty',
    description: 'Join more than 25 rooms',
    conditions: { rooms_joined: { gte: 25 } },
    sortOrder: 2,
  },
  {
    slug: 'mo2alef',
    name: 'Mo2alef',
    description: 'Create your first pack',
    conditions: { packs_created: { gte: 1 } },
    sortOrder: 3,
  },
  {
    slug: '7awartagy',
    name: '7awartagy',
    description: 'Create 5 packs',
    conditions: { packs_created: { gte: 5 } },
    sortOrder: 4,
  },
  {
    slug: 'mazagangi',
    name: 'Mazagangi',
    description: 'Create 5 rooms',
    conditions: { rooms_created: { gte: 5 } },
    sortOrder: 5,
  },
  {
    slug: 'mashhoor',
    name: 'Mashhoor',
    description: 'Get 25 friends',
    conditions: { friends: { gte: 25 } },
    sortOrder: 6,
  },
  {
    slug: 'laz2a',
    name: 'Laz2a',
    description: 'Log in for 100 consecutive days',
    conditions: { current_streak: { gte: 100 } },
    sortOrder: 7,
  },
  {
    slug: 'comanda',
    name: 'Comanda',
    description: 'Win 10 games',
    conditions: { wins: { gte: 10 } },
    sortOrder: 8,
  },
  {
    slug: 'king-of-games',
    name: 'King of Games',
    description: 'Win 100 games',
    conditions: { wins: { gte: 100 } },
    sortOrder: 9,
  },
  {
    slug: 'fahman',
    name: 'Fahman',
    description: 'Have 50+ friends, join 100+ rooms, and win 100+ games',
    conditions: {
      AND: [
        { friends: { gte: 50 } },
        { rooms_joined: { gte: 100 } },
        { wins: { gte: 100 } },
      ],
    },
    sortOrder: 10,
  },
];
