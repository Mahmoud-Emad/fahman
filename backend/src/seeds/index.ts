/**
 * Database Seed Script
 * Populates database with test data
 */

import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../shared/utils/passwordUtils';
import { ACHIEVEMENT_SEEDS } from './achievements';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('Seeding users...');

  const users = [
    {
      username: 'admin',
      email: 'admin@fahman.com',
      password: 'Admin123!',
      role: Role.ADMIN,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    {
      username: 'testuser1',
      email: 'user1@test.com',
      password: 'Test123!',
      role: Role.NORMAL,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
    },
    {
      username: 'testuser2',
      email: 'user2@test.com',
      password: 'Test123!',
      role: Role.NORMAL,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
    },
  ];

  for (const userData of users) {
    const { password, ...rest } = userData;
    const passwordHash = await hashPassword(password);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...rest,
        passwordHash,
      },
    });
  }

  console.log('Users seeded successfully');
}

async function seedPacks() {
  console.log('Seeding packs...');

  const admin = await prisma.user.findUnique({
    where: { email: 'admin@fahman.com' },
  });

  if (!admin) {
    console.error('Admin user not found');
    return;
  }

  const standardPack = await prisma.pack.create({
    data: {
      creatorId: admin.id,
      title: 'General Trivia Starter',
      description: 'A mix of easy questions to get you started',
      category: 'trivia',
      difficulty: 'EASY',
      isStandard: true,
      visibility: 'PUBLIC',
      price: 0,
      isPublished: true,
      questions: {
        create: [
          {
            text: 'What is the capital of France?',
            options: JSON.stringify(['London', 'Berlin', 'Paris', 'Madrid']),
            correctAnswers: JSON.stringify([2]),
            questionType: 'SINGLE',
            timeLimit: 30,
            points: 100,
            orderIndex: 1,
          },
          {
            text: 'Which planet is known as the Red Planet?',
            options: JSON.stringify(['Venus', 'Mars', 'Jupiter', 'Saturn']),
            correctAnswers: JSON.stringify([1]),
            questionType: 'SINGLE',
            timeLimit: 30,
            points: 100,
            orderIndex: 2,
          },
          {
            text: 'How many continents are there?',
            options: JSON.stringify(['5', '6', '7', '8']),
            correctAnswers: JSON.stringify([2]),
            questionType: 'SINGLE',
            timeLimit: 30,
            points: 100,
            orderIndex: 3,
          },
          {
            text: 'What is the largest ocean on Earth?',
            options: JSON.stringify(['Atlantic', 'Indian', 'Arctic', 'Pacific']),
            correctAnswers: JSON.stringify([3]),
            questionType: 'SINGLE',
            timeLimit: 30,
            points: 100,
            orderIndex: 4,
          },
          {
            text: 'Who painted the Mona Lisa?',
            options: JSON.stringify(['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo']),
            correctAnswers: JSON.stringify([1]),
            questionType: 'SINGLE',
            timeLimit: 30,
            points: 100,
            orderIndex: 5,
          },
        ],
      },
    },
  });

  console.log(`Created pack: ${standardPack.title}`);
  console.log('Packs seeded successfully');
}

async function seedAchievements() {
  console.log('Seeding achievements...');

  for (const achievement of ACHIEVEMENT_SEEDS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {
        name: achievement.name,
        description: achievement.description,
        conditions: achievement.conditions,
        sortOrder: achievement.sortOrder,
      },
      create: {
        slug: achievement.slug,
        name: achievement.name,
        description: achievement.description,
        conditions: achievement.conditions,
        sortOrder: achievement.sortOrder,
      },
    });
  }

  console.log(`Seeded ${ACHIEVEMENT_SEEDS.length} achievements`);
}

async function main() {
  try {
    console.log('Starting seed process...');

    await seedUsers();
    await seedPacks();
    await seedAchievements();

    console.log('Seed process completed successfully!');
  } catch (error) {
    console.error('Seed process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
