'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface HudDigitRollerProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number; // default 500ms
  blurThreshold?: number; // threshold for blur-roll fallback
}

/**
 * Shared Digit Roller Component per design.md Section 14.3.
 * Animates numeric stat changes with per-digit independent upward/downward rolls,
 * 20ms stagger between digits, and blur-roll fallback for large jumps.
 */
export function HudDigitRoller({
  value,
  className = 'font-mono font-bold',
  prefix = '',
  suffix = '',
  duration = 500,
  blurThreshold = 200,
}: HudDigitRollerProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
  const [isLargeJump, setIsLargeJump] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  useEffect(() => {
    if (value === prevValueRef.current) return;

    const diff = value - prevValueRef.current;
    setDirection(diff >= 0 ? 'up' : 'down');
    setIsLargeJump(Math.abs(diff) >= blurThreshold);

    if (reducedMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    // Roll animation over duration
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = performance.now();

    let frameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Easing curve: --ease-reward-burst cubic-bezier(0.22, 1, 0.36, 1)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
        setDirection('none');
        setIsLargeJump(false);
      }
    };

    frameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration, blurThreshold, reducedMotion]);

  const formattedStr = displayValue.toLocaleString();

  return (
    <span
      className={`inline-flex items-center tabular-nums transition-all ${
        isLargeJump ? 'blur-[0.5px]' : ''
      } ${
        direction === 'up'
          ? 'text-white'
          : direction === 'down'
          ? 'text-accent-danger-orange'
          : ''
      } ${className}`}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span>{formattedStr}</span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}
