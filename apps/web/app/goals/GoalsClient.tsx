'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Plus,
  Flame,
  Pause,
  Archive,
  Play,
  Dumbbell,
  Palette,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle,
  Brain,
  Zap,
  Cpu,
  Layers,
  Activity,
  Compass,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { soundManager } from '@/lib/sound';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { HudProgressBar } from '@/components/HudProgressBar';
import { HudDigitRoller } from '@/components/HudDigitRoller';

interface SubQuest {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

interface Quest {
  id: string;
  title: string;
  type: string;
  xpReward: number;
  difficulty: number;
  status: string;
  subquests: SubQuest[];
}

interface GoalItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: 'active' | 'paused' | 'completed';
  weeklyReadiness?: number;
  weeklyReadinessTarget?: number;
  monthlyReadiness?: number;
  monthlyReadinessTarget?: number;
  lastWeeklyQuestId?: string | null;
  lastMonthlyQuestId?: string | null;
  quests?: Quest[];
  createdAt: string;
}

interface GoalsClientProps {
  initialPlayer?: {
    id: string;
    userId: string;
    level: number;
    xp: number;
    streakCount: number;
  } | null;
  initialUser?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  initialGoals?: any[];
}

export default function GoalsClient({ initialPlayer, initialUser, initialGoals = [] }: GoalsClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user || initialUser;
  const userId = user?.id;

  const level = initialPlayer?.level ?? 1;
  const maxSlots = level >= 10 ? 4 : 3;

  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Intelligence');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch goals from API only if no initialGoals were supplied from the server
  const fetchGoals = React.useCallback(async () => {
    if (goals.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setGoals([]);
          setLoading(false);
          return;
        }
        throw new Error(`Failed to load goals (HTTP ${res.status})`);
      }

      const json = await res.json();
      setGoals(json.data || []);
    } catch (err) {
      console.error('[Goals] Error fetching goals:', err);
      if (goals.length === 0) {
        setError(err instanceof Error ? err.message : 'Failed to connect to goals service');
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, userId, goals.length]);

  // Only run client fetch if initialGoals was empty or unprovided
  useEffect(() => {
    if (!initialGoals || initialGoals.length === 0) {
      fetchGoals();
    }
  }, [initialGoals, fetchGoals]);

  const togglePause = async (goalId: string, currentStatus: string) => {
    soundManager.playTap();
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    const prevGoals = [...goals];

    // Single source of truth: optimistic update
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: nextStatus as any } : g))
    );

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/goals/${goalId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update goal');
      }
    } catch (err) {
      console.error('[Goals] Error updating goal status:', err);
      // Rollback to previous state on error
      setGoals(prevGoals);
      setError('Unable to update directive status');
    }
  };

  const archiveGoal = async (goalId: string) => {
    soundManager.playTap();
    const prevGoals = [...goals];

    // Single source of truth: optimistic removal
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/goals/${goalId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to delete goal');
      }
    } catch (err) {
      console.error('[Goals] Error deleting goal:', err);
      // Rollback to previous state on error
      setGoals(prevGoals);
      setError('Unable to archive directive');
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || goals.length >= maxSlots || isSubmitting) return;

    soundManager.playTap();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          category: newCategory,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to create goal');
      }

      soundManager.playComplete();
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');

      router.push('/');
    } catch (err) {
      console.error('[Goals] Error creating goal:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category?: string | null) => {
    switch ((category || '').toLowerCase()) {
      case 'strength':
        return Dumbbell;
      case 'endurance':
        return Activity;
      case 'intelligence':
        return Brain;
      case 'dexterity':
        return Compass;
      case 'vitality':
        return Shield;
      default:
        return Palette;
    }
  };

  const getCategoryColor = (category?: string | null) => {
    switch ((category || '').toLowerCase()) {
      case 'strength':
        return 'text-[#ff003c] border-[#ff003c]';
      case 'intelligence':
        return 'text-[#bf5af2] border-[#bf5af2]';
      case 'dexterity':
        return 'text-[#00f6ff] border-[#00f6ff]';
      case 'endurance':
        return 'text-[#3ba7ff] border-[#3ba7ff]';
      case 'vitality':
        return 'text-[#3cff9e] border-[#3cff9e]';
      default:
        return 'text-[#ffd84a] border-[#ffd84a]';
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER & GOAL SLOTS CAPACITY */}
        <HudBracketFrame
          active={true}
          rarity="rare"
          className="p-6 bg-[#120608]/90 border border-[#2a1418] relative animate-panel-stagger-1"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00f6ff]" />
                <h1 className="font-mono font-black text-2xl text-white uppercase tracking-wider">
                  Neural Directives & Goals
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Directives synthesize and schedule daily, weekly, and boss operations in your Quest Log.
              </p>
            </div>

            {/* Goal Slots Indicator */}
            <div className="bg-[#1a0a0d] border border-[#2a1418] p-3 flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right font-mono">
                <div className="text-[9px] text-slate-400 uppercase tracking-widest">DIRECTIVE CAPACITY</div>
                <div className="text-xs text-[#00f6ff] font-bold flex items-baseline gap-1 justify-end">
                  <HudDigitRoller value={goals.length} />
                  <span>OF {maxSlots} SLOTS ACTIVE</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: maxSlots }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-6 border transition-all ${
                      i < goals.length
                        ? 'bg-[#00f6ff] border-[#00f6ff] shadow-[0_0_8px_rgba(0,246,255,0.5)]'
                        : 'bg-[#07050a] border-[#2a1418]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a1418] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              CAPACITY: {maxSlots} SLOTS • {level < 10 ? 'LVL 10 UNLOCKS SLOT #4' : 'MAX SLOTS UNLOCKED'}
            </span>
            <span className="text-[#ffd84a] flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> AUTO-AI DIRECTIVE ENGINE ACTIVE
            </span>
          </div>
        </HudBracketFrame>

        {/* CONTROLS BAR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00f6ff]" />
            <h2 className="font-mono font-bold text-base text-white uppercase tracking-wider">
              Installed Directives ({goals.length})
            </h2>
          </div>

          <button
            type="button"
            disabled={goals.length >= maxSlots}
            onClick={() => {
              soundManager.playTap();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00f6ff] hover:bg-[#3cff9e] disabled:opacity-40 disabled:cursor-not-allowed text-black font-mono font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(0,246,255,0.3)] min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NEW DIRECTIVE</span>
          </button>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <HudBracketFrame className="p-12 text-center space-y-4 bg-[#120608] border border-[#2a1418]">
            <Loader2 className="w-8 h-8 text-[#00f6ff] animate-spin mx-auto" />
            <p className="font-mono font-bold text-white uppercase text-sm tracking-wider">
              Loading Directives from Database...
            </p>
          </HudBracketFrame>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <HudBracketFrame className="p-6 bg-[#1a0a0d] border border-[#ff003c]/50 space-y-3">
            <div className="flex items-center gap-2 text-[#ff003c] font-mono text-xs font-bold uppercase">
              <AlertCircle className="w-4 h-4" />
              <span>Error Loading Directives</span>
            </div>
            <p className="text-sm text-slate-300 font-mono">{error}</p>
          </HudBracketFrame>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && goals.length === 0 && (
          <HudBracketFrame className="p-10 text-center space-y-4 bg-[#120608] border border-[#2a1418]">
            <div className="w-14 h-14 mx-auto bg-[#1a0a0d] border border-[#00f6ff]/30 flex items-center justify-center text-[#00f6ff] shadow-[0_0_15px_rgba(0,246,255,0.2)]">
              <Target className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-mono font-bold text-lg text-white uppercase tracking-wider">
                No Directives Installed
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
                Add your primary fitness, learning, or project goals. The system will immediately synthesize and persist your first daily operation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00f6ff] hover:bg-[#3cff9e] text-black font-mono font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(0,246,255,0.4)] min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Install First Directive</span>
            </button>
          </HudBracketFrame>
        )}

        {/* GOALS CARD LIST */}
        {!loading && !error && goals.length > 0 && (
          <div className="space-y-4 animate-panel-stagger-2">
            {goals.map((goal) => {
              const Icon = getCategoryIcon(goal.category);
              const colorCls = getCategoryColor(goal.category);
              const isPaused = goal.status === 'paused';
              const activeQuests = goal.quests?.filter((q) => q.status === 'active') || [];
              const completedQuests = goal.quests?.filter((q) => q.status === 'completed') || [];
              const totalQuests = goal.quests?.length || 0;
              const progressPercentage = totalQuests > 0 ? Math.round((completedQuests.length / totalQuests) * 100) : 0;
              const weeklyPct = Math.min(100, Math.round(((goal.weeklyReadiness ?? 0) / (goal.weeklyReadinessTarget ?? 7)) * 100));
              const monthlyPct = Math.min(100, Math.round(((goal.monthlyReadiness ?? 0) / (goal.monthlyReadinessTarget ?? 4)) * 100));

              return (
                <HudBracketFrame
                  key={goal.id}
                  rarity="rare"
                  active={!isPaused}
                  className={`bg-[#120608] border border-[#2a1418] hover:border-[#ff003c]/60 p-5 space-y-4 transition-all ${
                    isPaused ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-3 border bg-[#1a0a0d] ${colorCls}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase font-bold ${colorCls.split(' ')[0]}`}>
                            {goal.category} DIRECTIVE
                          </span>
                          {isPaused && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1a0a0d] text-[#ffd84a] border border-[#ffd84a]/30 font-bold">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                        <h3 className="font-mono font-bold text-lg text-white mt-0.5">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => togglePause(goal.id, goal.status)}
                        className="p-2.5 bg-[#1a0a0d] border border-[#2a1418] hover:border-[#00f6ff] text-slate-300 hover:text-[#00f6ff] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={isPaused ? 'Resume Directive' : 'Pause Directive'}
                      >
                        {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveGoal(goal.id)}
                        className="p-2.5 bg-[#1a0a0d] border border-[#2a1418] hover:border-[#ff003c] text-slate-300 hover:text-[#ff003c] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Archive Directive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Readiness Meters (Weekly Boss & Monthly Epic) */}
                  <div className="space-y-3 pt-1">
                    {/* Weekly Readiness */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[#00f6ff] flex items-center gap-1 font-bold">
                          <Zap className="w-3.5 h-3.5" />
                          WEEKLY CHALLENGE CALIBRATION
                        </span>
                        <span className="text-slate-300">
                          <strong className="text-white font-mono">{goal.weeklyReadiness ?? 0}</strong> / {goal.weeklyReadinessTarget ?? 7} DAILIES ({weeklyPct}%)
                        </span>
                      </div>
                      <HudProgressBar
                        progress={weeklyPct}
                        variant="cyan"
                        className="h-2.5 w-full"
                        trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
                      />
                    </div>

                    {/* Monthly Readiness */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-[#bf5af2] flex items-center gap-1 font-bold">
                          <Sparkles className="w-3 h-3 text-[#bf5af2]" />
                          MONTHLY EPIC READINESS
                        </span>
                        <span className="text-slate-400">
                          <strong className="text-purple-200 font-mono">{goal.monthlyReadiness ?? 0}</strong> / {goal.monthlyReadinessTarget ?? 4} WEEKLIES ({monthlyPct}%)
                        </span>
                      </div>
                      <HudProgressBar
                        progress={monthlyPct}
                        variant="purple"
                        className="h-2 w-full"
                        trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
                      />
                    </div>
                  </div>

                  {/* Quests Summary Strip */}
                  <div className="space-y-1.5 pt-2 border-t border-[#2a1418]">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">
                        OPERATION HISTORY ({completedQuests.length}/{totalQuests} COMPLETE)
                      </span>
                      <span className="text-white font-bold">{progressPercentage}%</span>
                    </div>
                    <HudProgressBar
                      progress={progressPercentage}
                      variant="gold"
                      className="h-1.5 w-full"
                      trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
                    />
                  </div>

                  {/* Bottom stats row */}
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[#2a1418]">
                    <div className="flex items-center gap-1.5 text-[#00f6ff] font-bold">
                      <Zap className="w-4 h-4" />
                      <span>{activeQuests.length} ACTIVE OPERATIONS IN LOG</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">NEON LAKEBASE POSTGRES</span>
                  </div>
                </HudBracketFrame>
              );
            })}
          </div>
        )}

        {/* MODAL / BOTTOM SHEET: ADD GOAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <HudBracketFrame
              active={true}
              rarity="rare"
              className="bg-[#120608] border border-[#00f6ff] p-6 max-w-md w-full space-y-4 shadow-[0_0_25px_rgba(0,246,255,0.25)] rounded-t-xl sm:rounded-none"
            >
              <div className="flex items-center justify-between border-b border-[#2a1418] pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#00f6ff]" />
                  <h3 className="font-mono font-black text-lg text-white uppercase">Install Directive</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    if (!isSubmitting) setShowAddModal(false);
                  }}
                  disabled={isSubmitting}
                  className="text-slate-400 hover:text-white font-mono text-sm min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {submitError && (
                <div className="p-3 bg-[#1a0a0d] border border-[#ff003c] text-[#ff003c] text-xs font-mono">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1 font-bold">
                    Directive Title <span className="text-[#00f6ff]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master TypeScript and write 10 apps"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#1a0a0d] border border-[#2a1418] focus:border-[#00f6ff] px-3 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1 font-bold">
                    Telemetry Scope (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Focus on distributed systems and async queues."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#1a0a0d] border border-[#2a1418] focus:border-[#00f6ff] px-3 py-2 text-sm font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1 font-bold">
                    Category Attribute
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-[#1a0a0d] border border-[#2a1418] focus:border-[#00f6ff] px-3 py-2.5 text-sm font-mono text-white focus:outline-none min-h-[44px]"
                  >
                    <option value="Intelligence">Intelligence (Coding & Learning)</option>
                    <option value="Strength">Strength (Physical Power & Lifting)</option>
                    <option value="Endurance">Endurance (Cardio & Stamina)</option>
                    <option value="Vitality">Vitality (Health & Recovery)</option>
                    <option value="Dexterity">Dexterity (Speed & Precision)</option>
                    <option value="Charisma">Charisma (Social & Leadership)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#1a0a0d] border border-[#2a1418] text-[11px] font-mono text-slate-400">
                  <span className="text-[#00f6ff] font-bold">AUTO-DISPATCH:</span> Installing this directive will synthesize your initial daily operation in Lakebase Postgres.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTap();
                      setShowAddModal(false);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 font-mono text-xs uppercase bg-[#1a0a0d] border border-[#2a1418] text-slate-300 hover:text-white disabled:opacity-50 min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    className="flex-1 py-2.5 font-mono text-xs uppercase bg-[#00f6ff] hover:bg-[#3cff9e] disabled:opacity-50 text-black font-bold flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Install Directive</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </HudBracketFrame>
          </div>
        )}
      </div>
    </main>
  );
}

