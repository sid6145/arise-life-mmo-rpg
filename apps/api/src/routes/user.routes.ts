import { Router, Response } from 'express';
import { prisma } from '@life-rpg/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/requireAuth';

const router: Router = Router();

// GET /api/users/me — Protected route returning User + Player + Attributes
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        player: {
          include: {
            attributes: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Standard 6 attributes list
    const ATTRIBUTE_KEYS = ['strength', 'charisma', 'dexterity', 'intelligence', 'vitality', 'endurance'];
    const attrMap = new Map((user.player?.attributes || []).map((a) => [a.attribute.toLowerCase(), a.points]));

    const computedAttributes = ATTRIBUTE_KEYS.map((attrKey) => {
      const points = attrMap.get(attrKey) || 0;
      // Formula: Every 50 attribute points = +1 Attribute Level (Starts at Level 1 with 0 points)
      // Level = Math.floor(points / 50) + 1
      // Current level progress = points % 50
      // Points to next level = 50 - (points % 50)
      const level = Math.floor(points / 50) + 1;
      const progress = points % 50;
      const pointsToNextLevel = 50 - progress;

      return {
        attribute: attrKey,
        points,
        level,
        progress,
        pointsToNextLevel,
        threshold: 50,
      };
    });

    return res.json({
      status: 'success',
      data: {
        ...user,
        player: user.player
          ? {
              ...user.player,
              computedAttributes,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[users/me] Error fetching user data:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve user profile',
    });
  }
});

export default router;
