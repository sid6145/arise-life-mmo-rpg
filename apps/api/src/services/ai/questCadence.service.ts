import { prisma } from '@life-rpg/db';
import type { QuestType, GeneratedSubquest } from '@life-rpg/types';
import { generateQuest } from './questGenerator.service';

// Structural types mirroring the Prisma schema — avoids importing the `Prisma`
// namespace (which lives in packages/db/node_modules) from the API package.

type SubQuestRow = {
  id: string;
  questId: string;
  title: string;
  xpReward: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type QuestWithSubquests = {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  type: string;
  xpReward: number;
  difficulty: number;
  status: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subquests: SubQuestRow[];
};

type GoalWithQuests = {
  id: string;
  playerId: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  weeklyReadiness: number;
  weeklyReadinessTarget: number;
  monthlyReadiness: number;
  monthlyReadinessTarget: number;
  lastWeeklyQuestId: string | null;
  lastMonthlyQuestId: string | null;
  createdAt: Date;
  updatedAt: Date;
  quests: QuestWithSubquests[];
};

type PlayerWithGoals = {
  id: string;
  userId: string;
  level: number;
  xp: number;
  streakCount: number;
  lastActivityDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  goals: GoalWithQuests[];
};

/**
 * Credit awarded to monthly readiness when a weekly quest expires or is skipped.
 * Provides partial credit (1 point) for attempting the cycle rather than leaving the player with 0 progress.
 */
export const EXPIRED_WEEKLY_MONTHLY_CREDIT = 1;

/**
 * Ensures a player's active goals have current, calibrated quests.
 * - Daily Quests: generated daily per goal (24h cadence, 1 active per goal per day).
 * - Weekly Quests: gated on weeklyReadiness >= weeklyReadinessTarget AND lastWeeklyQuestId is null.
 * - Monthly Quests: gated on monthlyReadiness >= monthlyReadinessTarget AND lastMonthlyQuestId is null.
 */
export async function ensureQuestsUpToDate(playerId: string): Promise<void> {
  try {
    const player: PlayerWithGoals | any = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        goals: {
          where: { status: 'active' },
          include: {
            quests: {
              include: {
                subquests: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      } as any,
    });

    if (!player || !player.goals || player.goals.length === 0) {
      return;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const playerLevel: number = player.level ?? 1;

    // Calculate real completion rate across all past quests
    const allPlayerQuests: QuestWithSubquests[] = player.goals.flatMap(
      (g: GoalWithQuests) => g.quests
    );
    const finishedQuests = allPlayerQuests.filter(
      (q: QuestWithSubquests) =>
        q.status === 'completed' || q.status === 'expired' || q.status === 'skipped'
    );
    const completedQuests = allPlayerQuests.filter(
      (q: QuestWithSubquests) => q.status === 'completed'
    );
    const recentCompletionRate: number =
      finishedQuests.length > 0
        ? completedQuests.length / finishedQuests.length
        : (player.streakCount ?? 0) > 0
          ? 0.85
          : 0.65;

    // 0. Auto-expire any active quests whose due date has passed
    const expiredQuests = allPlayerQuests.filter(
      (q: QuestWithSubquests) => q.status === 'active' && q.dueDate && new Date(q.dueDate) < now
    );
    const expiredQuestIds: string[] = expiredQuests.map((q: QuestWithSubquests) => q.id);

    if (expiredQuestIds.length > 0) {
      await prisma.quest.updateMany({
        where: {
          id: { in: expiredQuestIds },
          status: 'active',
        },
        data: {
          status: 'expired',
        },
      });

      // Handle expired weekly/monthly quests clearing their active pointer on goals
      for (const expQuest of expiredQuests) {
        if (expQuest.type === 'weekly') {
          // Expired weekly quest awards partial credit toward monthly readiness and clears active pointer
          await prisma.goal.update({
            where: { id: expQuest.goalId },
            data: {
              monthlyReadiness: { increment: EXPIRED_WEEKLY_MONTHLY_CREDIT },
              lastWeeklyQuestId: null,
            },
          });
        } else if (expQuest.type === 'monthly' || expQuest.type === 'boss') {
          await prisma.goal.update({
            where: { id: expQuest.goalId },
            data: {
              lastMonthlyQuestId: null,
            },
          });
        }
      }
    }

    for (const goal of player.goals) {
      // Refresh local quest list filtering out newly expired quests
      const goalQuests: QuestWithSubquests[] = goal.quests.map((q: QuestWithSubquests) =>
        expiredQuestIds.includes(q.id) ? { ...q, status: 'expired' } : q
      );

      // ==========================================
      // 1. DAILY QUEST CADENCE (Time-based daily reset)
      // ==========================================
      const activeDailyQuest = goalQuests.find(
        (q: QuestWithSubquests) =>
          q.type === 'daily' &&
          q.status === 'active' &&
          (!q.dueDate || new Date(q.dueDate) >= now)
      );

      const completedTodayDailyQuest = goalQuests.find(
        (q: QuestWithSubquests) =>
          q.type === 'daily' &&
          q.status === 'completed' &&
          new Date(q.updatedAt) >= startOfToday
      );

      // Only generate if no active daily quest AND none completed today
      if (!activeDailyQuest && !completedTodayDailyQuest) {
        let generated;
        try {
          generated = await generateQuest({
            goalTitle: goal.title,
            goalDescription: goal.description ?? undefined,
            playerLevel,
            questType: 'daily' as QuestType,
            recentCompletionRate,
          });
        } catch (err) {
          console.warn(`[cadence] AI quest generation failed for daily quest (goal ${goal.id}), using template fallback:`, err);
          generated = {
            title: `Daily Milestone: ${goal.title.slice(0, 40)}`,
            description: goal.description || `Maintain daily momentum towards: ${goal.title}`,
            type: 'daily' as const,
            xpReward: 50 * playerLevel,
            difficulty: Math.min(10, Math.max(1, playerLevel)),
            subquests: [
              { title: `Complete primary focus session for ${goal.title.slice(0, 30)}`, xpReward: 25 * playerLevel },
              { title: 'Log daily performance & review takeaways', xpReward: 25 * playerLevel },
            ],
          };
        }

        // Due at end of today (or 24h from now)
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);
        endOfToday.setMilliseconds(endOfToday.getMilliseconds() - 1);

        await prisma.quest.create({
          data: {
            goalId: goal.id,
            title: generated.title,
            description: generated.description,
            type: 'daily',
            xpReward: generated.xpReward,
            difficulty: generated.difficulty,
            status: 'active',
            dueDate: endOfToday,
            subquests: {
              create: generated.subquests.map((sq: GeneratedSubquest) => ({
                title: sq.title,
                xpReward: sq.xpReward,
                completed: false,
              })),
            },
          },
        });
      }

      // ==========================================
      // 2. WEEKLY QUEST CADENCE (Readiness Triggered)
      // Gated on: weeklyReadiness >= weeklyReadinessTarget AND lastWeeklyQuestId is null
      // ==========================================
      const hasActiveWeekly =
        Boolean(goal.lastWeeklyQuestId) ||
        goalQuests.some(
          (q: QuestWithSubquests) =>
            q.type === 'weekly' &&
            q.status === 'active' &&
            (!q.dueDate || new Date(q.dueDate) >= now)
        );

      if (!hasActiveWeekly && (goal.weeklyReadiness ?? 0) >= (goal.weeklyReadinessTarget ?? 7)) {
        // Calculate actual days taken to accumulate weekly readiness
        const pastDailies = goalQuests
          .filter((q: QuestWithSubquests) => q.type === 'daily' && q.status === 'completed')
          .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

        let readinessConsistencyDays = 7;
        if (pastDailies.length >= (goal.weeklyReadinessTarget ?? 7)) {
          const earliest = new Date(pastDailies[pastDailies.length - (goal.weeklyReadinessTarget ?? 7)].updatedAt);
          const latest = new Date(pastDailies[pastDailies.length - 1].updatedAt);
          readinessConsistencyDays = Math.max(
            1,
            Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) + 1
          );
        }

        let generated;
        try {
          generated = await generateQuest({
            goalTitle: goal.title,
            goalDescription: goal.description ?? undefined,
            playerLevel,
            questType: 'weekly' as QuestType,
            recentCompletionRate,
            readinessConsistencyDays,
          });
        } catch (err) {
          console.warn(`[cadence] AI quest generation failed for weekly boss challenge (goal ${goal.id}), using template fallback:`, err);
          const diffPace = readinessConsistencyDays <= 7 ? 5 : 3;
          generated = {
            title: `Weekly Boss Trial: ${goal.title.slice(0, 35)}`,
            description: `Readiness threshold unlocked! Complete this weekly milestone for: ${goal.title}`,
            type: 'weekly' as const,
            xpReward: 250 * playerLevel,
            difficulty: Math.min(10, Math.max(1, diffPace + Math.floor(playerLevel / 2))),
            subquests: [
              { title: `Execute intense milestone phase for ${goal.title.slice(0, 30)}`, xpReward: 125 * playerLevel },
              { title: 'Conduct comprehensive weekly debrief & metrics check', xpReward: 125 * playerLevel },
            ],
          };
        }

        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const createdWeeklyQuest = await prisma.quest.create({
          data: {
            goalId: goal.id,
            title: generated.title,
            description: generated.description,
            type: 'weekly',
            xpReward: generated.xpReward,
            difficulty: generated.difficulty,
            status: 'active',
            dueDate: nextWeek,
            subquests: {
              create: generated.subquests.map((sq: GeneratedSubquest) => ({
                title: sq.title,
                xpReward: sq.xpReward,
                completed: false,
              })),
            },
          },
        });

        // Set lastWeeklyQuestId and reset weeklyReadiness to 0 (readiness spent to trigger the challenge)
        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            lastWeeklyQuestId: createdWeeklyQuest.id,
            weeklyReadiness: 0,
          },
        });
      }

      // ==========================================
      // 3. MONTHLY / BOSS QUEST CADENCE (Readiness Triggered)
      // Gated on: monthlyReadiness >= monthlyReadinessTarget AND lastMonthlyQuestId is null
      // ==========================================
      const hasActiveMonthly =
        Boolean(goal.lastMonthlyQuestId) ||
        goalQuests.some(
          (q: QuestWithSubquests) =>
            (q.type === 'monthly' || q.type === 'boss') &&
            q.status === 'active' &&
            (!q.dueDate || new Date(q.dueDate) >= now)
        );

      if (!hasActiveMonthly && (goal.monthlyReadiness ?? 0) >= (goal.monthlyReadinessTarget ?? 4)) {
        const pastWeeklies = goalQuests
          .filter((q: QuestWithSubquests) => q.type === 'weekly' && (q.status === 'completed' || q.status === 'expired'))
          .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

        let readinessConsistencyDays = 28;
        if (pastWeeklies.length >= (goal.monthlyReadinessTarget ?? 4)) {
          const earliest = new Date(pastWeeklies[pastWeeklies.length - (goal.monthlyReadinessTarget ?? 4)].updatedAt);
          const latest = new Date(pastWeeklies[pastWeeklies.length - 1].updatedAt);
          readinessConsistencyDays = Math.max(
            7,
            Math.round((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)) + 7
          );
        }

        let generated;
        try {
          generated = await generateQuest({
            goalTitle: goal.title,
            goalDescription: goal.description ?? undefined,
            playerLevel,
            questType: 'monthly' as QuestType,
            recentCompletionRate,
            readinessConsistencyDays,
          });
        } catch (err) {
          console.warn(`[cadence] AI quest generation failed for monthly epic boss (goal ${goal.id}), using template fallback:`, err);
          generated = {
            title: `Epic Chapter Boss: Master of ${goal.title.slice(0, 30)}`,
            description: `Culmination of 4 weekly cycles! Overcome the monthly threshold for: ${goal.title}`,
            type: 'monthly' as const,
            xpReward: 1000 * playerLevel,
            difficulty: Math.min(10, 6 + Math.floor(playerLevel / 2)),
            subquests: [
              { title: `Conquer major milestone chapter for ${goal.title.slice(0, 30)}`, xpReward: 500 * playerLevel },
              { title: 'Publish or benchmark full progress report & achievements', xpReward: 500 * playerLevel },
            ],
          };
        }

        const nextMonth = new Date(now);
        nextMonth.setDate(nextMonth.getDate() + 30);

        const createdMonthlyQuest = await prisma.quest.create({
          data: {
            goalId: goal.id,
            title: generated.title,
            description: generated.description,
            type: 'monthly',
            xpReward: generated.xpReward,
            difficulty: generated.difficulty,
            status: 'active',
            dueDate: nextMonth,
            subquests: {
              create: generated.subquests.map((sq: GeneratedSubquest) => ({
                title: sq.title,
                xpReward: sq.xpReward,
                completed: false,
              })),
            },
          },
        });

        // Set lastMonthlyQuestId and reset monthlyReadiness to 0
        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            lastMonthlyQuestId: createdMonthlyQuest.id,
            monthlyReadiness: 0,
          },
        });
      }
    }
  } catch (error) {
    console.error('[questCadence] Error in ensureQuestsUpToDate:', error);
  }
}

