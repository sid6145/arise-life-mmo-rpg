import React from 'react';
import { getCachedQuest } from '@/lib/data';
import QuestDetailClient from './QuestDetailClient';

export default async function QuestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const quest = await getCachedQuest(params.id);

  return <QuestDetailClient initialQuest={quest} questId={params.id} />;
}
