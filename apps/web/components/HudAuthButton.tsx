'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { emitFeedback } from '@/lib/feedbackBus';

export interface HudAuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  glitchSuccess?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button' | 'reset';
  onClick?: () => void;
  className?: string;
}

const CIPHER_GLYPHS = '0123456789ABCDEF!@#$%&*<>[]{}//';

/**
 * Instant-Press Tactical Auth Button per design.md Section 13.3.
 * Features instant-press scale feedback, decrypt/scramble-text loading state,
 * and a single-frame glitch-on-success transition.
 * Explicitly DOES NOT use the press-and-hold charge mechanic.
 */
export function HudAuthButton({
  children,
  loading = false,
  loadingText = 'AUTHENTICATING...',
  glitchSuccess = false,
  disabled = false,
  type = 'submit',
  onClick,
  className = '',
}: HudAuthButtonProps) {
  const [scrambledText, setScrambledText] = useState(loadingText);

  useEffect(() => {
    if (!loading) return;

    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setScrambledText(loadingText);
      return;
    }

    // Rapid scramble interval (50ms)
    const interval = setInterval(() => {
      const len = loadingText.length;
      let result = '';
      for (let i = 0; i < len; i++) {
        if (loadingText[i] === ' ' || loadingText[i] === '.') {
          result += loadingText[i];
        } else if (Math.random() > 0.6) {
          result += loadingText[i];
        } else {
          result += CIPHER_GLYPHS[Math.floor(Math.random() * CIPHER_GLYPHS.length)];
        }
      }
      setScrambledText(result);
    }, 50);

    return () => clearInterval(interval);
  }, [loading, loadingText]);

  const handleClick = () => {
    emitFeedback('tap');
    onClick?.();
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`relative w-full py-3.5 px-6 font-mono font-bold uppercase tracking-wider text-xs clip-cyber-btn transition-all select-none flex items-center justify-center gap-2 touch-press ${
        glitchSuccess
          ? 'bg-accent-street-green text-black animate-single-glitch'
          : 'bg-accent-cyber-cyan hover:bg-[#5ff9ff] text-black shadow-glow-cyan'
      } ${disabled || loading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2 tracking-widest font-mono text-black">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-black" />
          <span>{scrambledText}</span>
        </span>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight className="w-4 h-4 text-black shrink-0 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </button>
  );
}
