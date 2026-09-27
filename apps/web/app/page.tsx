import React from 'react';
import { auth } from '@/auth';
import { getCachedPlayer } from '@/lib/data';
import QuestLogClient from './QuestLogClient';

export default async function QuestLogPage() {
  const session = await auth();
  let player: any = null;
  let initialQuests: any[] = [];

  if (session?.user?.id) {
    player = await getCachedPlayer(session.user.id);
    if (player && player.goals) {
      // Extract active quests from player's active goals for zero-flash initial render
      initialQuests = player.goals.flatMap((g: any) =>
        g.quests.map((q: any) => ({
          ...q,
          goal: {
            id: g.id,
            title: g.title,
            category: g.category,
            weeklyReadiness: g.weeklyReadiness,
            weeklyReadinessTarget: g.weeklyReadinessTarget,
            monthlyReadiness: g.monthlyReadiness,
            monthlyReadinessTarget: g.monthlyReadinessTarget,
            lastWeeklyQuestId: g.lastWeeklyQuestId,
            lastMonthlyQuestId: g.lastMonthlyQuestId,
          },
        }))
      );
    }
  }

  return (
    <QuestLogClient
      initialPlayer={player}
      initialUser={session?.user || null}
      initialQuests={initialQuests}
    />
  );
}
