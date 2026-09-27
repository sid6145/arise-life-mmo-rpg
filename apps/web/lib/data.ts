import { cache } from 'react';
import { prisma } from '@life-rpg/db';

/**
 * Request-scoped cached helper to get the authenticated player and their active goals/quests.
 * React cache() deduplicates calls made in layout.tsx and page.tsx during the same render cycle.
 */
export const getCachedPlayer = cache(async (userId: string) => {
  try {
    return await prisma.player.findUnique({
      where: { userId },
      include: {
        attributes: true,
        goals: {
          where: { status: 'active' },
          include: {
            quests: {
              where: { status: 'active' },
              include: {
                subquests: {
                  orderBy: { createdAt: 'asc' },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  } catch (error) {
    console.error('[getCachedPlayer error]:', error);
    return null;
  }
});

export const getCachedGoals = cache(async (playerId: string) => {
  try {
    return await prisma.goal.findMany({
      where: { playerId },
      include: {
        quests: {
          include: {
            subquests: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('[getCachedGoals error]:', error);
    return [];
  }
});

export const getCachedQuest = cache(async (questId: string) => {
  try {
    return await prisma.quest.findUnique({
      where: { id: questId },
      include: {
        subquests: {
          orderBy: { createdAt: 'asc' },
        },
        goal: {
          select: {
            id: true,
            title: true,
            category: true,
            playerId: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('[getCachedQuest error]:', error);
    return null;
  }
});
