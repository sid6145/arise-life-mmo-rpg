'use client';

import { useState, useEffect } from 'react';

type FlickerCallback = (flicker: boolean) => void;

class IdleTickerService {
  private registered = new Map<string, FlickerCallback>();
  private timer: NodeJS.Timeout | null = null;
  private isDocumentVisible = true;
  private prefersReducedMotion = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isDocumentVisible = document.visibilityState === 'visible';
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      document.addEventListener('visibilitychange', () => {
        this.isDocumentVisible = document.visibilityState === 'visible';
        if (this.isDocumentVisible) {
          this.scheduleNextFlicker();
        } else {
          this.clearTimer();
        }
      });

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        if (this.prefersReducedMotion) {
          this.clearTimer();
        } else {
          this.scheduleNextFlicker();
        }
      });

      this.scheduleNextFlicker();
    }
  }

  public register(id: string, cb: FlickerCallback): () => void {
    this.registered.set(id, cb);
    return () => {
      this.registered.delete(id);
    };
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleNextFlicker() {
    this.clearTimer();
    if (!this.isDocumentVisible || this.prefersReducedMotion) return;

    // Random interval between 15s and 30s per design.md Section 14.1
    const delay = Math.floor(Math.random() * 15000) + 15000;

    this.timer = setTimeout(() => {
      this.triggerRandomFlicker();
      this.scheduleNextFlicker();
    }, delay);
  }

  private triggerRandomFlicker() {
    if (!this.isDocumentVisible || this.prefersReducedMotion) return;
    const keys = Array.from(this.registered.keys());
    if (keys.length === 0) return;

    // Pick EXACTLY ONE stat readout app-wide
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const callback = this.registered.get(randomKey);

    if (callback) {
      callback(true);
      // 80ms dip to 60% opacity per Section 14.1
      setTimeout(() => {
        callback(false);
      }, 80);
    }
  }
}

// Global singleton instance
export const idleTicker = typeof window !== 'undefined' ? new IdleTickerService() : null;

/**
 * Hook to attach a live numeric HUD readout to the central idle flicker engine.
 * Guarantees at most one stat flickers at a time app-wide.
 */
export function useIdleFlicker(id: string): boolean {
  const [flickering, setFlickering] = useState(false);

  useEffect(() => {
    if (!idleTicker) return;
    const unregister = idleTicker.register(id, (val) => setFlickering(val));
    return unregister;
  }, [id]);

  return flickering;
}
