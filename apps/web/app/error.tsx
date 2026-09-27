'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-base bg-tech-grid flex items-center justify-center p-4 text-slate-200">
      <div className="cyber-panel max-w-md w-full bg-surface-900 border border-neon-crimson p-8 text-center space-y-4 shadow-glow-crimson">
        <div className="w-14 h-14 mx-auto bg-red-950/60 border-2 border-neon-crimson flex items-center justify-center clip-cyber-btn shadow-glow-crimson">
          <AlertCircle className="w-7 h-7 text-neon-crimson" />
        </div>
        <h1 className="font-orbitron font-extrabold text-2xl text-white uppercase tracking-wider">
          System Anomaly Detected
        </h1>
        <p className="text-xs font-sans text-slate-400">
          {error.message || 'An unexpected error occurred during execution.'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neon-crimson hover:bg-red-400 text-black font-mono font-bold uppercase tracking-wider text-xs clip-cyber-btn shadow-glow-crimson transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reboot Neural Link</span>
          </button>
        </div>
      </div>
    </main>
  );
}
