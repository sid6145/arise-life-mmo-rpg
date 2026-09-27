import React from 'react';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export function QuestLogSkeleton() {
  return (
    <main className="min-h-screen bg-[#07050a] text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Status Bar Skeleton */}
        <HudBracketFrame
          rarity="iconic"
          className="p-5 sm:p-6 bg-[#120608]/90 border border-[#2a1418] relative overflow-hidden"
        >
          {/* Faint Scanning Laser Line */}
          <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#ff003c]/5 to-transparent pointer-events-none animate-hud-sweep" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1a0a0d] border-2 border-[#ff003c]/40 animate-hud-skeleton flex items-center justify-center" />
              <div className="space-y-2">
                <div className="h-6 w-44 bg-[#1a0a0d] animate-hud-skeleton" />
                <div className="h-3.5 w-60 bg-[#1a0a0d] animate-hud-skeleton" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
              <div className="h-10 w-28 bg-[#1a0a0d] border border-[#ffd84a]/20 animate-hud-skeleton" />
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#2a1418]">
            <div className="flex justify-between">
              <div className="h-3 w-28 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="h-3 w-36 bg-[#1a0a0d] animate-hud-skeleton" />
            </div>
            <div className="h-2.5 w-full bg-[#1a0a0d] border border-[#2a1418] overflow-hidden">
              <div className="h-full w-2/5 bg-[#ff003c]/30 animate-pulse" />
            </div>
          </div>
        </HudBracketFrame>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-[#00f6ff]/40 animate-hud-skeleton" />
            <div className="h-5 w-48 bg-[#1a0a0d] animate-hud-skeleton" />
          </div>
          <div className="h-8 w-36 bg-[#00f6ff]/20 animate-hud-skeleton" />
        </div>

        {/* Quest Cards Skeleton List */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <HudBracketFrame
              key={i}
              rarity={i === 1 ? 'rare' : i === 2 ? 'uncommon' : 'epic'}
              className="p-5 sm:p-6 bg-[#120608] border border-[#2a1418] space-y-4 relative overflow-hidden"
            >
              {/* Header Tags */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-24 bg-[#1a0a0d] border border-[#00f6ff]/30 animate-hud-skeleton" />
                  <div className="h-5 w-28 bg-[#1a0a0d] border border-[#ff8a3d]/30 animate-hud-skeleton" />
                  <div className="h-5 w-32 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
                </div>
                <div className="h-6 w-20 bg-[#ffd84a]/10 border border-[#ffd84a]/30 animate-hud-skeleton" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-[#1a0a0d] animate-hud-skeleton" />
                <div className="h-4 w-full bg-[#1a0a0d] animate-hud-skeleton" />
                <div className="h-4 w-2/3 bg-[#1a0a0d] animate-hud-skeleton" />
              </div>

              {/* Checklist Objectives Box */}
              <div className="space-y-2 bg-[#1a0a0d]/90 p-3.5 border border-[#2a1418]">
                <div className="flex justify-between">
                  <div className="h-3 w-32 bg-[#2a1418] animate-hud-skeleton" />
                  <div className="h-3 w-20 bg-[#2a1418] animate-hud-skeleton" />
                </div>
                <div className="h-9 w-full bg-[#120608] border border-[#2a1418] animate-hud-skeleton" />
                <div className="h-9 w-full bg-[#120608] border border-[#2a1418] animate-hud-skeleton" />
              </div>

              {/* Card Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#2a1418]">
                <div className="h-3 w-40 bg-[#1a0a0d] animate-hud-skeleton" />
                <div className="h-10 w-48 bg-[#1a0a0d] border border-[#ff003c]/40 animate-hud-skeleton" />
              </div>
            </HudBracketFrame>
          ))}
        </div>
      </div>
    </main>
  );
}
