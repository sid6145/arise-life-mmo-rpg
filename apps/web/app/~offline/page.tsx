'use client';

import React from 'react';
import { WifiOff, RefreshCw, Radio } from 'lucide-react';
import { HudBracketFrame } from '@/components/HudBracketFrame';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <HudBracketFrame
        rarity="epic"
        className="max-w-md w-full bg-bg-panel-900 border border-border-subtle p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative corner telemetry */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 border-b border-border-subtle pb-2">
          <span className="flex items-center gap-1.5 text-accent-cyber-red">
            <Radio className="w-3 h-3 animate-pulse" />
            OFFLINE_PROTOCOL // ENGAGED
          </span>
          <span>NET_CODE: 0xDEADBEEF</span>
        </div>

        {/* Icon and Main Alert */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-bg-panel-800 border-2 border-accent-cyber-red/60 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,60,0.3)]">
            <WifiOff className="w-8 h-8 text-accent-cyber-red" />
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-orbitron font-black tracking-wider text-white">
              CONNECTION <span className="text-accent-cyber-red">LOST</span>
            </h1>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              TELEMETRY LINK SEVERED // CACHED DATA ACTIVE
            </p>
          </div>
        </div>

        {/* Tactical status readout */}
        <div className="bg-bg-void/80 border border-border-subtle p-3.5 rounded text-xs font-mono space-y-2 text-slate-300">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">CARRIER SIGNAL:</span>
            <span className="text-accent-cyber-red font-bold">UNREACHABLE</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">OFFLINE CACHE:</span>
            <span className="text-accent-cyber-cyan font-bold">READ-ONLY STANDALONE</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-border-subtle/50">
            You are currently disconnected from the grid. Cached quests and character logs remain viewable, but telemetry mutations require an active carrier link.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleReload}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-accent-cyber-red hover:bg-red-500 text-black font-mono font-bold text-xs uppercase tracking-wider clip-cyber-btn shadow-glow-red transition-all touch-press"
        >
          <RefreshCw className="w-4 h-4" />
          <span>RETRY GRID LINK</span>
        </button>
      </HudBracketFrame>
    </div>
  );
}
