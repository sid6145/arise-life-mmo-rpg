'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Crosshair,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { emitFeedback } from '@/lib/feedbackBus';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { HudChargeButton } from '@/components/HudChargeButton';

interface SubQuestItem {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
}

interface QuestDetail {
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
  goal?: {
    id: string;
    title: string;
    category?: string | null;
  };
}

export default function QuestDetailClient({
  initialQuest,
  questId,
}: {
  initialQuest: QuestDetail | null;
  questId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [quest, setQuest] = useState<QuestDetail | null>(initialQuest);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const toggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    if (!quest) return;

    emitFeedback('subquest_toggle');

    // Optimistic UI update
    setQuest((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subquests: prev.subquests.map((st) =>
          st.id === subtaskId ? { ...st, completed: !currentCompleted } : st
        ),
      };
    });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userId) {
        headers['Authorization'] = `Bearer ${userId}`;
      }

      await fetch(`${API_URL}/api/quests/${questId}/subquests/${subtaskId}`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ completed: !currentCompleted }),
      });
      router.refresh();
    } catch (err) {
      console.error('[QuestDetail] Error updating subquest:', err);
    }
  };

  const handleCompleteQuest = async () => {
    if (!quest || quest.status === 'completed' || actionLoading) return;

    emitFeedback('reward_claim');
    setActionLoading(true);

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

      setQuest((prev) =>
        prev
          ? {
              ...prev,
              status: 'completed',
              subquests: prev.subquests.map((st) => ({ ...st, completed: true })),
            }
          : null
      );
      router.refresh();
    } catch (err) {
      console.error('[QuestDetail] Error completing quest:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!quest) {
    return (
      <main className="min-h-screen bg-transparent text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => emitFeedback('tap')}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-[#00f6ff] transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO DISPATCH</span>
            </Link>
          </div>
          <HudBracketFrame className="p-8 bg-[#120608] border border-[#ff003c]/40 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto bg-[#1a0a0d] border border-[#ff003c] flex items-center justify-center text-[#ff003c] shadow-[0_0_15px_rgba(255,0,60,0.3)]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="font-mono font-black text-lg text-white uppercase tracking-wider">
                Operation Not Found
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed">
                Operation &apos;{questId}&apos; was not found in Lakebase database telemetry.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                onClick={() => emitFeedback('tap')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00f6ff] hover:bg-[#3cff9e] text-black font-mono font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(0,246,255,0.4)] min-h-[44px]"
              >
                <span>Back to Dispatch Log</span>
              </Link>
            </div>
          </HudBracketFrame>
        </div>
      </main>
    );
  }

  const completedCount = quest.subquests.filter((s) => s.completed).length ?? 0;
  const totalSubquests = quest.subquests.length ?? 0;
  const isFullyCompleted =
    (quest.status === 'completed' || completedCount === totalSubquests) && totalSubquests > 0;
  const isClaimed = quest.status === 'completed';

  const getRarity = () => {
    switch (quest.type.toLowerCase()) {
      case 'weekly':
        return 'rare';
      case 'monthly':
      case 'boss':
        return 'epic';
      case 'emergency':
        return 'iconic';
      default:
        return 'uncommon';
    }
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={() => emitFeedback('tap')}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-[#00f6ff] transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO DISPATCH</span>
          </Link>
          <span className="font-mono text-xs text-slate-500">OP ID: {questId.slice(0, 8)}</span>
        </div>

        {/* REAL QUEST CONTENT */}
        <HudBracketFrame
          active={true}
          rarity={getRarity()}
          className="bg-[#120608] border border-[#2a1418] p-6 sm:p-8 space-y-6 relative"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2a1418]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider border text-[#00f6ff] bg-[#1a0a0d] border-[#00f6ff]/40">
                {quest.type.toUpperCase()} OPERATION
              </span>
              {quest.goal?.title && (
                <span className="text-xs font-mono text-slate-400 bg-[#1a0a0d] px-2.5 py-1 border border-[#2a1418]">
                  DIR: {quest.goal.title}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-[#1a0a0d] px-2.5 py-1 border border-[#2a1418]">
                <Clock className="w-3.5 h-3.5 text-[#00f6ff]" /> DIFFICULTY {quest.difficulty}/10
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-[#ffd84a]/10 border border-[#ffd84a]/40 text-[#ffd84a] font-mono font-bold text-sm shadow-[0_0_10px_rgba(255,216,74,0.2)]">
              <Sparkles className="w-4 h-4" />
              <span>+{quest.xpReward} XP REWARD</span>
            </div>
          </div>

          {/* Quest Title & Full Description */}
          <div className="space-y-3">
            <h1 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-wide flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-[#ff003c]" />
              {quest.title}
            </h1>
            {quest.description && (
              <p className="text-sm sm:text-base text-slate-300 font-mono leading-relaxed">
                {quest.description}
              </p>
            )}
          </div>

          {/* Sub-quests Checklist Section */}
          {quest.subquests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="uppercase tracking-widest text-slate-400">
                  PROTOCOL OBJECTIVES ({completedCount}/{totalSubquests})
                </span>
                <span className={isFullyCompleted ? 'text-[#3cff9e] font-bold' : 'text-slate-400'}>
                  {Math.round((completedCount / (totalSubquests || 1)) * 100)}% EXECUTED
                </span>
              </div>

              <div className="space-y-2">
                {quest.subquests.map((task) => (
                  <button
                    type="button"
                    key={task.id}
                    disabled={isClaimed}
                    onClick={() => toggleSubtask(task.id, task.completed)}
                    className={`w-full p-3.5 bg-[#1a0a0d] border flex items-center justify-between gap-3 text-left transition-all ${
                      isClaimed
                        ? 'border-[#2a1418] opacity-70 cursor-default'
                        : 'cursor-pointer hover:border-[#00f6ff]/50'
                    } ${
                      task.completed
                        ? 'border-[#3cff9e]/40 bg-[#07050a] text-slate-400'
                        : 'border-[#2a1418] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#3cff9e] shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-[#00f6ff] shrink-0 transition-colors" />
                      )}
                      <span className={`text-sm font-mono ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#ffd84a] shrink-0 font-bold">
                      +{task.xpReward} XP
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Trigger Footer with SVG Clockwise Charge Button */}
          <div className="pt-4 border-t border-[#2a1418] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              TELEMETRY // NEON LAKEBASE POSTGRES
            </div>

            <div>
              {isClaimed ? (
                <span className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-bold uppercase text-[#3cff9e] bg-[#3cff9e]/10 border border-[#3cff9e]/30">
                  <Check className="w-4 h-4" />
                  OPERATION COMPLETED & XP CLAIMED
                </span>
              ) : (
                <HudChargeButton
                  label={isFullyCompleted ? 'HOLD TO EXECUTE CLAIM' : 'HOLD TO COMPLETE OPERATION'}
                  sublabel="CHARGE // CONFIRM XP"
                  variant="primary"
                  loading={actionLoading}
                  onComplete={handleCompleteQuest}
                />
              )}
            </div>
          </div>
        </HudBracketFrame>
      </div>
    </main>
  );
}

