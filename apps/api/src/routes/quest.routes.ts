import { Router, Response } from 'express';
import { prisma } from '@life-rpg/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';
import { ensureQuestsUpToDate } from '../services/ai/questCadence.service';

const router: Router = Router();

// GET /api/quests — List player's active quests (auto-ensuring daily/weekly/monthly cadence)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

    // Step 3: Run cadence check and auto-generate any missing daily/weekly/monthly quests
    await ensureQuestsUpToDate(player.id);

    // Step 4: Fetch all active quests with subquests for player's active goals
    const quests = await prisma.quest.findMany({
      where: {
        goal: {
          playerId: player.id,
          status: 'active',
        },
        status: 'active',
      },
      include: {
        subquests: {
          orderBy: { createdAt: 'asc' },
        },
        goal: {
          select: {
            id: true,
            title: true,
            category: true,
            weeklyReadiness: true,
            weeklyReadinessTarget: true,
            monthlyReadiness: true,
            monthlyReadinessTarget: true,
            lastWeeklyQuestId: true,
            lastMonthlyQuestId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: quests,
    });
  } catch (error) {
    console.error('[quests/list] Error fetching quests:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve quests',
    });
  }
});

// GET /api/quests/:id — Retrieve specific quest detail
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const quest = await prisma.quest.findFirst({
      where: {
        id,
        goal: {
          player: {
            userId,
          },
        },
      },
      include: {
        subquests: {
          orderBy: { createdAt: 'asc' },
        },
        goal: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    });

    if (!quest) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Quest '${id}' not found`,
      });
    }

    return res.status(200).json({
      status: 'success',
      data: quest,
    });
  } catch (error) {
    console.error('[quests/getById] Error fetching quest:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve quest detail',
    });
  }
});

// PATCH /api/quests/:id/complete — Mark quest as completed and award XP
router.patch('/:id/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const quest = await prisma.quest.findFirst({
      where: {
        id,
        goal: {
          player: {
            userId,
          },
        },
      },
      include: {
        subquests: true,
        goal: {
          include: {
            player: true,
          },
        },
      },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    if (quest.status === 'completed') {
      return res.status(400).json({ error: 'Quest is already completed' });
    }

    const player = quest.goal.player;
    const goal = quest.goal;
    const newXp = player.xp + quest.xpReward;
    const newLevel = Math.max(player.level, Math.floor(newXp / 1000) + 1);

    // Calculate Goal readiness updates based on quest type
    let goalUpdateData: Record<string, any> = {};
    if (quest.type === 'daily') {
      // Increments parent Goal's weeklyReadiness by 1 toward unlocking the weekly challenge
      goalUpdateData = {
        weeklyReadiness: { increment: 1 },
      };
    } else if (quest.type === 'weekly') {
      // Increments monthlyReadiness by 1, and clears lastWeeklyQuestId so a new one can eventually generate
      goalUpdateData = {
        monthlyReadiness: { increment: 1 },
        lastWeeklyQuestId: null,
      };
    } else if (quest.type === 'monthly' || quest.type === 'boss') {
      // Monthly completion resets the full cycle: monthlyReadiness and weeklyReadiness to 0, clears lastMonthlyQuestId
      goalUpdateData = {
        weeklyReadiness: 0,
        monthlyReadiness: 0,
        lastMonthlyQuestId: null,
      };
    }

    // Attribute point progression formula:
    // - Daily quest: +1 primary attribute point
    // - Weekly quest: +3 primary attribute points
    // - Monthly / Boss quest: +10 primary attribute points
    // - Secondary attribute (if configured on Goal): Math.max(1, Math.floor(primaryPoints / 2))
    let primaryPointsAward = 1;
    if (quest.type === 'weekly') {
      primaryPointsAward = 3;
    } else if (quest.type === 'monthly' || quest.type === 'boss') {
      primaryPointsAward = 10;
    }

    const primaryAttr = (goal.primaryAttribute || goal.category || 'strength').toLowerCase().trim();
    const secondaryAttr = goal.secondaryAttribute ? goal.secondaryAttribute.toLowerCase().trim() : null;
    const secondaryPointsAward = secondaryAttr ? Math.max(1, Math.floor(primaryPointsAward / 2)) : 0;

    const attributeUpdates: any[] = [];
    if (primaryAttr) {
      attributeUpdates.push(
        prisma.playerAttribute.upsert({
          where: {
            playerId_attribute: {
              playerId: player.id,
              attribute: primaryAttr,
            },
          },
          update: {
            points: { increment: primaryPointsAward },
          },
          create: {
            playerId: player.id,
            attribute: primaryAttr,
            points: primaryPointsAward,
          },
        })
      );
    }

    if (secondaryAttr && secondaryAttr !== primaryAttr) {
      attributeUpdates.push(
        prisma.playerAttribute.upsert({
          where: {
            playerId_attribute: {
              playerId: player.id,
              attribute: secondaryAttr,
            },
          },
          update: {
            points: { increment: secondaryPointsAward },
          },
          create: {
            playerId: player.id,
            attribute: secondaryAttr,
            points: secondaryPointsAward,
          },
        })
      );
    }

    // Update quest, subquests, player XP/level, goal readiness, and attribute points in single atomic transaction
    const [updatedQuest, updatedPlayer, updatedGoal, ...updatedAttributes] = await prisma.$transaction([
      prisma.quest.update({
        where: { id },
        data: {
          status: 'completed',
          subquests: {
            updateMany: {
              where: { completed: false },
              data: { completed: true },
            },
          },
        },
        include: {
          subquests: true,
        },
      }),
      prisma.player.update({
        where: { id: player.id },
        data: {
          xp: newXp,
          level: newLevel,
          streakCount: player.streakCount + (player.streakCount === 0 ? 1 : 0),
          lastActivityDate: new Date(),
        },
      }),
      ...(Object.keys(goalUpdateData).length > 0
        ? [
            prisma.goal.update({
              where: { id: goal.id },
              data: goalUpdateData,
            }),
          ]
        : []),
      ...attributeUpdates,
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        quest: updatedQuest,
        player: updatedPlayer,
        goal: updatedGoal,
        xpGained: quest.xpReward,
        attributes: updatedAttributes,
        attributeAwards: {
          primary: { attribute: primaryAttr, points: primaryPointsAward },
          ...(secondaryAttr ? { secondary: { attribute: secondaryAttr, points: secondaryPointsAward } } : {}),
        },
      },
    });
  } catch (error) {
    console.error('[quests/complete] Error completing quest:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete quest',
    });
  }
});

// PATCH /api/quests/:id/subquests/:subquestId — Toggle subquest completion
router.patch(
  '/:id/subquests/:subquestId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, subquestId } = req.params;
      const { completed } = req.body;

      const subquest = await prisma.subQuest.findFirst({
        where: {
          id: subquestId,
          questId: id,
          quest: {
            goal: {
              player: {
                userId,
              },
            },
          },
        },
      });

      if (!subquest) {
        return res.status(404).json({ error: 'Subquest not found' });
      }

      const updatedSubquest = await prisma.subQuest.update({
        where: { id: subquestId },
        data: {
          completed: typeof completed === 'boolean' ? completed : !subquest.completed,
        },
      });

      return res.status(200).json({
        status: 'success',
        data: updatedSubquest,
      });
    } catch (error) {
      console.error('[quests/toggleSubquest] Error toggling subquest:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update subquest',
      });
    }
  }
);

export default router;
