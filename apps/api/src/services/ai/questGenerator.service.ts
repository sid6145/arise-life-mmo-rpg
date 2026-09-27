import {
  GeneratedQuest,
  GeneratedQuestSchema,
  GenerateQuestInput,
} from '@life-rpg/types';
import type { ZodIssue } from 'zod';
import {
  createChatCompletion,
  ChatMessage,
  OpenRouterError,
  OpenRouterRateLimitError,
  OpenRouterAuthError,
} from './openrouter.client';

export class QuestGenerationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'QuestGenerationError';
  }
}

const QUEST_SCHEMA_DEFINITION = `{
  "title": "string (Short, evocative RPG quest title)",
  "description": "string (Immersive, motivating description tying the real-world goal to RPG progression)",
  "type": "daily" | "weekly" | "monthly" | "boss" | "emergency",
  "xpReward": "number (Integer >= 10, scaled with level & difficulty)",
  "difficulty": "number (Integer from 1 to 10, where 1 is trivial and 10 is legendary/grueling)",
  "subquests": [
    {
      "title": "string (Concrete, actionable milestone or step)",
      "xpReward": "number (Integer >= 5)"
    }
  ]
}`;

const SYSTEM_PROMPT = `You are the Grandmaster AI of a Cyberpunk / Fantasy Life RPG system.
Your mission is to transform the player's real-world goals and habits into exciting, structured RPG quests.

You MUST ALWAYS respond with ONLY valid JSON adhering strictly to this schema:
${QUEST_SCHEMA_DEFINITION}

Rules for Generation:
1. Output ONLY the JSON object. Do not include markdown code fences (no \`\`\`json or \`\`\`), markdown styling, headers, or any conversational prose.
2. Difficulty & Level Scaling:
   - Player Level 1-3: Difficulty 1-3. Focus on building habits and low-friction wins.
   - Player Level 4-7: Difficulty 4-7. Focus on steady discipline and medium-complexity tasks.
   - Player Level 8+: Difficulty 8-10. Ambitious, high-yield, deep-work challenges.
3. Quest Types:
   - "daily": Quick, executable within 24h (1-3 subquests, 10-100 XP).
   - "weekly": Sustained milestone across 7 days (2-5 subquests, 100-500 XP).
   - "monthly": Major life objective / project chapter (3-7 subquests, 500-2000 XP).
   - "boss": High-stakes threshold challenge or milestone exam/launch (3-8 subquests, high XP).
   - "emergency": Urgent triage or turnaround task (1-3 subquests).
4. Player Performance & Consistency Tuning:
   - If the player's recent completion rate is low (<50%), calibrate subquests to be slightly more accessible and lower friction to help them rebuild momentum.
   - If the player's recent completion rate is high (>80%), push them with higher expectations and bolder milestones.
   - Readiness Consistency: If the player took longer than normal to reach their readiness threshold (e.g. >7 days for weekly target due to missed/skipped days), generate a slightly easier, momentum-rebuilding challenge than Goal Level alone dictates. If they reached it with rapid/perfect consistency (e.g. exactly 7 days), generate a bolder, higher-tier challenge.
5. All XP rewards and difficulty must be valid integers conforming to the schema.`;

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  return cleaned.trim();
}

function parseAndValidateQuest(rawContent: string): GeneratedQuest {
  const cleaned = cleanJsonString(rawContent);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    // If standard JSON.parse fails, try extracting innermost outer brace match
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);
      parsedJson = JSON.parse(extracted);
    } else {
      throw new Error('Response did not contain valid JSON object braces');
    }
  }

  const result = GeneratedQuestSchema.safeParse(parsedJson);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue: ZodIssue) => `Field '${issue.path.join('.')}': ${issue.message}`)
      .join('; ');
    throw new Error(`Schema validation failed: ${errorDetails}`);
  }

  return result.data;
}

export async function generateQuest(
  input: GenerateQuestInput
): Promise<GeneratedQuest> {
  const {
    goalTitle,
    goalDescription,
    playerLevel,
    questType,
    recentCompletionRate,
    readinessConsistencyDays,
  } = input;

  const completionRateText =
    recentCompletionRate !== undefined
      ? `${Math.round(recentCompletionRate > 1 ? recentCompletionRate : recentCompletionRate * 100)}%`
      : 'Not recorded / Normal';

  const consistencyText =
    readinessConsistencyDays !== undefined
      ? `${readinessConsistencyDays} days taken to reach readiness trigger`
      : 'Standard pacing';

  const userPrompt = `Generate a "${questType}" quest for the following player and goal:

Player Status:
- Level: ${playerLevel}
- Recent Quest Completion Rate: ${completionRateText}
- Readiness Accumulation Pace: ${consistencyText}

Goal Details:
- Title: "${goalTitle}"
${goalDescription ? `- Description: "${goalDescription}"` : ''}
- Requested Quest Type: ${questType}

Generate a calibrated, engaging quest matching the JSON schema now.`;

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  // First Attempt
  let rawResponse: string;
  try {
    rawResponse = await createChatCompletion({
      messages,
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    if (err instanceof OpenRouterRateLimitError || err instanceof OpenRouterAuthError) {
      throw err;
    }
    throw new QuestGenerationError(
      `OpenRouter request failed: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }

  try {
    return parseAndValidateQuest(rawResponse);
  } catch (firstError) {
    console.warn(
      '[questGenerator] First attempt failed parsing/validation. Retrying with error correction...',
      firstError instanceof Error ? firstError.message : firstError
    );

    // Retry with error-correction prompt
    const retryMessages: ChatMessage[] = [
      ...messages,
      { role: 'assistant', content: rawResponse },
      {
        role: 'user',
        content: `Your last response was invalid JSON or did not strictly match the schema: ${
          firstError instanceof Error ? firstError.message : String(firstError)
        }. Return ONLY valid JSON matching the exact schema: ${QUEST_SCHEMA_DEFINITION}`,
      },
    ];

    let retryRawResponse: string;
    try {
      retryRawResponse = await createChatCompletion({
        messages: retryMessages,
        response_format: { type: 'json_object' },
      });
    } catch (err) {
      if (err instanceof OpenRouterRateLimitError || err instanceof OpenRouterAuthError) {
        throw err;
      }
      throw new QuestGenerationError(
        `OpenRouter retry request failed: ${err instanceof Error ? err.message : String(err)}`,
        err
      );
    }

    try {
      return parseAndValidateQuest(retryRawResponse);
    } catch (secondError) {
      console.error(
        '[questGenerator] Second attempt also failed parsing/validation:',
        secondError
      );
      throw new QuestGenerationError(
        `Failed to generate valid quest data after retry: ${
          secondError instanceof Error ? secondError.message : String(secondError)
        }`,
        {
          firstAttempt: rawResponse,
          secondAttempt: retryRawResponse,
        }
      );
    }
  }
}
