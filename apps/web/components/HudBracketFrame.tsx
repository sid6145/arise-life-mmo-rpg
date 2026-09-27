import React from 'react';

export interface HudBracketFrameProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  active?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'iconic';
  stripe?: boolean;
}

const RARITY_STRIPES: Record<string, string> = {
  common: 'border-l-4 border-l-[#c9d1d9]',
  uncommon: 'border-l-4 border-l-[#3cff9e]',
  rare: 'border-l-4 border-l-[#3ba7ff]',
  epic: 'border-l-4 border-l-[#bf5af2]',
  legendary: 'border-l-4 border-l-[#ffb020]',
  iconic: 'border-l-4 border-l-[#ff003c]',
};

/**
 * Reusable 4-Corner Viewfinder Bracket Frame per design.md Section 1.4.
 * Creates 4 independent L-shaped border brackets around content with optional rarity stripe.
 */
export function HudBracketFrame({
  children,
  className = '',
  glow = false,
  active = true,
  rarity,
  stripe = true,
}: HudBracketFrameProps) {
  const stripeClass = rarity && stripe ? RARITY_STRIPES[rarity] || '' : '';

  return (
    <div
      className={`relative bg-bg-panel-900 border border-border-subtle ${stripeClass} ${
        glow ? 'shadow-glow-red' : ''
      } ${className}`}
    >
      {/* 4 Independent Corner L-Brackets */}
      {/* Top-Left */}
      <span className="absolute -top-[2px] -left-[2px] w-3 h-3 border-t-2 border-l-2 border-border-bracket pointer-events-none z-10" />
      {/* Top-Right */}
      <span className="absolute -top-[2px] -right-[2px] w-3 h-3 border-t-2 border-r-2 border-border-bracket pointer-events-none z-10" />
      {/* Bottom-Left */}
      <span className="absolute -bottom-[2px] -left-[2px] w-3 h-3 border-b-2 border-l-2 border-border-bracket pointer-events-none z-10" />
      {/* Bottom-Right */}
      <span className="absolute -bottom-[2px] -right-[2px] w-3 h-3 border-b-2 border-r-2 border-border-bracket pointer-events-none z-10" />

      {children}
    </div>
  );
}
