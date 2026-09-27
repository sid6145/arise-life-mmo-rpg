'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Flame,
  Shield,
  Zap,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  AlertTriangle,
  RefreshCw,
  Target,
  Loader2,
  Volume2,
  VolumeX,
  Crosshair,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { emitFeedback } from '@/lib/feedbackBus';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { HudChargeButton } from '@/components/HudChargeButton';
import { HudProgressBar } from '@/components/HudProgressBar';
import { HudDigitRoller } from '@/components/HudDigitRoller';

interface SubQuestItem {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

interface GoalInfo {
  id: string;
  title: string;
  category?: string | null;
  weeklyReadiness?: number;
  weeklyReadinessTarget?: number;
  monthlyReadiness?: number;
  monthlyReadinessTarget?: number;
  lastWeeklyQuestId?: string | null;
  lastMonthlyQuestId?: string | null;
}

interface QuestItem {
  id: string;
  goalId: string;
  title: string;
  description?: string | null;
  type: string;
  xpReward: number;
  difficulty: number;
  status: string;
  dueDate?: string | Date | null;
  subquests: SubQuestItem[];
  goal?: GoalInfo;
  claimed?: boolean;
}

export default function QuestLogClient({
  initialPlayer,
  initialUser,
  initialQuests = [],
}: {
  initialPlayer: any;
  initialUser: any;
  initialQuests?: QuestItem[];
}) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const user = session?.user || initialUser;
  const userId = user?.id;

  const [player, setPlayer] = useState(initialPlayer);
  const level = player?.level ?? 1;
  const [currentXp, setCurrentXp] = useState(player?.xp ?? 0);
  const nextLevelXp = level * 1000;
  const streakCount = player?.streakCount ?? 0;
  const displayName = user?.name || user?.email?.split('@')[0] || 'Operative';

  const [quests, setQuests] = useState<QuestItem[]>(initialQuests);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [screenPulse, setScreenPulse] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    setSoundEnabled(soundManager.getSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
    if (newState) {
      soundManager.playTap();
    }
  };

  useEffect(() => {
    if (initialPlayer) {
      setPlayer(initialPlayer);
      setCurrentXp(initialPlayer.xp);
    }
  }, [initialPlayer]);

  useEffect(() => {
    if (initialQuests && initialQuests.length > 0) {
      setQuests(initialQuests);
    }
  }, [initialQuests]);

  // Only fetch client-side if no initialQuests were provided from the server
  const fetchQuests = useCallback(async (isBackground = false) => {
    if (!userId && authStatus === 'unauthenticated') {
      setQuests([]);
      return;
    }

    if (!isBackground && quests.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/quests`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setQuests([]);
          return;
        }
        throw new Error(`Failed to load quests (HTTP ${res.status})`);
      }

      const json = await res.json();
      setQuests(json.data || []);
    } catch (err) {
      console.error('[QuestLog] Fetch error:', err);
      if (quests.length === 0) {
        setError(err instanceof Error ? err.message : 'Unable to connect to quest service');
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, userId, authStatus, quests.length]);

  useEffect(() => {
    if (!initialQuests || initialQuests.length === 0) {
      fetchQuests();
    }
  }, [initialQuests, fetchQuests]);

  const toggleSubtask = async (questId: string, subtaskId: string, currentCompleted: boolean) => {
    emitFeedback('subquest_toggle');

    // Single source of truth: optimistic UI update
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId) return q;
        const updated = q.subquests.map((st) =>
          st.id === subtaskId ? { ...st, completed: !currentCompleted } : st
        );
        return { ...q, subquests: updated };
      })
    );

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/quests/${questId}/subquests/${subtaskId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ completed: !currentCompleted }),
      });

      if (!res.ok) {
        throw new Error('Failed to update subquest');
      }
    } catch (err) {
      console.error('[QuestLog] Error updating subquest:', err);
      // Rollback optimistic update
      setQuests((prev) =>
        prev.map((q) => {
          if (q.id !== questId) return q;
          const updated = q.subquests.map((st) =>
            st.id === subtaskId ? { ...st, completed: currentCompleted } : st
          );
          return { ...q, subquests: updated };
        })
      );
    }
  };

  const claimReward = async (questId: string) => {
    setActionLoadingId(questId);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/quests/${questId}/complete`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to complete quest');
      }

      const json = await res.json();
      const updatedPlayer = json.data?.player;

      if (updatedPlayer) {
        const leveledUp = updatedPlayer.level > level;
        if (leveledUp) {
          emitFeedback('levelup');
          setScreenPulse(true);
          setTimeout(() => setScreenPulse(false), 800);
        } else {
          emitFeedback('reward_claim');
        }

        setPlayer(updatedPlayer);
        setCurrentXp(updatedPlayer.xp);
      }

      // Mark quest as completed locally
      setQuests((prev) =>
        prev.map((q) =>
          q.id === questId
            ? {
                ...q,
                status: 'completed',
                claimed: true,
                subquests: q.subquests.map((st) => ({ ...st, completed: true })),
              }
            : q
        )
      );
    } catch (err) {
      console.error('[QuestLog] Error claiming quest reward:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRarityTier = (type: string): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'iconic' => {
    switch (type.toLowerCase()) {
      case 'daily':
        return 'uncommon';
      case 'weekly':
        return 'rare';
      case 'monthly':
      case 'boss':
        return 'epic';
      case 'emergency':
        return 'iconic';
      default:
        return 'common';
    }
  };

  const getDangerTag = (difficulty: number) => {
    if (difficulty <= 3) {
      return {
        label: 'LOW DANGER',
        color: 'text-[#3cff9e] bg-[#3cff9e]/10 border-[#3cff9e]/30',
      };
    }
    if (difficulty <= 7) {
      return {
        label: 'MODERATE DANGER',
        color: 'text-[#ff8a3d] bg-[#ff8a3d]/10 border-[#ff8a3d]/30',
      };
    }
    return {
      label: 'VERY HIGH DANGER',
      color: 'text-[#ff003c] bg-[#ff003c]/10 border-[#ff003c]/40',
    };
  };

  const xpPercentage = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  return (
    <main
      className={`min-h-screen bg-transparent text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8 transition-transform duration-300 ${
        screenPulse ? 'animate-screen-pulse' : ''
      }`}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TOP STATUS BAR & LEVEL HUD */}
        <HudBracketFrame
          active={true}
          rarity="iconic"
          className="p-5 sm:p-6 bg-[#120608]/90 border border-[#2a1418] relative animate-panel-stagger-1"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            {/* Player Level Badge */}
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-16 h-16 bg-[#1a0a0d] border-2 border-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.3)]">
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-[#00f6ff] uppercase tracking-widest leading-none">
                    LVL
                  </span>
                  <HudDigitRoller
                    value={level}
                    className="block text-3xl font-mono font-black text-white leading-none mt-1"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono font-black text-xl sm:text-2xl text-white tracking-wider uppercase">
                    {displayName}
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#ff003c]/10 text-[#00f6ff] border border-[#00f6ff]/40">
                    {player ? 'NETRUNNER ONLINE' : 'GUEST AGENT'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono tracking-wide mt-0.5">
                  CYBERNETIC QUEST DISPATCH // DIRECT FEED
                </p>
              </div>
            </div>

            {/* Streak Counter & Audio */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={toggleSound}
                className="p-2.5 bg-[#1a0a0d] border border-[#2a1418] hover:border-[#00f6ff] text-slate-400 hover:text-[#00f6ff] transition-colors"
                title={soundEnabled ? 'Mute Game Audio' : 'Unmute Game Audio'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#00f6ff]" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              <div className="flex items-center gap-2.5 bg-[#1a0a0d] border border-[#ffd84a]/30 px-3.5 py-2">
                <div className="p-1 bg-[#ffd84a]/10 border border-[#ffd84a]/40">
                  <Flame className="w-4 h-4 text-[#ffd84a] animate-pulse" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono text-[#ffd84a]/80 uppercase tracking-wider">
                    STREAK
                  </span>
                  <div className="text-base font-mono font-bold text-white tracking-tight flex items-baseline gap-1">
                    <HudDigitRoller value={streakCount} />
                    <span className="text-xs text-slate-300">DAYS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 pt-3 border-t border-[#2a1418]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#ffd84a] font-bold">
                <Zap className="w-3.5 h-3.5" /> XP TELEMETRY
              </span>
              <span className="text-slate-300">
                <HudDigitRoller value={currentXp} className="text-white font-bold text-sm" /> / {nextLevelXp} XP ({xpPercentage}%)
              </span>
            </div>
            <HudProgressBar
              progress={xpPercentage}
              variant="xp"
              className="h-2.5 w-full"
              trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
            />
          </div>
        </HudBracketFrame>

        {/* SECTION HEADER */}
        <div className="flex items-center justify-between pt-1 animate-panel-stagger-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00f6ff]" />
            <h2 className="font-mono font-black text-lg text-white tracking-wider uppercase">
              Active Neural Operations
            </h2>
            <span className="ml-1 text-[11px] font-mono px-2 py-0.5 bg-[#120608] text-slate-300 border border-[#2a1418]">
              {quests.filter((q) => q.status === 'active').length} ACTIVE
            </span>
          </div>
          <Link
            href="/goals"
            onClick={() => soundManager.playTap()}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-black bg-[#00f6ff] hover:bg-[#3cff9e] px-3.5 py-1.5 transition-all"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CONFIGURE GOALS</span>
          </Link>
        </div>

        {/* LOADING STATE */}
        {loading && quests.length === 0 && (
          <HudBracketFrame className="p-12 text-center space-y-4 bg-[#120608] border border-[#2a1418]">
            <Loader2 className="w-8 h-8 text-[#00f6ff] animate-spin mx-auto" />
            <div className="space-y-1">
              <p className="font-mono font-bold text-white uppercase text-sm tracking-wider">
                Syncing Neural Cadence...
              </p>
              <p className="font-mono text-xs text-slate-400">
                Calibrating active operations from database
              </p>
            </div>
          </HudBracketFrame>
        )}

        {/* ERROR STATE */}
        {!loading && error && quests.length === 0 && (
          <HudBracketFrame className="p-6 bg-[#1a0a0d] border border-[#ff003c]/50 space-y-3">
            <div className="flex items-center gap-2 text-[#ff003c] font-mono text-xs font-bold uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Failed to load operations</span>
            </div>
            <p className="text-sm text-slate-300 font-mono">{error}</p>
            <button
              onClick={() => {
                soundManager.playTap();
                fetchQuests(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#120608] border border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c]/20 text-xs font-mono uppercase transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </HudBracketFrame>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && quests.filter((q) => q.status === 'active').length === 0 && (
          <HudBracketFrame className="p-10 sm:p-12 text-center space-y-5 bg-[#120608] border border-[#2a1418]">
            <div className="w-16 h-16 mx-auto bg-[#1a0a0d] border border-[#00f6ff]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,246,255,0.2)]">
              <Target className="w-8 h-8 text-[#00f6ff]" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="font-mono font-black text-xl text-white uppercase tracking-wider">
                No Active Operations
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
                Operations are synthesized as soon as you connect your directives. Initialize a goal to begin your daily run!
              </p>
            </div>
            <Link
              href="/goals"
              onClick={() => soundManager.playTap()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00f6ff] hover:bg-[#3cff9e] text-black font-mono font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(0,246,255,0.4)]"
            >
              <Plus className="w-4 h-4" />
              <span>INITIALIZE FIRST GOAL</span>
            </Link>
          </HudBracketFrame>
        )}

        {/* QUEST LIST (Section 7 Netrunner HUD Journal) */}
        {quests.length > 0 && (
          <div className="space-y-4 animate-panel-stagger-3">
            {quests.map((quest) => {
              const rarity = getRarityTier(quest.type);
              const danger = getDangerTag(quest.difficulty);
              const completedCount = quest.subquests?.filter((st) => st.completed).length ?? 0;
              const isFullyCompleted =
                quest.status === 'completed' ||
                (quest.subquests?.length > 0 && completedCount === quest.subquests.length);
              const isClaimed = quest.status === 'completed' || quest.claimed;
              const isBoss = quest.type === 'weekly' || quest.type === 'monthly' || quest.type === 'boss';

              const weeklyReadiness = quest.goal?.weeklyReadiness ?? 0;
              const weeklyTarget = quest.goal?.weeklyReadinessTarget ?? 7;
              const weeklyPercent = Math.min(100, Math.round((weeklyReadiness / weeklyTarget) * 100));

              const monthlyReadiness = quest.goal?.monthlyReadiness ?? 0;
              const monthlyTarget = quest.goal?.monthlyReadinessTarget ?? 4;
              const monthlyPercent = Math.min(100, Math.round((monthlyReadiness / monthlyTarget) * 100));

              const isTracked = quest.id === quests.find((q) => q.status === 'active')?.id;

              return (
                <HudBracketFrame
                  key={quest.id}
                  rarity={rarity}
                  active={!isClaimed}
                  className={`p-5 sm:p-6 bg-[#120608] border border-[#2a1418] transition-all duration-200 ${
                    isClaimed
                      ? 'opacity-50'
                      : isTracked
                      ? 'hover:border-[#ff003c]/60 animate-ambient-hero'
                      : 'hover:border-[#ff003c]/60'
                  }`}
                >
                  {/* CARD HEADER: TYPE, DANGER TAG, GOAL CONTEXT, XP CHIP */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Operation Type Tag */}
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[#1a0a0d] text-[#00f6ff] border border-[#00f6ff]/40">
                        {quest.type.toUpperCase()} // {isBoss ? 'BOSS CHALLENGE' : 'OP'}
                      </span>

                      {/* Danger Urgency Tag per Section 7 */}
                      <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${danger.color}`}>
                        {danger.label}
                      </span>

                      {/* Goal Category / Context */}
                      {quest.goal?.title && (
                        <span className="text-[11px] font-mono text-slate-400 bg-[#1a0a0d] px-2 py-0.5 border border-[#2a1418] truncate max-w-[200px]">
                          DIR: {quest.goal.title}
                        </span>
                      )}
                    </div>

                    {/* XP Reward Chip */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ffd84a]/10 border border-[#ffd84a]/40 text-[#ffd84a] font-mono font-bold text-xs shadow-[0_0_10px_rgba(255,216,74,0.2)]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+{quest.xpReward} XP</span>
                    </div>
                  </div>

                  {/* QUEST TITLE */}
                  <Link
                    href={`/quest/${quest.id}`}
                    onClick={() => soundManager.playTap()}
                    className="group block"
                  >
                    <h3 className="font-mono font-bold text-lg sm:text-xl text-white group-hover:text-[#00f6ff] tracking-wide mb-1.5 transition-colors flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-[#ff003c] opacity-70 group-hover:opacity-100" />
                      {quest.title}
                    </h3>
                  </Link>

                  {quest.description && (
                    <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed mb-4">
                      {quest.description}
                    </p>
                  )}

                  {/* SUB-OBJECTIVES CHECKLIST */}
                  {quest.subquests && quest.subquests.length > 0 && (
                    <div className="space-y-1.5 bg-[#1a0a0d]/90 p-3.5 border border-[#2a1418] mb-4">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span className="tracking-widest">OBJECTIVE PROTOCOLS</span>
                        <span className={isFullyCompleted ? 'text-[#3cff9e] font-bold' : ''}>
                          {completedCount}/{quest.subquests.length} COMPLETE
                        </span>
                      </div>
                      {quest.subquests.map((task) => (
                        <button
                          key={task.id}
                          disabled={isClaimed}
                          onClick={() => toggleSubtask(quest.id, task.id, task.completed)}
                          className="w-full min-h-[44px] flex items-center justify-between gap-3 text-left py-1.5 px-2 text-xs sm:text-sm font-mono hover:bg-[#120608] border border-transparent hover:border-[#2a1418] transition-colors group disabled:cursor-default"
                        >
                          <div className="flex items-center gap-2.5">
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#3cff9e] shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 group-hover:text-[#00f6ff] shrink-0 transition-colors" />
                            )}
                            <span className={task.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {task.title}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[#ffd84a] font-bold shrink-0">
                            +{task.xpReward} XP
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* READINESS PROGRESS INDICATORS (For Daily Quest Cards) */}
                  {quest.type === 'daily' && quest.goal && (
                    <div className="space-y-2 bg-[#07050a] p-3 border border-[#2a1418] mb-4">
                      {/* Weekly Readiness Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-[#00f6ff] font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            WEEKLY BOSS CALIBRATION
                          </span>
                          <span className="text-slate-300">
                            <strong className="text-white">{weeklyReadiness}</strong> / {weeklyTarget} ({weeklyPercent}%)
                          </span>
                        </div>
                        <HudProgressBar
                          progress={weeklyPercent}
                          variant="cyan"
                          className="h-1.5 w-full"
                          trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
                        />
                      </div>

                      {/* Monthly Readiness Progress */}
                      <div className="space-y-0.5 pt-1.5 border-t border-[#2a1418]/60">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                          <span className="text-[#bf5af2] flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-[#bf5af2]" />
                            MONTHLY EPIC READINESS
                          </span>
                          <span>
                            <strong className="text-purple-200">{monthlyReadiness}</strong> / {monthlyTarget} ({monthlyPercent}%)
                          </span>
                        </div>
                        <HudProgressBar
                          progress={monthlyPercent}
                          variant="purple"
                          className="h-1 w-full"
                          trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
                        />
                      </div>
                    </div>
                  )}

                  {/* CARD FOOTER & PRIMARY CHARGE-RING BUTTON (Section 8.2) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#2a1418]">
                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      TELEMETRY // PERSISTED IN NEON DB
                    </span>
                    <div>
                      {isClaimed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#3cff9e] bg-[#3cff9e]/10 border border-[#3cff9e]/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          COMPLETED & CLAIMED
                        </span>
                      ) : isFullyCompleted ? (
                        <HudChargeButton
                          label="HOLD TO CLAIM REWARD"
                          sublabel="CHARGE // CLAIM XP"
                          variant="primary"
                          loading={actionLoadingId === quest.id}
                          onComplete={() => claimReward(quest.id)}
                        />
                      ) : (
                        <span className="text-xs font-mono text-slate-400">
                          Execute all protocols to enable claim
                        </span>
                      )}
                    </div>
                  </div>
                </HudBracketFrame>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

