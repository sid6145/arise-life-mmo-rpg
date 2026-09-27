import { z } from 'zod';

export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EPIC';
export type QuestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export const QuestTypeEnum = z.enum(['daily', 'weekly', 'monthly', 'boss', 'emergency']);
export type QuestType = z.infer<typeof QuestTypeEnum>;

export const GeneratedSubquestSchema = z.object({
  title: z.string().min(1, 'Subquest title is required'),
  xpReward: z.number().int().nonnegative(),
});

export const GeneratedQuestSchema = z.object({
  title: z.string().min(1, 'Quest title is required'),
  description: z.string(),
  type: QuestTypeEnum,
  xpReward: z.number().int().nonnegative(),
  difficulty: z.number().int().min(1).max(10),
  subquests: z.array(GeneratedSubquestSchema),
});

export type GeneratedSubquest = z.infer<typeof GeneratedSubquestSchema>;
export type GeneratedQuest = z.infer<typeof GeneratedQuestSchema>;

export interface Quest {
  id: string;
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  xpReward: number;
  playerId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateQuestInput {
  goalTitle: string;
  goalDescription?: string;
  playerLevel: number;
  questType: QuestType;
  recentCompletionRate?: number; // e.g. 0.0 to 1.0 (or percentage 0 to 100)
  /**
   * Actual days taken to accumulate required readiness target.
   * Allows AI to calibrate quest difficulty to real consistency vs pacing delays (e.g. 7 days vs 12 days).
   */
  readinessConsistencyDays?: number;
}
