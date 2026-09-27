'use client';

import { soundManager, triggerHaptic } from './sound';

export type FeedbackEventType =
  | 'tap'
  | 'charge_start'
  | 'charge_complete'
  | 'charge_cancel'
  | 'subquest_toggle'
  | 'reward_claim'
  | 'levelup'
  | 'boss_unlock'
  | 'error'
  | 'auth_success';

export interface FeedbackEventPayload {
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'iconic';
  [key: string]: any;
}

type FeedbackSubscriber = (event: FeedbackEventType, payload?: FeedbackEventPayload) => void;

class FeedbackEventBus {
  private subscribers = new Set<FeedbackSubscriber>();

  constructor() {
    // Register the core unified audio + haptics handler
    this.subscribe((event, payload) => {
      this.dispatchHardwareFeedback(event, payload);
    });
  }

  public subscribe(fn: FeedbackSubscriber): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  public emit(event: FeedbackEventType, payload?: FeedbackEventPayload): void {
    this.subscribers.forEach((fn) => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error(`[FeedbackBus] Error in subscriber for ${event}:`, err);
      }
    });
  }

  private dispatchHardwareFeedback(event: FeedbackEventType, payload?: FeedbackEventPayload): void {
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    switch (event) {
      case 'tap':
        soundManager.playTap();
        triggerHaptic(10);
        break;

      case 'charge_start':
        soundManager.playCharge();
        triggerHaptic(15);
        break;

      case 'charge_complete':
      case 'reward_claim':
        soundManager.playComplete();
        triggerHaptic([20, 30, 40]);
        break;

      case 'charge_cancel':
        // Clean quick release tone (silent or micro-blip)
        triggerHaptic(5);
        break;

      case 'subquest_toggle':
        soundManager.playSubquest();
        triggerHaptic(20);
        break;

      case 'levelup':
        soundManager.playLevelUp();
        triggerHaptic([40, 40, 80]);
        break;

      case 'boss_unlock':
        soundManager.playBossUnlock();
        triggerHaptic([50, 60, 100]);
        break;

      case 'error':
        // Sharp single alert
        soundManager.playTap();
        triggerHaptic([30, 50, 80]);
        break;

      case 'auth_success':
        soundManager.playComplete();
        triggerHaptic(20);
        break;
    }
  }
}

// Global Singleton Feedback Bus per Section 14.4
export const feedbackBus = new FeedbackEventBus();

/**
 * Convenient shorthand helper to emit a unified feedback event.
 */
export function emitFeedback(event: FeedbackEventType, payload?: FeedbackEventPayload): void {
  feedbackBus.emit(event, payload);
}
