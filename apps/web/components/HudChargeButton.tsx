'use client';

import React, { useState, useRef, useEffect } from 'react';
import { emitFeedback } from '@/lib/feedbackBus';

interface HudChargeButtonProps {
  onComplete: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  sublabel?: string;
  variant?: 'primary' | 'danger' | 'cyan';
  className?: string;
}

export function HudChargeButton({
  onComplete,
  disabled = false,
  loading = false,
  label = 'HOLD TO JACK IN',
  sublabel = 'CHARGE // EXECUTE',
  variant = 'primary',
  className = '',
}: HudChargeButtonProps) {
  const [charging, setCharging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [glitching, setGlitching] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const DURATION = 650; // ms per design.md Section 8.1 / 8.2

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || loading) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setCharging(true);
    setProgress(0);
    startTimeRef.current = performance.now();
    emitFeedback('charge_start');

    const tick = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(pct);

      if (pct >= 100) {
        // Complete!
        setCharging(false);
        setGlitching(true);
        emitFeedback('charge_complete');
        setTimeout(() => setGlitching(false), 280);
        onComplete();
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handlePointerUp = () => {
    if (!charging) return;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
    setCharging(false);
    emitFeedback('charge_cancel');
    // Quick decay back to 0
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // SVG Ring Calculations
  const size = 38;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorMap = {
    primary: {
      border: 'border-[#ff003c]',
      glow: 'shadow-[0_0_15px_rgba(255,0,60,0.35)]',
      accent: '#ff003c',
      ring: '#00f6ff',
      bg: 'bg-[#120608]',
      cutBg: 'bg-[#ff003c]',
    },
    danger: {
      border: 'border-[#ff8a3d]',
      glow: 'shadow-[0_0_15px_rgba(255,138,61,0.35)]',
      accent: '#ff8a3d',
      ring: '#ffd84a',
      bg: 'bg-[#1a0a0d]',
      cutBg: 'bg-[#ff8a3d]',
    },
    cyan: {
      border: 'border-[#00f6ff]',
      glow: 'shadow-[0_0_15px_rgba(0,246,255,0.35)]',
      accent: '#00f6ff',
      ring: '#3cff9e',
      bg: 'bg-[#0b1620]',
      cutBg: 'bg-[#00f6ff]',
    },
  }[variant];

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled || loading}
      className={`relative group select-none min-h-[48px] px-5 py-2.5 flex items-center justify-between gap-4 font-mono text-xs font-bold tracking-wider transition-all duration-150 active:scale-[0.96] ${
        colorMap.bg
      } ${colorMap.border} border ${
        charging ? `${colorMap.glow} scale-[0.96]` : ''
      } ${glitching ? 'animate-glitch-confirm scale-[1.03]' : ''} ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
      }}
    >
      {/* Asymmetric corner notch accent */}
      <span
        className={`absolute top-0 right-0 w-[10px] h-[10px] ${colorMap.cutBg} opacity-80 pointer-events-none`}
        style={{
          clipPath: 'polygon(0 0, 100% 100%, 100% 0)',
        }}
      />

      {/* Label and Sublabel */}
      <div className="flex flex-col text-left">
        <span className="text-white group-hover:text-[#00f6ff] transition-colors font-bold uppercase tracking-widest text-[11px]">
          {loading ? 'EXECUTING...' : label}
        </span>
        {sublabel && (
          <span className="text-[9px] text-[#ff003c]/70 font-mono tracking-tighter">
            {sublabel}
          </span>
        )}
      </div>

      {/* SVG Clockwise Ring Meter */}
      <div className="relative w-[38px] h-[38px] flex items-center justify-center shrink-0">
        <svg
          className="w-[38px] h-[38px] -rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2a1418"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active filling ring (clockwise) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorMap.ring}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75 ease-linear"
          />
        </svg>

        {/* Center core indicator */}
        <div
          className={`absolute w-2 h-2 rounded-full transition-all ${
            charging
              ? 'bg-[#00f6ff] shadow-[0_0_8px_#00f6ff]'
              : 'bg-[#ff003c]/60'
          }`}
        />
      </div>
    </button>
  );
}
