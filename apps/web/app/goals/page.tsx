import React from 'react';
import { auth } from '@/auth';
import { getCachedPlayer, getCachedGoals } from '@/lib/data';
import GoalsClient from './GoalsClient';

export default async function GoalsPage() {
  const session = await auth();
  let player = null;
  let initialGoals: any[] = [];

  if (session?.user?.id) {
    player = await getCachedPlayer(session.user.id);
    if (player) {
      initialGoals = await getCachedGoals(player.id);
    }
  }

  return (
    <GoalsClient
      initialPlayer={player}
      initialUser={session?.user || null}
      initialGoals={initialGoals}
    />
  );
}
