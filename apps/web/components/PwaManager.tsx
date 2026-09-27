'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Share, Radio, Laptop, Smartphone, HelpCircle } from 'lucide-react';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { soundManager } from '@/lib/sound';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function PwaManager() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // 1. Check if an install prompt was already captured on window
    if (window.__pwaInstallPrompt) {
      setInstallPromptEvent(window.__pwaInstallPrompt);
    }

    // 2. Service Worker registration and update detection (Step 7)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setHasUpdate(true);
          }

          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setWaitingWorker(installingWorker);
                setHasUpdate(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration error:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 3. Install prompt event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event captured');
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = promptEvent;
      setInstallPromptEvent(promptEvent);
      setDismissedInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Custom manual trigger event from Header / Navigation
    const handleOpenInstall = () => {
      soundManager.playTap();
      if (window.__pwaInstallPrompt) {
        window.__pwaInstallPrompt.prompt().then(() => {
          window.__pwaInstallPrompt?.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
              window.__pwaInstallPrompt = null;
              setInstallPromptEvent(null);
            }
          });
        });
      } else {
        const isIos =
          /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIos) {
          setShowIosPrompt(true);
        } else {
          setShowManualModal(true);
        }
      }
    };

    window.addEventListener('open-pwa-install', handleOpenInstall);

    // 5. iOS Safari auto-hint
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const dismissedIos = localStorage.getItem('liferpg_ios_pwa_dismissed') === 'true';

    if (isIos && !standalone && !dismissedIos) {
      setShowIosPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    soundManager.playTap();
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallPromptEvent(null);
      window.__pwaInstallPrompt = null;
    }
  };

  const handleUpdateClick = () => {
    soundManager.playTap();
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  const dismissIos = () => {
    soundManager.playTap();
    setShowIosPrompt(false);
    localStorage.setItem('liferpg_ios_pwa_dismissed', 'true');
  };

  return (
    <>
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
        {!isStandalone && installPromptEvent && !dismissedInstall && (
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
        {!isStandalone && showIosPrompt && (
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

      {/* 4. Manual Install Guide Modal (When triggered from Header on browsers without prompt event) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <HudBracketFrame
            rarity="rare"
            className="max-w-md w-full p-6 bg-bg-panel-900 border border-accent-cyber-cyan shadow-glow-cyan space-y-4 relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-bg-panel-800 border border-accent-cyber-cyan flex items-center justify-center text-accent-cyber-cyan">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-sm text-white">
                    INSTALL <span className="text-accent-cyber-cyan">LIFE RPG HUD</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 uppercase">
                    STANDALONE DESKTOP & MOBILE SETUP
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-slate-300">
              <div className="p-3 bg-bg-panel-800 border border-border-subtle rounded space-y-1">
                <div className="flex items-center gap-1.5 text-accent-cyber-cyan font-bold text-[11px]">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>CHROME / EDGE / DESKTOP:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click the <span className="text-white font-bold">Install Icon (⊕)</span> on the right side of the address bar, or open the browser menu (⋮) and select <span className="text-white font-bold">&apos;Install Life RPG&apos;</span>.
                </p>
              </div>

              <div className="p-3 bg-bg-panel-800 border border-border-subtle rounded space-y-1">
                <div className="flex items-center gap-1.5 text-accent-street-green font-bold text-[11px]">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>SAFARI / IOS / ANDROID:</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tap the <span className="text-white font-bold">Share / Menu</span> icon in your mobile browser, then select <span className="text-white font-bold">&apos;Add to Home Screen&apos;</span>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowManualModal(false)}
              className="w-full py-2 bg-accent-cyber-cyan hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider clip-cyber-btn transition-all touch-press"
            >
              ACKNOWLEDGE
            </button>
          </HudBracketFrame>
        </div>
      )}
    </>
  );
}
