import React from 'react';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export function GoalsSkeleton() {
  return (
    <main className="min-h-screen bg-[#07050a] text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Directive Capacity Skeleton */}
        <HudBracketFrame
          rarity="rare"
          className="p-6 bg-[#120608]/90 border border-[#2a1418] relative overflow-hidden"
        >
          <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-[#00f6ff]/5 to-transparent pointer-events-none animate-hud-sweep" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-64 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="h-4 w-80 bg-[#1a0a0d] animate-hud-skeleton" />
            </div>

            <div className="bg-[#1a0a0d] border border-[#2a1418] p-3 flex items-center gap-3">
              <div className="space-y-1 text-right">
                <div className="h-2.5 w-24 bg-[#2a1418] animate-hud-skeleton" />
                <div className="h-3.5 w-32 bg-[#2a1418] animate-hud-skeleton" />
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-3.5 h-6 bg-[#00f6ff]/20 border border-[#00f6ff]/40 animate-hud-skeleton" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#2a1418] flex items-center justify-between">
            <div className="h-3 w-48 bg-[#1a0a0d] animate-hud-skeleton" />
            <div className="h-3 w-44 bg-[#1a0a0d] animate-hud-skeleton" />
          </div>
        </HudBracketFrame>

        {/* Controls Bar Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-[#1a0a0d] animate-hud-skeleton" />
          <div className="h-10 w-36 bg-[#00f6ff]/20 animate-hud-skeleton" />
        </div>

        {/* Directive Cards Skeleton List */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <HudBracketFrame
              key={i}
              rarity={i === 1 ? 'rare' : 'epic'}
              className="bg-[#120608] border border-[#2a1418] p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-[#1a0a0d] border border-[#00f6ff]/30 animate-hud-skeleton" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-[#1a0a0d] animate-hud-skeleton" />
                    <div className="h-5 w-60 bg-[#1a0a0d] animate-hud-skeleton" />
                    <div className="h-3.5 w-72 bg-[#1a0a0d] animate-hud-skeleton" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
                  <div className="w-10 h-10 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
                </div>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-3 w-40 bg-[#1a0a0d] animate-hud-skeleton" />
                    <div className="h-3 w-32 bg-[#1a0a0d] animate-hud-skeleton" />
                  </div>
                  <div className="h-2.5 w-full bg-[#1a0a0d] border border-[#2a1418] overflow-hidden">
                    <div className="h-full w-1/3 bg-[#00f6ff]/30 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-[#2a1418]">
                <div className="h-3 w-36 bg-[#1a0a0d] animate-hud-skeleton" />
                <div className="h-3 w-28 bg-[#1a0a0d] animate-hud-skeleton" />
              </div>
            </HudBracketFrame>
          ))}
        </div>
      </div>
    </main>
  );
}
