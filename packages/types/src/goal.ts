export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  playerId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: GoalStatus;
  weeklyReadiness: number;
  weeklyReadinessTarget: number;
  monthlyReadiness: number;
  monthlyReadinessTarget: number;
  lastWeeklyQuestId?: string | null;
  lastMonthlyQuestId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: string;
}
