import React from 'react';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export function QuestDetailSkeleton() {
  return (
    <main className="min-h-screen bg-[#07050a] text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-36 h-5 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
          <div className="w-24 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
        </div>

        {/* Main Quest HUD Frame */}
        <HudBracketFrame
          active={true}
          rarity="uncommon"
          className="bg-[#120608] border border-[#2a1418] p-6 sm:p-8 space-y-6 relative"
        >
          {/* Header Metadata Chips & XP Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2a1418]">
            <div className="flex items-center gap-2">
              <div className="w-28 h-6 bg-[#1a0a0d] border border-[#00f6ff]/30 animate-hud-skeleton" />
              <div className="w-24 h-6 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
              <div className="w-24 h-6 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
            </div>

            <div className="w-32 h-7 bg-[#ffd84a]/10 border border-[#ffd84a]/30 animate-hud-skeleton" />
          </div>

          {/* Quest Title & Description */}
          <div className="space-y-3">
            <div className="w-3/4 h-8 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
            <div className="space-y-2">
              <div className="w-full h-4 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="w-5/6 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
            </div>
          </div>

          {/* Protocol Objectives Checklist Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="w-44 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="w-24 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
            </div>

            <div className="space-y-2">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-full p-3.5 bg-[#1a0a0d] border border-[#2a1418] flex items-center justify-between gap-3 animate-hud-skeleton"
                >
                  <div className="flex items-center gap-3 w-3/4">
                    <div className="w-5 h-5 rounded-full border border-slate-700 bg-[#07050a] shrink-0" />
                    <div className="w-2/3 h-4 bg-[#2a1418]" />
                  </div>
                  <div className="w-14 h-4 bg-[#ffd84a]/20 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Execution Button Placeholder */}
          <div className="pt-4 border-t border-[#2a1418]">
            <div className="w-full h-14 bg-[#1a0a0d] border border-[#ff003c]/40 animate-hud-skeleton relative overflow-hidden flex items-center justify-center">
              <div className="w-48 h-5 bg-[#ff003c]/20" />
            </div>
          </div>
        </HudBracketFrame>
      </div>
    </main>
  );
}
