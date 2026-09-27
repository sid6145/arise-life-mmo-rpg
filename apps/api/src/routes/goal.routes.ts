import { Router, Response } from 'express';
import { prisma } from '@life-rpg/db';
import type { GeneratedQuest, GeneratedSubquest } from '@life-rpg/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { generateQuest } from '../services/ai/questGenerator.service';
import { computePeriodKey, computePeriodDueDate } from '../utils/calendarPeriod';

const router: Router = Router();

// GET /api/goals — List all goals for authenticated player
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const goals = await prisma.goal.findMany({
      where: { playerId: player.id },
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

    return res.status(200).json({
      status: 'success',
      data: goals,
    });
  } catch (error) {
    console.error('[goals/list] Error retrieving goals:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve goals',
    });
  }
});

// POST /api/goals — Create a new goal and auto-generate the first daily quest
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, category, primaryAttribute, secondaryAttribute } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Goal title is required',
      });
    }

    const resolvedPrimaryAttr = (primaryAttribute || category || 'strength').toLowerCase().trim();
    const validAttributes = ['strength', 'charisma', 'dexterity', 'intelligence', 'vitality', 'endurance'];
    const finalPrimaryAttr = validAttributes.includes(resolvedPrimaryAttr) ? resolvedPrimaryAttr : 'strength';
    const finalSecondaryAttr = secondaryAttribute && validAttributes.includes(secondaryAttribute.toLowerCase().trim())
      ? secondaryAttribute.toLowerCase().trim()
      : null;

    // 1. Ensure Player record exists
    let player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          userId,
          level: 1,
          xp: 0,
          streakCount: 0,
        },
      });
    }

    const playerLevel = player.level ?? 1;
    const recentCompletionRate = player.streakCount > 0 ? 0.85 : 0.6;

    // 2. Generate initial daily quest with AI
    let generatedQuest: GeneratedQuest;
    try {
      generatedQuest = await generateQuest({
        goalTitle: title.trim(),
        goalDescription: description?.trim() || undefined,
        playerLevel,
        questType: 'daily',
        recentCompletionRate,
      });
    } catch (aiErr) {
      console.warn('[goals/create] AI quest generation failed, using fallback starter template:', aiErr);
      // Fallback only if AI service is completely down during goal creation
      generatedQuest = {
        title: `Daily Milestone: ${title.trim().slice(0, 40)}`,
        description: description?.trim() || `Take concrete daily action towards: ${title.trim()}`,
        type: 'daily' as const,
        xpReward: 50 * playerLevel,
        difficulty: 2,
        subquests: [
          { title: `Complete first action step for ${title.trim().slice(0, 30)}`, xpReward: 25 * playerLevel },
          { title: 'Log progress and review takeaways', xpReward: 25 * playerLevel },
        ],
      };
    }

    // 3. Compute calendar boundary due date & periodKey
    const now = new Date();
    const dueDate = computePeriodDueDate(now, generatedQuest.type);
    const periodKey = computePeriodKey(now, generatedQuest.type);

    // 4. Persist Goal + Quest + SubQuests in DB
    const createdGoal = await prisma.goal.create({
      data: {
        playerId: player.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || finalPrimaryAttr,
        primaryAttribute: finalPrimaryAttr,
        secondaryAttribute: finalSecondaryAttr,
        status: 'active',
        quests: {
          create: {
            title: generatedQuest.title,
            description: generatedQuest.description,
            type: generatedQuest.type,
            periodKey,
            xpReward: generatedQuest.xpReward,
            difficulty: generatedQuest.difficulty,
            status: 'active',
            dueDate,
            subquests: {
              create: generatedQuest.subquests.map((sq: GeneratedSubquest) => ({
                title: sq.title,
                xpReward: sq.xpReward,
                completed: false,
              })),
            },
          },
        },
      },
      include: {
        quests: {
          include: {
            subquests: true,
          },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      data: createdGoal,
    });
  } catch (error) {
    console.error('[goals/create] Error creating goal:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to create goal',
    });
  }
});

// PATCH /api/goals/:id — Update goal status (active/paused/completed)
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status, title, description, category, primaryAttribute, secondaryAttribute } = req.body;

    const player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const existingGoal = await prisma.goal.findFirst({
      where: { id, playerId: player.id },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category && { category: category.trim() }),
        ...(primaryAttribute && { primaryAttribute: primaryAttribute.toLowerCase().trim() }),
        ...(secondaryAttribute !== undefined && { secondaryAttribute: secondaryAttribute ? secondaryAttribute.toLowerCase().trim() : null }),
      },
      include: {
        quests: {
          include: {
            subquests: true,
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: updatedGoal,
    });
  } catch (error) {
    console.error('[goals/update] Error updating goal:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update goal',
    });
  }
});

// DELETE /api/goals/:id — Delete a goal
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const player = await prisma.player.findUnique({
      where: { userId },
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const existingGoal = await prisma.goal.findFirst({
      where: { id, playerId: player.id },
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await prisma.goal.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    console.error('[goals/delete] Error deleting goal:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete goal',
    });
  }
});

export default router;
