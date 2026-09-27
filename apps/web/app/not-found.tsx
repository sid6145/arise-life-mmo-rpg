import React from 'react';
import Link from 'next/link';
import { Crosshair, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-base bg-tech-grid flex items-center justify-center p-4 text-slate-200">
      <div className="cyber-panel max-w-md w-full bg-surface-900 border border-cyan-neon p-8 text-center space-y-4 shadow-glow-cyan">
        <div className="w-14 h-14 mx-auto bg-cyan-950/60 border-2 border-cyan-neon flex items-center justify-center clip-cyber-btn shadow-glow-cyan">
          <Crosshair className="w-7 h-7 text-cyan-neon animate-pulse" />
        </div>
        <h1 className="font-orbitron font-extrabold text-2xl text-white uppercase tracking-wider">
          404 - Sector Not Found
        </h1>
        <p className="text-xs font-sans text-slate-400">
          The requested coordinate does not exist in the neural matrix.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-neon hover:bg-cyan-300 text-black font-mono font-bold uppercase tracking-wider text-xs clip-cyber-btn shadow-glow-cyan transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Quest Log</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
