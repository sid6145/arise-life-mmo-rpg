'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Share, Radio, Sparkles } from 'lucide-react';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { soundManager } from '@/lib/sound';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaManager() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);

  useEffect(() => {
    // 1. Service Worker registration and update detection (Step 7)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker if not already registered
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check if a worker is already waiting
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setHasUpdate(true);
          }

          // Listen for new worker installing & reaching 'installed' (waiting) state
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New content available, active controller exists -> waiting update
                setWaitingWorker(installingWorker);
                setHasUpdate(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });

      // Reload when the active service worker takes control after skipWaiting
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. Install prompt capture (Step 6)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. iOS Safari detection
    if (typeof window !== 'undefined') {
      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true;
      const dismissed = localStorage.getItem('liferpg_ios_pwa_dismissed') === 'true';

      if (isIos && !isStandalone && !dismissed) {
        setShowIosPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    soundManager.playTap();
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPromptEvent(null);
    }
  };

  const handleUpdateClick = () => {
    soundManager.playTap();
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const dismissIos = () => {
    soundManager.playTap();
    setShowIosPrompt(false);
    localStorage.setItem('liferpg_ios_pwa_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 flex flex-col gap-3 pointer-events-none">
      {/* 1. Update Notification Banner (Step 7) */}
      {hasUpdate && !dismissedUpdate && (
        <HudBracketFrame
          rarity="epic"
          className="p-3.5 bg-bg-panel-900/95 backdrop-blur-md border border-accent-cyber-cyan/50 shadow-glow-cyan pointer-events-auto transition-all animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-bg-panel-800 border border-accent-cyber-cyan flex items-center justify-center text-accent-cyber-cyan">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-orbitron font-black uppercase tracking-wider text-white">
                  SYSTEM <span className="text-accent-cyber-cyan">UPDATE AVAILABLE</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                  TELEMETRY FIRMWARE READY // SYNC TO APPLY
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playTap();
                setDismissedUpdate(true);
              }}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Dismiss update notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleUpdateClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-accent-cyber-cyan hover:bg-cyan-400 text-black font-mono font-bold text-[11px] uppercase tracking-wider clip-cyber-btn shadow-glow-cyan transition-all touch-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SYNC & REBOOT</span>
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setDismissedUpdate(true);
              }}
              className="px-3 py-1.5 border border-border-subtle hover:border-slate-500 text-slate-400 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-colors touch-press"
            >
              LATER
            </button>
          </div>
        </HudBracketFrame>
      )}

      {/* 2. Custom Install Banner (Step 6) */}
      {installPromptEvent && !dismissedInstall && (
        <HudBracketFrame
          rarity="rare"
          className="p-3.5 bg-bg-panel-900/95 backdrop-blur-md border border-accent-cyber-red/50 shadow-glow-red pointer-events-auto transition-all animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-bg-panel-800 border border-accent-cyber-red flex items-center justify-center text-accent-cyber-red">
                <Download className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-orbitron font-black uppercase tracking-wider text-white">
                  INSTALL <span className="text-accent-cyber-red">LIFE RPG HUD</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                  STANDALONE GRID ACCESS // OFFLINE READY
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playTap();
                setDismissedInstall(true);
              }}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Dismiss install prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-accent-cyber-red hover:bg-red-500 text-black font-mono font-bold text-[11px] uppercase tracking-wider clip-cyber-btn shadow-glow-red transition-all touch-press"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL HUD</span>
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                setDismissedInstall(true);
              }}
              className="px-3 py-1.5 border border-border-subtle hover:border-slate-500 text-slate-400 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-colors touch-press"
            >
              DISMISS
            </button>
          </div>
        </HudBracketFrame>
      )}

      {/* 3. iOS Safari Install Hint (Step 6) */}
      {showIosPrompt && (
        <HudBracketFrame
          rarity="uncommon"
          className="p-3.5 bg-bg-panel-900/95 backdrop-blur-md border border-accent-street-green/50 shadow-glow-green pointer-events-auto transition-all animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-bg-panel-800 border border-accent-street-green flex items-center justify-center text-accent-street-green">
                <Share className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-orbitron font-black uppercase tracking-wider text-white">
                  ADD TO <span className="text-accent-street-green">HOME SCREEN</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                  TAP <span className="text-accent-street-green font-bold">[SHARE]</span> THEN <span className="text-white font-bold">&apos;ADD TO HOME SCREEN&apos;</span>
                </div>
              </div>
            </div>

            <button
              onClick={dismissIos}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Dismiss iOS install instruction"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </HudBracketFrame>
      )}
    </div>
  );
}
