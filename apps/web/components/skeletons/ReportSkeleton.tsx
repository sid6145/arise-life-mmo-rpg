import React from 'react';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export function ReportSkeleton() {
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
              <div className="w-12 h-12 bg-[#1a0a0d] border-2 border-[#00f6ff]/40 flex items-center justify-center animate-hud-skeleton" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-4 bg-[#1a0a0d] border border-[#00f6ff]/30 animate-hud-skeleton" />
                  <div className="w-32 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
                </div>
                <div className="w-56 h-7 bg-[#1a0a0d] animate-hud-skeleton" />
              </div>
            </div>

            <div className="w-28 h-12 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
          </div>
        </HudBracketFrame>

        {/* METRICS HUD GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <HudBracketFrame
              key={i}
              className="p-5 bg-[#120608] border border-[#2a1418] space-y-2"
            >
              <div className="w-24 h-3 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="w-36 h-8 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="w-28 h-3 bg-[#1a0a0d] animate-hud-skeleton" />
            </HudBracketFrame>
          ))}
        </div>

        {/* AI ANALYSIS SECTION */}
        <HudBracketFrame
          rarity="uncommon"
          className="p-6 bg-[#120608] border border-[#2a1418] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#2a1418] pb-3">
            <div className="w-48 h-5 bg-[#1a0a0d] animate-hud-skeleton" />
            <div className="w-24 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 bg-[#1a0a0d] border border-[#2a1418] flex items-start gap-3 animate-hud-skeleton"
              >
                <div className="w-4 h-4 rounded-full bg-[#00f6ff]/20 shrink-0 mt-0.5" />
                <div className="w-full space-y-2">
                  <div className="w-5/6 h-4 bg-[#2a1418]" />
                  <div className="w-2/3 h-3 bg-[#2a1418]" />
                </div>
              </div>
            ))}
          </div>
        </HudBracketFrame>
      </div>
    </main>
  );
}
