import React from 'react';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export function CharacterSheetSkeleton() {
  return (
    <main className="min-h-screen bg-[#07050a] text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Operative Telemetry & Identity Banner */}
        <HudBracketFrame active={true} rarity="rare" className="p-6 bg-[#120608] border border-[#2a1418] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* LVL Hex Pod */}
              <div className="w-16 h-16 bg-[#1a0a0d] border-2 border-[#00f6ff]/40 flex flex-col items-center justify-center animate-hud-skeleton relative overflow-hidden">
                <div className="w-8 h-2 bg-[#2a1418] mb-1 rounded" />
                <div className="w-6 h-5 bg-[#00f6ff]/20 rounded" />
              </div>

              {/* Callsign & Operative Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-36 h-6 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
                  <div className="w-20 h-4 bg-[#ff003c]/20 border border-[#ff003c]/30 animate-hud-skeleton" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-4 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
                  <div className="w-28 h-4 bg-[#ffd84a]/20 border border-[#ffd84a]/30 animate-hud-skeleton" />
                </div>
              </div>
            </div>

            {/* Streak / Session Telemetry Badge */}
            <div className="w-32 h-10 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
          </div>

          {/* Synapse XP Progress Bar */}
          <div className="space-y-1.5 pt-3 border-t border-[#2a1418]">
            <div className="flex justify-between items-center text-xs font-mono">
              <div className="w-48 h-3 bg-[#1a0a0d] animate-hud-skeleton" />
              <div className="w-24 h-3 bg-[#1a0a0d] animate-hud-skeleton" />
            </div>
            <div className="h-2.5 w-full bg-[#1a0a0d] border border-[#2a1418] overflow-hidden relative">
              <div className="h-full w-2/3 bg-gradient-to-r from-[#00f6ff]/40 to-[#ffd84a]/40 animate-hud-sweep" />
            </div>
          </div>
        </HudBracketFrame>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#2a1418] pb-1">
          <div className="w-44 h-8 bg-[#120608] border-b-2 border-[#00f6ff] animate-hud-skeleton" />
          <div className="w-40 h-8 bg-[#1a0a0d] border-b-2 border-transparent animate-hud-skeleton opacity-60" />
          <div className="w-36 h-8 bg-[#1a0a0d] border-b-2 border-transparent animate-hud-skeleton opacity-60" />
        </div>

        {/* Constellation Canvas Skeleton */}
        <HudBracketFrame className="p-6 bg-[#120608] border border-[#2a1418] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#00f6ff]/30 animate-hud-skeleton" />
              <div className="w-56 h-5 bg-[#1a0a0d] animate-hud-skeleton" />
            </div>
            <div className="w-36 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
          </div>

          {/* Radial Canvas Simulation */}
          <div className="relative w-full max-w-lg mx-auto aspect-[5/3.6] flex items-center justify-center p-2">
            {/* SVG PCB Circuit Connector Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 500 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 250 50 L 250 180" stroke="#ff003c" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />
              <path d="M 420 110 L 335 110 L 250 180" stroke="#bf5af2" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />
              <path d="M 420 250 L 335 250 L 250 180" stroke="#00f6ff" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />
              <path d="M 250 310 L 250 180" stroke="#3ba7ff" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />
              <path d="M 80 250 L 165 250 L 250 180" stroke="#3cff9e" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />
              <path d="M 80 110 L 165 110 L 250 180" stroke="#ffd84a" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 4" />

              <circle cx="250" cy="180" r="46" stroke="#ff003c" strokeWidth="1.5" strokeOpacity="0.2" />
            </svg>

            {/* Central Nexus Core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#07050a] border-2 border-[#ff003c]/50 flex flex-col items-center justify-center animate-hud-skeleton z-10">
              <div className="w-8 h-2 bg-[#00f6ff]/30 mb-1" />
              <div className="w-10 h-5 bg-[#ff003c]/20" />
            </div>

            {/* 6 Peripheral Hex Nodes */}
            {[
              { top: '14%', left: '50%' },
              { top: '30%', left: '84%' },
              { top: '70%', left: '84%' },
              { top: '86%', left: '50%' },
              { top: '70%', left: '16%' },
              { top: '30%', left: '16%' },
            ].map((pos, idx) => (
              <div
                key={idx}
                style={{ top: pos.top, left: pos.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#1a0a0d] border border-[#2a1418] flex flex-col items-center justify-center animate-hud-skeleton"
              >
                <div className="w-6 h-2 bg-slate-700/60 mb-1" />
                <div className="w-4 h-3 bg-slate-700/40" />
              </div>
            ))}
          </div>

          {/* Selected Node Drawer Skeleton */}
          <div className="mt-6 border-t border-[#2a1418] pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
                <div className="space-y-1.5">
                  <div className="w-36 h-4 bg-[#1a0a0d] animate-hud-skeleton" />
                  <div className="w-24 h-3 bg-[#1a0a0d] animate-hud-skeleton" />
                </div>
              </div>
              <div className="w-24 h-8 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />
            </div>

            <div className="w-full h-12 bg-[#1a0a0d] border border-[#2a1418] animate-hud-skeleton" />

            {/* Directives Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-3.5 bg-[#1a0a0d] border border-[#2a1418] space-y-2 animate-hud-skeleton">
                  <div className="w-3/4 h-4 bg-[#2a1418]" />
                  <div className="w-1/2 h-3 bg-[#2a1418]" />
                </div>
              ))}
            </div>
          </div>
        </HudBracketFrame>
      </div>
    </main>
  );
}
