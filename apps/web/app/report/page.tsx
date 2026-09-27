'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Flame, 
  Zap, 
  ArrowRight, 
  Target, 
  Sparkles, 
  Lightbulb,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export default function WeeklyReportPage() {
  const debrief = {
    cycleId: 'CYCLE 39',
    period: 'SEPT 19 - SEPT 26',
    xpEarned: '+3,420 XP',
    xpDelta: '+18% vs Last Cycle',
    completedQuests: 14,
    skippedQuests: 2,
    completionRate: 88,
    currentStreak: 12,
    efficiencyGrade: 'A',
    aiAnalysis: [
      "High neural cadence: 100% completion rate on daily strength and deep work operations.",
      'Weekend learning directives registered slight latency without a scheduled neural window.',
      'Boss Challenge (Ship Monorepo v1.0.0) is at 66% calibration and on track for milestone completion.',
    ],
    suggestion:
      'Segment weekend deep work into dual 25-minute synaptic bursts rather than a single uninterrupted block.',
  };

  return (
    <main className="min-h-screen bg-[#07050a] text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* REPORT HEADER */}
        <HudBracketFrame
          active={true}
          rarity="rare"
          className="p-6 bg-[#120608]/90 border border-[#2a1418] relative"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-[#1a0a0d] border-2 border-[#00f6ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,246,255,0.3)]">
                <FileText className="w-6 h-6 text-[#00f6ff]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1a0a0d] text-[#00f6ff] border border-[#00f6ff]/40 font-bold">
                    {debrief.cycleId}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{debrief.period}</span>
                </div>
                <h1 className="font-mono font-black text-2xl text-white uppercase tracking-wider mt-1">
                  Tactical Debrief // Weekly
                </h1>
              </div>
            </div>

            {/* Overall Grade Pod */}
            <div className="flex items-center gap-3 bg-[#1a0a0d] border border-[#2a1418] p-3 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">EFFICIENCY GRADE</span>
                <span className="text-xs font-mono text-[#3cff9e] font-bold">OPTIMAL</span>
              </div>
              <div className="w-12 h-12 bg-[#07050a] border-2 border-[#00f6ff] flex items-center justify-center font-mono font-black text-2xl text-[#00f6ff] shadow-[0_0_12px_rgba(0,246,255,0.4)]">
                {debrief.efficiencyGrade}
              </div>
            </div>
          </div>
        </HudBracketFrame>

        {/* WEEKLY STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* XP Gained */}
          <HudBracketFrame rarity="legendary" className="bg-[#120608] border border-[#2a1418] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-[#ffd84a] font-bold">
                <Zap className="w-3.5 h-3.5" /> TOTAL XP TELEMETRY
              </span>
              <span className="text-[#3cff9e] font-bold">{debrief.xpDelta}</span>
            </div>
            <div className="font-mono font-black text-2xl text-white">{debrief.xpEarned}</div>
            <p className="text-[10px] font-mono text-slate-500">Cumulative across all completed operations</p>
          </HudBracketFrame>

          {/* Quests Completed vs Skipped */}
          <HudBracketFrame rarity="rare" className="bg-[#120608] border border-[#2a1418] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-[#00f6ff] font-bold">
                <Target className="w-3.5 h-3.5" /> OPERATIONS EXECUTED
              </span>
              <span className="text-[#00f6ff] font-bold">{debrief.completionRate}%</span>
            </div>
            <div className="font-mono font-black text-2xl text-white flex items-baseline gap-2">
              <span>{debrief.completedQuests}</span>
              <span className="text-xs font-mono text-slate-400 font-normal">
                DONE / <span className="text-[#ff003c] font-bold">{debrief.skippedQuests} LATENT</span>
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-500">{debrief.completionRate}% protocol fulfillment</p>
          </HudBracketFrame>

          {/* Current Streak */}
          <HudBracketFrame rarity="iconic" className="bg-[#120608] border border-[#2a1418] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-[#ffd84a] font-bold">
                <Flame className="w-3.5 h-3.5" /> CONSECUTIVE SYNAPSE
              </span>
              <span className="text-[#ffd84a] font-bold">ACTIVE</span>
            </div>
            <div className="font-mono font-black text-2xl text-white flex items-baseline gap-2">
              <span>{debrief.currentStreak}</span>
              <span className="text-xs font-mono text-slate-400 font-normal">DAYS</span>
            </div>
            <p className="text-[10px] font-mono text-slate-500">Zero protocol dropouts recorded</p>
          </HudBracketFrame>
        </div>

        {/* AI GRANDMASTER DEBRIEF & TACTICAL ANALYSIS */}
        <HudBracketFrame rarity="epic" className="bg-[#120608] border border-[#2a1418] p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#2a1418]">
            <Sparkles className="w-5 h-5 text-[#bf5af2]" />
            <h2 className="font-mono font-black text-lg text-white uppercase tracking-wide">
              Neural AI Grandmaster Analysis
            </h2>
          </div>

          <div className="space-y-3">
            {debrief.aiAnalysis.map((item, index) => (
              <div key={index} className="flex items-start gap-3 text-xs sm:text-sm font-mono text-slate-300">
                <span className="text-[#00f6ff] font-bold mt-0.5">[{index + 1}]</span>
                <p className="leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          {/* Optimization Directive */}
          <div className="p-4 bg-[#1a0a0d] border border-[#ffd84a]/40 flex items-start gap-3.5 shadow-[0_0_10px_rgba(255,216,74,0.15)]">
            <Lightbulb className="w-5 h-5 text-[#ffd84a] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-mono uppercase text-[#ffd84a] font-bold block mb-0.5">
                RECOMMENDED SYNAPSE OPTIMIZATION
              </span>
              <p className="text-xs sm:text-sm text-white font-mono leading-relaxed">
                {debrief.suggestion}
              </p>
            </div>
          </div>
        </HudBracketFrame>

        {/* RETURN CTA */}
        <div className="flex justify-end pt-2">
          <Link
            href="/"
            onClick={() => soundManager.playTap()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00f6ff] hover:bg-[#3cff9e] text-black font-mono font-bold uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(0,246,255,0.4)] min-h-[44px]"
          >
            <span>RETURN TO DISPATCH LOG</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
