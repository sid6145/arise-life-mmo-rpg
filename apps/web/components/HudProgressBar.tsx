'use client';

import React from 'react';

export interface HudProgressBarProps {
  progress: number; // 0 - 100
  variant?: 'xp' | 'cyan' | 'purple' | 'gold' | 'green' | 'crimson';
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  showLeadingGlow?: boolean;
  glowBurst?: boolean;
  rarityGlow?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'iconic';
}

const VARIANT_FILLS: Record<string, { bg: string; leadingGlow: string }> = {
  xp: {
    bg: 'bg-gradient-to-r from-[#00f6ff] to-[#ffd84a]',
    leadingGlow: 'bg-[#ffd84a] shadow-[0_0_8px_1px_rgba(255,216,74,0.6)]',
  },
  cyan: {
    bg: 'bg-[#00f6ff]',
    leadingGlow: 'bg-[#00f6ff] shadow-[0_0_8px_1px_rgba(0,246,255,0.6)]',
  },
  purple: {
    bg: 'bg-[#bf5af2]',
    leadingGlow: 'bg-[#bf5af2] shadow-[0_0_8px_1px_rgba(191,90,242,0.6)]',
  },
  gold: {
    bg: 'bg-[#ffd84a]',
    leadingGlow: 'bg-[#ffd84a] shadow-[0_0_8px_1px_rgba(255,216,74,0.6)]',
  },
  green: {
    bg: 'bg-[#3cff9e]',
    leadingGlow: 'bg-[#3cff9e] shadow-[0_0_8px_1px_rgba(60,255,158,0.6)]',
  },
  crimson: {
    bg: 'bg-[#ff003c]',
    leadingGlow: 'bg-[#ff003c] shadow-[0_0_8px_1px_rgba(255,0,60,0.6)]',
  },
};

const RARITY_BURSTS: Record<string, string> = {
  common: 'shadow-[0_0_12px_rgba(201,209,217,0.7)]',
  uncommon: 'shadow-[0_0_12px_rgba(60,255,158,0.7)]',
  rare: 'shadow-[0_0_12px_rgba(59,167,255,0.7)]',
  epic: 'shadow-[0_0_12px_rgba(191,90,242,0.7)]',
  legendary: 'shadow-[0_0_12px_rgba(255,176,32,0.7)]',
  iconic: 'shadow-[0_0_16px_rgba(255,0,60,0.8)]',
};

/**
 * Shared HUD Progress & XP Bar Component per design.md Section 1.2 & Section 8.3.
 * Uses two-stop gradient-xp-fill (cyan -> gold) with leading-edge glow tracking
 * and GPU-composited transform: scaleX() fill.
 */
export function HudProgressBar({
  progress,
  variant = 'xp',
  className = 'h-2.5 w-full',
  trackClassName = 'bg-[#120608] border border-border-subtle',
  fillClassName,
  showLeadingGlow = true,
  glowBurst = false,
  rarityGlow,
}: HudProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));
  const config = VARIANT_FILLS[variant] || VARIANT_FILLS.xp;
  const burstClass = glowBurst && rarityGlow ? RARITY_BURSTS[rarityGlow] || '' : '';

  return (
    <div
      className={`relative overflow-hidden ${trackClassName} ${className} ${burstClass}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* ScaleX Fill Container */}
      <div
        className={`h-full w-full relative ${fillClassName || config.bg}`}
        style={{
          transform: `scaleX(${clamped / 100})`,
          transformOrigin: 'left',
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Leading-Edge Glow (Design.md Section 1.2 & 8.3) */}
        {showLeadingGlow && clamped > 0 && (
          <div
            className={`absolute right-0 top-0 bottom-0 w-2.5 pointer-events-none ${config.leadingGlow}`}
          />
        )}
      </div>
    </div>
  );
}
