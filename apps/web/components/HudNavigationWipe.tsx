'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const ROUTE_ORDER = ['/', '/character', '/goals', '/report', '/quest'];

/**
 * Directional Screen Wipe Transition per design.md Section 14.2.
 * A bright hud-hairline bar sweeps across the viewport over 220ms on route changes.
 * Purely visual overlay that never gates or delays data fetching.
 */
export function HudNavigationWipe() {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const [wiping, setWiping] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    if (pathname === prevPathRef.current) return;

    // Determine direction based on route index or history
    const prevIdx = ROUTE_ORDER.findIndex((r) => r === '/' ? prevPathRef.current === '/' : prevPathRef.current?.startsWith(r));
    const currIdx = ROUTE_ORDER.findIndex((r) => r === '/' ? pathname === '/' : pathname?.startsWith(r));

    const isBack = currIdx < prevIdx && currIdx !== -1 && prevIdx !== -1;
    setDirection(isBack ? 'backward' : 'forward');
    prevPathRef.current = pathname;

    // Trigger 220ms visual wipe
    if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWiping(true);
      const timer = setTimeout(() => {
        setWiping(false);
      }, 230);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!wiping) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[999] overflow-hidden ${
        direction === 'forward' ? 'animate-wipe-forward' : 'animate-wipe-backward'
      }`}
      aria-hidden="true"
    >
      {/* Wipe Bar (220ms HUD-hairline scan bar) */}
      <div className="absolute inset-0 bg-[#07050a]/60 backdrop-blur-[2px]" />
      <div
        className={`absolute top-0 bottom-0 w-[4px] bg-[#ff003c] shadow-[0_0_20px_#ff003c,0_0_40px_#00f6ff] ${
          direction === 'forward' ? 'right-0' : 'left-0'
        }`}
      />
    </div>
  );
}
