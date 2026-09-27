'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Crosshair, 
  User, 
  Target, 
  BarChart2, 
  LogIn, 
  LogOut, 
  Sparkles,
  Zap,
  Lock,
  Coins,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';
import { HudProgressBar } from '@/components/HudProgressBar';
import { HudDigitRoller } from '@/components/HudDigitRoller';
import { useIdleFlicker } from '@/lib/idleTicker';

const NAV_ITEMS = [
  { name: 'Quests', href: '/', icon: Crosshair, short: 'Quests' },
  { name: 'Character', href: '/character', icon: User, short: 'Character' },
  { name: 'Goals', href: '/goals', icon: Target, short: 'Goals' },
  { name: 'Weekly Report', href: '/report', icon: BarChart2, short: 'Report' },
];

export function Navigation({
  initialUser,
  initialPlayer,
}: {
  initialUser?: any;
  initialPlayer?: any;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isOnboarding = pathname === '/onboarding';
  const isSignIn = pathname === '/signin';
  const isLevelFlickering = useIdleFlicker('nav-player-level');

  const user = session?.user || initialUser;
  const isAuthenticated = status === 'authenticated' || !!user;

  const playerLevel = initialPlayer?.level ?? 1;
  const playerXp = initialPlayer?.xp ?? 0;
  const nextLvlXp = playerLevel * 1000;
  const xpPct = Math.min(100, Math.round((playerXp / nextLvlXp) * 100));
  const streakCount = initialPlayer?.streakCount ?? 0;

  return (
    <>
      {/* Top Desktop Navigation Bar per design.md Section 2 */}
      <header className="bg-bg-void sticky top-0 z-40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          
          {/* Left Cluster: Brand + Primary Stat Readouts */}
          <div className="flex items-center gap-5">
            <Link 
              href="/" 
              onClick={() => soundManager.playTap()}
              className="flex items-center gap-2 group touch-press min-h-[44px]"
            >
              <div className="w-7 h-7 bg-bg-panel-800 border border-accent-cyber-red flex items-center justify-center group-hover:shadow-glow-red transition-all">
                <Crosshair className="w-4 h-4 text-accent-cyber-red" />
              </div>
              <span className="font-orbitron font-black text-base tracking-wider text-white">
                LIFE<span className="text-accent-cyber-red">_RPG</span>
              </span>
            </Link>

            {/* Level Stat Readout */}
            {isAuthenticated && initialPlayer && (
              <div className={`hidden lg:flex items-center gap-4 border-l border-border-subtle pl-4 transition-opacity ${isLevelFlickering ? 'hud-flicker-active' : ''}`}>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5 font-mono text-xs">
                    <HudDigitRoller value={playerLevel} className="font-orbitron font-black text-white text-sm" />
                    <span className="text-[10px] text-accent-cyber-red font-bold uppercase tracking-wider">LEVEL</span>
                  </div>
                  <HudProgressBar
                    progress={xpPct}
                    variant="xp"
                    className="w-16 h-1 mt-0.5"
                    trackClassName="bg-bg-panel-800"
                    showLeadingGlow={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Center Cluster: Tab Navigation */}
          {!isOnboarding && !isSignIn && (
            <nav className="hidden md:flex items-center gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => soundManager.playTap()}
                    className={`relative flex items-center gap-2 px-3 py-2 text-xs font-mono tracking-wider uppercase transition-colors touch-press min-h-[44px] ${
                      isActive
                        ? 'text-accent-cyber-cyan font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-accent-cyber-cyan' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent-cyber-cyan shadow-glow-cyan" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Cluster: User Profile & Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* User avatar & logout */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-bg-panel-800 border border-border-subtle flex items-center justify-center text-xs font-mono font-bold text-accent-cyber-cyan">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playTap();
                      signOut({ callbackUrl: '/signin' });
                    }}
                    className="p-2 text-slate-400 hover:text-accent-cyber-red border border-border-subtle hover:border-accent-cyber-red/50 bg-bg-panel-900 transition-all touch-press min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Sign out of system"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  onClick={() => soundManager.playTap()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-black bg-accent-cyber-red hover:bg-red-400 clip-cyber-btn shadow-glow-red transition-all touch-press min-h-[40px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>JACK IN</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Section 1.1 / 2: Single HUD-Hairline bright red rule under top bar */}
        <div className="w-full h-[1px] bg-hud-hairline shadow-[0_0_8px_#ff003c]" />
      </header>

      {/* Mobile Bottom Navigation Bar */}
      {!isOnboarding && !isSignIn && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-void/95 border-t border-hud-hairline backdrop-blur-md px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => soundManager.playTap()}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 min-h-[48px] transition-all touch-press ${
                    isActive
                      ? 'text-accent-cyber-cyan font-bold bg-bg-panel-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-accent-cyber-cyan' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-mono uppercase tracking-tighter">{item.short}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-accent-cyber-cyan shadow-glow-cyan" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
