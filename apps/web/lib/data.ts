import { cache } from 'react';
import { prisma } from '@life-rpg/db';

/**
 * Request-scoped cached helper to get the authenticated player and their active goals/quests.
 * React cache() deduplicates calls made in layout.tsx and page.tsx during the same render cycle.
 */
export const getCachedPlayer = cache(async (userId: string) => {
  return prisma.player.findUnique({
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
});

export const getCachedGoals = cache(async (playerId: string) => {
  return prisma.goal.findMany({
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
});

export const getCachedQuest = cache(async (questId: string) => {
  return prisma.quest.findUnique({
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
});
