'use client';

import React, { useState } from 'react';

export interface HudUnderlineInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: boolean;
}

/**
 * Reusable Underline Input Field per design.md Section 13.2.
 * Features caption-style uppercase label, cyan focus state, and
 * reduced-scale corner brackets that reveal on the active field.
 */
export function HudUnderlineInput({
  label,
  icon: Icon,
  error = false,
  className = '',
  id,
  required,
  ...props
}: HudUnderlineInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `hud-input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-1.5 w-full">
      {/* 13.2 Caption-style label */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className={`text-[10px] font-mono tracking-widest uppercase transition-colors select-none ${
            error
              ? 'text-accent-cyber-red font-bold'
              : isFocused
              ? 'text-accent-cyber-cyan font-bold'
              : 'text-slate-400'
          }`}
        >
          {label} {required && <span className="text-accent-cyber-red">*</span>}
        </label>
      </div>

      {/* Input container with focus brackets and underline */}
      <div
        className={`relative transition-all duration-200 border-b-2 ${
          error
            ? 'border-accent-cyber-red bg-accent-cyber-red/5'
            : isFocused
            ? 'border-accent-cyber-cyan bg-accent-cyber-cyan/5'
            : 'border-border-subtle hover:border-slate-700 bg-bg-panel-800/60'
        }`}
      >
        {/* Reduced-scale corner brackets on active/focused field (Section 13.2) */}
        {isFocused && (
          <>
            {/* Top-Left Tiny L-Bracket */}
            <span className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-accent-cyber-cyan pointer-events-none z-10" />
            {/* Top-Right Tiny L-Bracket */}
            <span className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-accent-cyber-cyan pointer-events-none z-10" />
            {/* Bottom-Left Tiny L-Bracket */}
            <span className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-accent-cyber-cyan pointer-events-none z-10" />
            {/* Bottom-Right Tiny L-Bracket */}
            <span className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-accent-cyber-cyan pointer-events-none z-10" />
          </>
        )}

        <div className="flex items-center px-3 py-2.5 gap-2.5">
          {Icon && (
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                error
                  ? 'text-accent-cyber-red'
                  : isFocused
                  ? 'text-accent-cyber-cyan'
                  : 'text-slate-500'
              }`}
            />
          )}

          <input
            id={inputId}
            required={required}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full bg-transparent text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none ${className}`}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}
