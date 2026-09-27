'use client';

import React, { useState, useEffect } from 'react';

/**
 * Shared full-screen wrapper providing CRT scanlines, drifting decorative telemetry columns,
 * and rare ambient scan sweeps per design.md Section 1.5 & Section 14.1.
 * Respects prefers-reduced-motion and tab visibility.
 */
export function HudBackgroundLayer({ children }: { children: React.ReactNode }) {
  const [telemetryStrings, setTelemetryStrings] = useState<string[]>([]);
  const [isSweeping, setIsSweeping] = useState(false);

  useEffect(() => {
    // Generate pseudo-random hex/binary streams per session
    const streams: string[] = [];
    for (let i = 0; i < 18; i++) {
      const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
      const bin = Math.floor(Math.random() * 256).toString(2).padStart(8, '0');
      streams.push(`0x${hex} // ${bin}`);
    }
    setTelemetryStrings(streams);

    // Section 14.1: Rare randomized ambient scan sweep (12s - 20s interval)
    let sweepTimeout: NodeJS.Timeout | null = null;

    const scheduleSweep = () => {
      if (document.visibilityState !== 'visible' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }
      const delay = Math.floor(Math.random() * 8000) + 12000;
      sweepTimeout = setTimeout(() => {
        setIsSweeping(true);
        setTimeout(() => {
          setIsSweeping(false);
          scheduleSweep();
        }, 1250);
      }, delay);
    };

    scheduleSweep();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleSweep();
      } else if (sweepTimeout) {
        clearTimeout(sweepTimeout);
        setIsSweeping(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (sweepTimeout) clearTimeout(sweepTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-void text-slate-200 overflow-x-hidden">
      {/* 1. Subtle Red Grid Background */}
      <div className="fixed inset-0 pointer-events-none hud-tech-grid z-0" />

      {/* 2. Full-screen CRT Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none hud-scanlines opacity-50 z-40" />

      {/* 3. Section 14.1 Rare Ambient Scan-Sweep Line (1.2s top-to-bottom) - fixed over entire viewport */}
      {isSweeping && (
        <div className="fixed left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f6ff] to-transparent shadow-[0_0_15px_#00f6ff] pointer-events-none z-50 animate-ambient-sweep" />
      )}

      {/* 4. Section 14.1 Drifting Decorative Telemetry Columns (60s loop) */}
      <div className="hidden lg:flex fixed top-16 left-3 bottom-0 flex-col gap-2 font-mono text-[10px] text-accent-cyber-red/30 select-none pointer-events-none z-0 animate-telemetry-drift-left">
        <span className="font-bold text-accent-cyber-red/50">SYS_DIAG // v2.077</span>
        {telemetryStrings.slice(0, 10).map((str, idx) => (
          <span key={`l-${idx}`}>{str}</span>
        ))}
      </div>

      <div className="hidden lg:flex fixed top-16 right-3 bottom-0 flex-col gap-2 font-mono text-[10px] text-accent-cyber-red/30 select-none pointer-events-none z-0 text-right animate-telemetry-drift-right">
        <span className="font-bold text-accent-cyber-red/50">NET_STREAM // SEC_09</span>
        {telemetryStrings.slice(6, 16).map((str, idx) => (
          <span key={`r-${idx}`}>{str}</span>
        ))}
      </div>

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
