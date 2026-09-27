# Life RPG — AI Quest Generation & Readiness Specification (`quest-ai.md`)

> **IMPORTANT SOURCE OF TRUTH**:
> This file is the source of truth for OpenRouter prompt construction and AI quest scheduling. Any model swap must be validated against this contract before deploying.

---

## 1. Readiness Accumulation Mechanic

Weekly and monthly quests in Life RPG are gated on **accumulated readiness** from daily quest completions rather than elapsed calendar time alone.

### 1.1 Readiness Model Fields (Prisma Schema: `Goal`)
- `weeklyReadiness (Int, default 0)`: Increments each time a daily quest under this goal is completed; represents progress toward unlocking the next weekly boss challenge.
- `weeklyReadinessTarget (Int, default 7)`: The threshold `weeklyReadiness` must reach to unlock a weekly quest (default 7, matching 7 completed dailies).
- `monthlyReadiness (Int, default 0)`: Increments each time a weekly quest is completed or resolved/expired; represents progress toward unlocking the monthly epic chapter/boss.
- `monthlyReadinessTarget (Int, default 4)`: The threshold `monthlyReadiness` must reach to unlock a monthly quest (default 4, matching ~4 weekly cycles).
- `lastWeeklyQuestId (String, nullable)`: Tracks the currently active weekly quest for this goal to prevent duplicate generation while one is active.
- `lastMonthlyQuestId (String, nullable)`: Tracks the currently active monthly quest for this goal.

### 1.2 Exact Increment & Reset Rules (Verbatim from Implemented Code)

#### Quest Completion Handling (`PATCH /api/quests/:id/complete` in `apps/api/src/routes/quest.routes.ts`):
```typescript
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
```

#### Expired / Skipped Quest Handling:
```typescript
export const EXPIRED_WEEKLY_MONTHLY_CREDIT = 1;

// When a weekly quest expires without completion, partial credit is awarded toward monthly readiness:
if (expQuest.type === 'weekly') {
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
```

#### Quest Generation Trigger Rules (`ensureQuestsUpToDate()` in `apps/api/src/services/ai/questCadence.service.ts`):
1. **Daily Quests**: Time-based 24h cadence. One active daily quest per goal per day.
2. **Weekly Quests**: Gated on `weeklyReadiness >= weeklyReadinessTarget AND lastWeeklyQuestId is null`. When generated:
   - Sets `lastWeeklyQuestId` to the newly created quest ID.
   - Resets `weeklyReadiness` to `0` (readiness spent on triggering the challenge).
3. **Monthly Quests**: Gated on `monthlyReadiness >= monthlyReadinessTarget AND lastMonthlyQuestId is null`. When generated:
   - Sets `lastMonthlyQuestId` to the newly created quest ID.
   - Resets `monthlyReadiness` to `0`.

---

## 2. Updated `generateQuest()` Function Signature & Consistency Parameter

### 2.1 Types Signature (`packages/types/src/quest.ts`)
```typescript
export interface GenerateQuestInput {
  goalTitle: string;
  goalDescription?: string;
  playerLevel: number;
  questType: QuestType;
  recentCompletionRate?: number; // 0.0 to 1.0 (or percentage 0 to 100)
  /**
   * Actual days taken to accumulate required readiness target.
   * Allows AI to calibrate quest difficulty to real consistency vs pacing delays (e.g. 7 days vs 12 days).
   */
  readinessConsistencyDays?: number;
}

export async function generateQuest(input: GenerateQuestInput): Promise<GeneratedQuest>;
```

### 2.2 How the AI Prompt Uses the Consistency Parameter
- **Consistency Pace Prompt String**:
  ```typescript
  const consistencyText =
    readinessConsistencyDays !== undefined
      ? `${readinessConsistencyDays} days taken to reach readiness trigger`
      : 'Standard pacing';
  ```
- **Prompt Construction**:
  ```text
  Player Status:
  - Level: <playerLevel>
  - Recent Quest Completion Rate: <completionRateText>
  - Readiness Accumulation Pace: <consistencyText>

  Goal Details:
  - Title: "<goalTitle>"
  - Description: "<goalDescription>"
  - Requested Quest Type: <questType>
  ```
- **AI Calibration Rule in System Prompt**:
  - *If the player took longer than the target to build readiness* (e.g., >7 days for weekly target due to missed/skipped days): The AI generates a slightly easier, lower-friction weekly quest than Goal Level alone would suggest to help them regain momentum.
  - *If the player reached the threshold quickly/consistently* (e.g., exactly 7 days without delay): The AI generates a bolder, higher-tier challenge to reward disciplined execution.

---

## 3. Attribute Mapping & Goal Level Scaling

### 3.1 Standard 6 RPG Character Attributes
1. **Strength (STR)**: Weightlifting, calisthenics, physical power.
2. **Endurance (END)**: Long-distance running, cardio, stamina, cold showers, grit.
3. **Intelligence (INT)**: Software engineering, reading, research, deep work.
4. **Dexterity (DEX)**: Typing speed, musical instruments, precision motor habits.
5. **Vitality (VIT)**: Sleep hygiene, nutrition, hydration, meditation, recovery.
6. **Charisma (CHA)**: Public speaking, sales, networking, social outreach.

### 3.2 Difficulty & Level Scaling Rules
- **Player Level 1-3 (Difficulty 1-3)**: Habit building, low friction wins, micro-tasks.
- **Player Level 4-7 (Difficulty 4-7)**: Disciplined execution, multi-stage tasks, sustained focus.
- **Player Level 8+ (Difficulty 8-10)**: Epic milestones, deep creative output, heavy resistance.
- **Quest Types**:
  - `daily`: 1-3 subquests, 10-100 XP, 24h deadline.
  - `weekly`: 2-5 subquests, 100-500 XP, 7-day challenge milestone.
  - `monthly` / `boss`: 3-7 subquests, 500-2000 XP, major chapter culmination.
  - `emergency`: 1-3 subquests, urgent triage.

### 3.3 Rule: No Player Level Contamination in Quest Content
Player Level only influences the calibrated **numerical difficulty (1-10)** and **XP rewards**, never the goal's real-world domain. Quests must directly address the goal title and description without hallucinatory unrelated tasks.

---

## 4. Few-Shot Examples & JSON Output Schema

The AI responds **ONLY** with valid JSON matching this schema:
```json
{
  "title": "string (Short, evocative RPG quest title)",
  "description": "string (Immersive, motivating description tying the real-world goal to RPG progression)",
  "type": "daily" | "weekly" | "monthly" | "boss" | "emergency",
  "xpReward": 100,
  "difficulty": 4,
  "subquests": [
    {
      "title": "string (Concrete, actionable milestone or step)",
      "xpReward": 50
    }
  ]
}
```

### Few-Shot Example 1: Daily Quest (Goal: Master TypeScript)
```json
{
  "title": "Protocol: Type Narrowing Drill",
  "description": "Solidify your TypeScript foundational abilities by executing precise discriminated union refactors.",
  "type": "daily",
  "xpReward": 80,
  "difficulty": 3,
  "subquests": [
    {
      "title": "Write 3 discriminated union types with exhaustive pattern matching",
      "xpReward": 40
    },
    {
      "title": "Solve 2 TypeScript utility type exercises on TypeHero",
      "xpReward": 40
    }
  ]
}
```

### Few-Shot Example 2: Weekly Boss Challenge (Goal: Run a Half-Marathon, 7-Day Consistency)
```json
{
  "title": "Trial of the Velocity Sentinel: 15km Sustained Tempo",
  "description": "Having charged your 7 daily readiness conduits with unflinching consistency, engage the Weekly Distance Boss.",
  "type": "weekly",
  "xpReward": 350,
  "difficulty": 6,
  "subquests": [
    {
      "title": "Complete dynamic hip and ankle mobility warm-up",
      "xpReward": 50
    },
    {
      "title": "Execute a 15km outdoor run maintaining zone-3 heart rate",
      "xpReward": 200
    },
    {
      "title": "Log split metrics and perform 15-minute foam roll recovery",
      "xpReward": 100
    }
  ]
}
```
