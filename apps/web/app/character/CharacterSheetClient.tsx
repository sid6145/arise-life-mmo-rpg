'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Flame,
  Zap,
  Target,
  Dumbbell,
  Shield,
  ChevronRight,
  Award,
  LogOut,
  LogIn,
  Brain,
  Palette,
  Sparkles,
  Activity,
  Compass,
  Layers,
  X,
  Cpu,
  Radio,
  Lock,
  CheckCircle2,
  Sliders,
  ChevronUp,
} from 'lucide-react';
import { soundManager, triggerHaptic } from '@/lib/sound';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { HudProgressBar } from '@/components/HudProgressBar';
import { HudDigitRoller } from '@/components/HudDigitRoller';

interface PlayerAttributeData {
  id?: string;
  attribute: string;
  points: number;
}

interface GoalSummary {
  id: string;
  title: string;
  category?: string | null;
  primaryAttribute?: string | null;
  secondaryAttribute?: string | null;
  status: string;
  createdAt: string;
  quests?: Array<{ id: string; status: string }>;
}

interface CharacterSheetClientProps {
  initialPlayer?: {
    id: string;
    userId: string;
    level: number;
    xp: number;
    streakCount: number;
    attributes?: PlayerAttributeData[];
  } | null;
  initialUser?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
  initialGoals?: GoalSummary[];
}

interface AttributeMeta {
  key: string;
  name: string;
  code: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hexColor: string;
  borderColor: string;
  bgColor: string;
  svgPosDesktop: { cx: number; cy: number };
  systemSlot: string;
}

const ATTRIBUTES_CONFIG: AttributeMeta[] = [
  {
    key: 'strength',
    name: 'Strength',
    code: 'STR',
    description: 'Physical biomechanics, resistance training, bodily resilience and kinetic discipline.',
    icon: Dumbbell,
    color: 'text-[#ff003c]',
    hexColor: '#ff003c',
    borderColor: 'border-[#ff003c]',
    bgColor: 'bg-[#ff003c]/10',
    svgPosDesktop: { cx: 250, cy: 50 }, // Top
    systemSlot: 'MUSCULOSKELETAL FRAME',
  },
  {
    key: 'intelligence',
    name: 'Intelligence',
    code: 'INT',
    description: 'Deep neural focus, algorithmic reasoning, systems architecture & problem hacking.',
    icon: Brain,
    color: 'text-[#bf5af2]',
    hexColor: '#bf5af2',
    borderColor: 'border-[#bf5af2]',
    bgColor: 'bg-[#bf5af2]/10',
    svgPosDesktop: { cx: 420, cy: 110 }, // Top-Right
    systemSlot: 'NEURAL CO-PROCESSOR',
  },
  {
    key: 'dexterity',
    name: 'Dexterity',
    code: 'DEX',
    description: 'Kinesthetic agility, rapid motor reflexes, execution precision and technical craft.',
    icon: Compass,
    color: 'text-[#00f6ff]',
    hexColor: '#00f6ff',
    borderColor: 'border-[#00f6ff]',
    bgColor: 'bg-[#00f6ff]/10',
    svgPosDesktop: { cx: 420, cy: 250 }, // Bottom-Right
    systemSlot: 'SYNAPTIC REFLEX ACCELERATOR',
  },
  {
    key: 'endurance',
    name: 'Endurance',
    code: 'END',
    description: 'Cardiovascular output, high-volume capacity, continuous stress tolerance & grit.',
    icon: Activity,
    color: 'text-[#3ba7ff]',
    hexColor: '#3ba7ff',
    borderColor: 'border-[#3ba7ff]',
    bgColor: 'bg-[#3ba7ff]/10',
    svgPosDesktop: { cx: 250, cy: 310 }, // Bottom
    systemSlot: 'CIRCULATORY BIO-MONITOR',
  },
  {
    key: 'vitality',
    name: 'Vitality',
    code: 'VIT',
    description: 'Cellular recovery, metabolic sleep hygiene, longevity protocols & immune shield.',
    icon: Shield,
    color: 'text-[#3cff9e]',
    hexColor: '#3cff9e',
    borderColor: 'border-[#3cff9e]',
    bgColor: 'bg-[#3cff9e]/10',
    svgPosDesktop: { cx: 80, cy: 250 }, // Bottom-Left
    systemSlot: 'INTEGUMENTARY DERMAL PLATING',
  },
  {
    key: 'charisma',
    name: 'Charisma',
    code: 'CHA',
    description: 'Street reputation, vocal timbre, social magnetism, presence & negotiation authority.',
    icon: Palette,
    color: 'text-[#ffd84a]',
    hexColor: '#ffd84a',
    borderColor: 'border-[#ffd84a]',
    bgColor: 'bg-[#ffd84a]/10',
    svgPosDesktop: { cx: 80, cy: 110 }, // Top-Left
    systemSlot: 'OPTICAL CAMO & VOCAL SYNTH',
  },
];

export default function CharacterSheetClient({
  initialPlayer,
  initialUser,
  initialGoals = [],
}: CharacterSheetClientProps) {
  const { data: session, status } = useSession();

  const user = session?.user || initialUser;
  const level = initialPlayer?.level ?? 1;
  const currentXp = initialPlayer?.xp ?? 0;
  const streakDays = initialPlayer?.streakCount ?? 0;
  const nextLevelXp = level * 1000;

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Operative');

  const [activeTab, setActiveTab] = useState<'constellation' | 'perks' | 'cyberware'>('constellation');
  const [goals, setGoals] = useState<GoalSummary[]>(initialGoals);
  const [playerAttributes, setPlayerAttributes] = useState<PlayerAttributeData[]>(
    initialPlayer?.attributes || []
  );
  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const userId = user?.id;

  useEffect(() => {
    if (initialGoals && initialGoals.length > 0) {
      setGoals(initialGoals);
    }
  }, [initialGoals]);

  // Only fetch client-side if initialPlayer was not supplied by the server
  useEffect(() => {
    if (initialPlayer?.attributes && initialPlayer.attributes.length > 0) return;

    async function loadUserData() {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (userId) {
          headers['Authorization'] = `Bearer ${userId}`;
        }
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers,
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.player?.attributes) {
            setPlayerAttributes(json.data.player.attributes);
          }
        }
      } catch (err) {
        console.error('[CharacterSheet] Error fetching attributes:', err);
      }
    }
    loadUserData();
  }, [API_URL, userId, initialPlayer?.attributes]);

  const attributePointsMap = new Map<string, number>();
  playerAttributes.forEach((attr) => {
    attributePointsMap.set(attr.attribute.toLowerCase(), attr.points);
  });

  const stats = ATTRIBUTES_CONFIG.map((cfg) => {
    const points = attributePointsMap.get(cfg.key) || 0;
    const attrLevel = Math.floor(points / 50) + 1;
    const progressInLevel = points % 50;
    const pointsToNext = 50 - progressInLevel;
    const progressPct = Math.round((progressInLevel / 50) * 100);

    const linkedGoals = goals.filter(
      (g) =>
        (g.primaryAttribute || g.category || '').toLowerCase() === cfg.key ||
        (g.secondaryAttribute || '').toLowerCase() === cfg.key
    );

    return {
      ...cfg,
      points,
      level: attrLevel,
      progressInLevel,
      pointsToNext,
      progressPct,
      linkedGoals,
    };
  });

  // Find attribute with highest points for Section 3 ambient breathe
  const highestStat = [...stats].sort((a, b) => b.points - a.points)[0];

  const selectedStat = stats.find((s) => s.key === selectedAttributeKey) || null;
  const xpPercentage = Math.min(100, Math.round((currentXp / nextLevelXp) * 100));

  const handleNodeClick = (attrKey: string) => {
    soundManager.playTap();
    triggerHaptic(15);
    setSelectedAttributeKey(attrKey);
  };

  return (
    <main className="min-h-screen bg-transparent text-slate-200 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* CHARACTER HERO & LEVEL CARD */}
        <HudBracketFrame
          active={true}
          rarity="iconic"
          className="p-5 sm:p-6 bg-[#120608]/90 border border-[#2a1418] relative animate-panel-stagger-1"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            {/* Identifier */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#1a0a0d] border-2 border-[#ff003c] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,0,60,0.3)]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#00f6ff]">LVL</span>
                <HudDigitRoller value={level} className="font-mono font-black text-2xl text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-mono font-black text-xl sm:text-2xl text-white tracking-wider uppercase">
                    {displayName}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1a0a0d] text-[#00f6ff] border border-[#00f6ff]/40 font-bold">
                    {status === 'authenticated' || initialUser ? 'NETRUNNER SYNCD' : 'GUEST AGENT'}
                  </span>
                </div>
                <p className="font-mono text-xs text-[#ffd84a] tracking-wider uppercase mt-0.5 font-bold">
                  SPECIALIZATION: CYBERNETIC ARCHITECT
                </p>
              </div>
            </div>

            {/* Quick stats & Auth */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-[#1a0a0d] border border-[#ffd84a]/40 px-3 py-2 shadow-[0_0_10px_rgba(255,216,74,0.2)]">
                <Flame className="w-4 h-4 text-[#ffd84a] animate-pulse" />
                <div className="font-mono text-xs font-bold text-white flex items-baseline gap-1">
                  <HudDigitRoller value={streakDays} />
                  <span>D STREAK</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#1a0a0d] border border-[#2a1418] px-3 py-2">
                <Cpu className="w-4 h-4 text-[#00f6ff]" />
                <span className="font-mono text-xs text-slate-300">NEON BRANCH</span>
              </div>
              {status === 'authenticated' || initialUser ? (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTap();
                    signOut({ callbackUrl: '/signin' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase text-slate-300 hover:text-[#ff003c] bg-[#1a0a0d] border border-[#2a1418] hover:border-[#ff003c]/50 transition-all min-h-[40px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>JACK OUT</span>
                </button>
              ) : (
                <Link
                  href="/signin"
                  onClick={() => soundManager.playTap()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase text-black bg-[#00f6ff] hover:bg-[#3cff9e] transition-all min-h-[40px]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>JACK IN</span>
                </Link>
              )}
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-1.5 pt-3 border-t border-[#2a1418]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#00f6ff] font-bold">
                <Zap className="w-3.5 h-3.5" /> OPERATIONAL SYNAPSE PROGRESSION
              </span>
              <span className="text-slate-300">
                <HudDigitRoller value={currentXp} className="text-white font-mono font-bold" /> / {nextLevelXp} XP ({xpPercentage}%)
              </span>
            </div>
            <HudProgressBar
              progress={xpPercentage}
              variant="xp"
              className="h-2.5 w-full"
              trackClassName="bg-[#1a0a0d] border border-[#2a1418]"
            />
          </div>
        </HudBracketFrame>

        {/* TAB SWITCHER: CONSTELLATION / PCB TREE / LIFE SYSTEMS */}
        <div className="flex items-center gap-2 border-b border-[#2a1418] pb-1 animate-panel-stagger-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setActiveTab('constellation');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'constellation'
                ? 'border-[#00f6ff] text-[#00f6ff] bg-[#120608]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            HEX CONSTELLATION (SEC 3)
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setActiveTab('perks');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'perks'
                ? 'border-[#00f6ff] text-[#00f6ff] bg-[#120608]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            PCB SKILL TREE (SEC 4)
          </button>
          <button
            type="button"
            onClick={() => {
              soundManager.playTap();
              setActiveTab('cyberware');
            }}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'cyberware'
                ? 'border-[#00f6ff] text-[#00f6ff] bg-[#120608]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            LIFE SYSTEMS (SEC 5)
          </button>
        </div>

        {/* TAB 1: SECTION 3 HEX CONSTELLATION */}
        {activeTab === 'constellation' && (
          <HudBracketFrame className="p-6 bg-[#120608] border border-[#2a1418] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#00f6ff]" />
                <h2 className="font-mono font-bold text-lg text-white uppercase tracking-wider">
                  Attribute Hex Constellation
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                INSPECT NODE • 50 PTS / LVL
              </span>
            </div>

            {/* Radial Constellation Interactive Canvas */}
            <div className="relative w-full max-w-lg mx-auto aspect-[5/3.6] flex items-center justify-center p-2 select-none">
              {/* SVG PCB Circuit Connector Lines (Section 3: orthogonal circuit runs) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 500 360"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Circuit connector runs from each hex to central hub (250, 180) */}
                <path d="M 250 50 L 250 180" stroke="#ff003c" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                <path d="M 420 110 L 335 110 L 250 180" stroke="#bf5af2" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                <path d="M 420 250 L 335 250 L 250 180" stroke="#00f6ff" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                <path d="M 250 310 L 250 180" stroke="#3ba7ff" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                <path d="M 80 250 L 165 250 L 250 180" stroke="#3cff9e" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />
                <path d="M 80 110 L 165 110 L 250 180" stroke="#ffd84a" strokeWidth="2" strokeOpacity="0.4" strokeDasharray="4 4" />

                {/* Solder-pad junction rings */}
                <circle cx="250" cy="50" r="4" fill="#ff003c" />
                <circle cx="420" cy="110" r="4" fill="#bf5af2" />
                <circle cx="420" cy="250" r="4" fill="#00f6ff" />
                <circle cx="250" cy="310" r="4" fill="#3ba7ff" />
                <circle cx="80" cy="250" r="4" fill="#3cff9e" />
                <circle cx="80" cy="110" r="4" fill="#ffd84a" />

                {/* Central Nexus Circuit Ring */}
                <circle cx="250" cy="180" r="46" stroke="#ff003c" strokeWidth="1.5" strokeOpacity="0.3" />
              </svg>

              {/* Central Nexus Core (Player Level) */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#07050a] border-2 border-[#ff003c] flex flex-col items-center justify-center shadow-[0_0_15px_rgba(255,0,60,0.4)] z-10">
                <span className="text-[9px] font-mono uppercase text-[#00f6ff] font-bold tracking-tighter">NEXUS</span>
                <div className="font-mono font-black text-xl text-white flex items-center justify-center gap-0.5">
                  <span>LVL</span>
                  <HudDigitRoller value={level} />
                </div>
                <span className="text-[8px] font-mono text-[#ffd84a] font-bold">OPERATIVE</span>
              </div>

              {/* 6 Peripheral Flat-Topped Hex Attribute Nodes */}
              {stats.map((stat) => {
                const Icon = stat.icon;
                const isSelected = selectedAttributeKey === stat.key;
                const isHighest = highestStat?.key === stat.key;
                const posPercent = {
                  left: `${(stat.svgPosDesktop.cx / 500) * 100}%`,
                  top: `${(stat.svgPosDesktop.cy / 360) * 100}%`,
                };

                return (
                  <button
                    key={stat.key}
                    type="button"
                    onClick={() => handleNodeClick(stat.key)}
                    style={posPercent}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group transition-all duration-200 z-20 flex flex-col items-center"
                    title={`${stat.name} (LVL ${stat.level})`}
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 ${stat.bgColor} border-2 ${
                        isSelected
                          ? `${stat.borderColor} shadow-[0_0_20px_rgba(0,246,255,0.5)] scale-110`
                          : `${stat.borderColor}/60 hover:${stat.borderColor} hover:scale-105`
                      } ${isHighest ? 'animate-pulse' : ''} flex flex-col items-center justify-center bg-[#07050a]/95 transition-all`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mb-0.5 group-hover:scale-110 transition-transform`} />
                      <span className="font-mono font-black text-xs sm:text-sm text-white leading-tight">
                        {stat.code}
                      </span>
                      <span className="text-[9px] font-mono text-slate-300 font-bold">
                        L{stat.level}
                      </span>
                    </div>

                    <div className="mt-1 px-1.5 py-0.5 bg-[#120608] border border-[#2a1418] text-[9px] font-mono text-slate-300 uppercase font-bold">
                      {stat.points} PTS
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Stat Bar Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
              {stats.map((stat) => (
                <button
                  key={stat.key}
                  type="button"
                  onClick={() => handleNodeClick(stat.key)}
                  className={`p-2.5 bg-[#120608] border ${
                    selectedAttributeKey === stat.key
                      ? `${stat.borderColor} shadow-[0_0_10px_rgba(0,246,255,0.3)]`
                      : 'border-[#2a1418] hover:border-slate-500'
                  } text-left transition-all`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono font-bold ${stat.color}`}>{stat.code}</span>
                    <span className="text-[10px] font-mono text-white font-bold">LVL {stat.level}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 font-bold mb-1 flex items-baseline gap-1">
                    <HudDigitRoller value={stat.points} />
                    <span>PTS</span>
                  </div>
                  <HudProgressBar
                    progress={stat.progressPct}
                    className="h-1.5 w-full"
                    trackClassName="bg-[#07050a]"
                    fillClassName={stat.bgColor.replace('/10', '/70')}
                    showLeadingGlow={false}
                  />
                </button>
              ))}
            </div>
          </HudBracketFrame>
        )}

        {/* TAB 2: SECTION 4 PCB SKILL / PERK TREE */}
        {activeTab === 'perks' && (
          <HudBracketFrame className="p-6 bg-[#120608] border border-[#2a1418] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#00f6ff]" />
                <h2 className="font-mono font-bold text-lg text-white uppercase tracking-wider">
                  Orthogonal PCB Perk Matrix
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#ffd84a] font-bold">
                PERK POINTS AVAILABLE: 3
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Orthogonal PCB traces unlock passive modifiers when key milestones are achieved.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {stats.slice(0, 3).map((stat, i) => (
                <div key={stat.key} className="p-4 bg-[#1a0a0d] border border-[#2a1418] space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${stat.color}`}>{stat.name.toUpperCase()} BRANCH</span>
                    <span className="text-[10px] font-mono text-[#ffd84a] bg-[#ffd84a]/10 px-2 py-0.5 border border-[#ffd84a]/30">
                      RANK {i + 1}/3
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`p-3 bg-[#07050a] border-2 ${stat.borderColor} shadow-[0_0_10px_rgba(255,0,60,0.2)]`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-sm text-white">{stat.name} Protocol Mk.{i + 1}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Increases XP gain for {stat.name} quests by +15%.
                      </p>
                    </div>
                  </div>

                  {/* PCB Trace Graphic */}
                  <div className="h-1 w-full bg-[#07050a] relative overflow-hidden">
                    <div
                      className="h-full bg-[#00f6ff] shadow-[0_0_8px_#00f6ff]"
                      style={{ width: `${(i + 1) * 33}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </HudBracketFrame>
        )}

        {/* TAB 3: SECTION 5 CYBERWARE / LIFE SYSTEMS */}
        {activeTab === 'cyberware' && (
          <HudBracketFrame className="p-6 bg-[#120608] border border-[#2a1418] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#00f6ff]" />
                <h2 className="font-mono font-bold text-lg text-white uppercase tracking-wider">
                  Cyberware Life Systems
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#3cff9e] font-bold">
                SYSTEM INTEGRITY: 100%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((stat) => {
                const hasPendingCalibration = stat.pointsToNext <= 15;
                return (
                  <div
                    key={stat.key}
                    className={`p-4 bg-[#1a0a0d] border transition-all flex items-center justify-between gap-4 ${
                      hasPendingCalibration
                        ? 'border-[#00f6ff]/60 animate-ambient-hero'
                        : 'border-[#2a1418] hover:border-[#00f6ff]/50'
                    }`}
                  >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 bg-[#07050a] border ${stat.borderColor} ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#00f6ff] block font-bold">
                        {stat.systemSlot}
                      </span>
                      <h4 className="font-mono font-bold text-sm text-white">
                        {stat.name} Bio-Mod V{stat.level}.0
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Tier: {stat.level >= 5 ? 'Iconic' : stat.level >= 3 ? 'Epic' : 'Rare'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs text-[#ffd84a] font-bold block">€$ 0 (OWNED)</span>
                    <span className="text-[9px] text-[#3cff9e]">INSTALLED</span>
                  </div>
                </div>
              );
            })}
          </div>
          </HudBracketFrame>
        )}

        {/* ACTIVE GOALS TIED TO ATTRIBUTES */}
        <HudBracketFrame className="p-5 bg-[#120608] border border-[#2a1418] space-y-4 animate-panel-stagger-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#00f6ff]" />
              <h2 className="font-mono font-bold text-lg text-white uppercase tracking-wide">
                Linked Active Directives
              </h2>
            </div>
            <Link
              href="/goals"
              onClick={() => soundManager.playTap()}
              className="text-xs font-mono text-[#00f6ff] hover:text-[#3cff9e] flex items-center gap-1 uppercase tracking-wider min-h-[40px]"
            >
              <span>CONFIGURE DIRECTIVES</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="p-6 bg-[#1a0a0d] border border-[#2a1418] text-center space-y-2">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                No active directives linked yet
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Create goals in Directive Hub to start channeling attribute points upon quest execution.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((goal) => {
                const primaryAttrKey = (goal.primaryAttribute || goal.category || 'strength').toLowerCase();
                const primaryStatCfg = ATTRIBUTES_CONFIG.find((a) => a.key === primaryAttrKey) || ATTRIBUTES_CONFIG[0];
                const activeCount = goal.quests?.filter((q) => q.status === 'active').length || 0;

                return (
                  <button
                    type="button"
                    key={goal.id}
                    className="w-full text-left p-3.5 bg-[#1a0a0d] border border-[#2a1418] hover:border-[#ff003c] flex items-center justify-between gap-3 transition-all"
                    onClick={() => handleNodeClick(primaryAttrKey)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-[#07050a] border ${primaryStatCfg.borderColor} ${primaryStatCfg.color}`}>
                        <primaryStatCfg.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono uppercase font-bold ${primaryStatCfg.color}`}>
                            {primaryStatCfg.name}
                          </span>
                          {goal.secondaryAttribute && (
                            <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">
                              + {goal.secondaryAttribute}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-white block">
                          {goal.title}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-[#00f6ff] block font-bold">{activeCount} ACTIVE</span>
                      <span className="text-[10px] text-slate-400 block">{goal.status.toUpperCase()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </HudBracketFrame>
      </div>

      {/* MOBILE / DESKTOP BOTTOM-SHEET DETAIL INSPECTOR */}
      {selectedStat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <HudBracketFrame
            active={true}
            rarity="rare"
            className="bg-[#120608] border border-[#00f6ff]/60 p-6 max-w-lg w-full space-y-4 shadow-[0_0_25px_rgba(0,246,255,0.2)] rounded-t-2xl sm:rounded-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2a1418] pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 bg-[#1a0a0d] border ${selectedStat.borderColor} ${selectedStat.color}`}>
                  <selectedStat.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xl text-white uppercase tracking-wide">
                      {selectedStat.name}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 bg-[#1a0a0d] ${selectedStat.borderColor} ${selectedStat.color}`}>
                      LVL {selectedStat.level}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                    TOTAL ACCUMULATED: {selectedStat.points} POINTS
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playTap();
                  setSelectedAttributeKey(null);
                }}
                className="p-2 text-slate-400 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
              {selectedStat.description}
            </p>

            {/* Level Threshold Progression Bar */}
            <div className="space-y-1.5 p-3.5 bg-[#1a0a0d] border border-[#2a1418]">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className={`${selectedStat.color} font-bold flex items-center gap-1`}>
                  <Sparkles className="w-3.5 h-3.5" /> LEVEL {selectedStat.level} CALIBRATION
                </span>
                <span className="text-white font-mono font-bold flex items-baseline gap-1">
                  <HudDigitRoller value={selectedStat.progressInLevel} />
                  <span>/ 50 PTS ({selectedStat.progressPct}%)</span>
                </span>
              </div>
              <HudProgressBar
                progress={selectedStat.progressPct}
                className="h-2.5 w-full"
                trackClassName="bg-[#07050a] border border-[#2a1418]"
                fillClassName={selectedStat.bgColor.replace('/10', '/80')}
                showLeadingGlow={true}
              />
              <div className="text-right text-[10px] font-mono text-slate-400">
                {selectedStat.pointsToNext} more points to reach <strong className="text-[#00f6ff] font-bold">Level {selectedStat.level + 1}</strong>
              </div>
            </div>

            {/* Linked Goals Contributing to this Attribute */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold block">
                Contributing Directives ({selectedStat.linkedGoals.length})
              </span>
              {selectedStat.linkedGoals.length === 0 ? (
                <div className="p-3 bg-[#1a0a0d] text-center text-xs font-mono text-slate-500 border border-[#2a1418]">
                  No active directives currently mapped to {selectedStat.name}.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedStat.linkedGoals.map((g) => (
                    <div
                      key={g.id}
                      className="p-2.5 bg-[#1a0a0d] border border-[#2a1418] flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white font-mono font-bold truncate max-w-[240px]">{g.title}</span>
                      <span className="text-[#00f6ff] font-bold">
                        {g.primaryAttribute === selectedStat.key ? 'PRIMARY (+1/3/10)' : 'SECONDARY (+1)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                soundManager.playTap();
                setSelectedAttributeKey(null);
              }}
              className="w-full py-2.5 font-mono text-xs uppercase bg-[#00f6ff] hover:bg-[#3cff9e] text-black font-bold min-h-[44px]"
            >
              DISMISS TELEMETRY
            </button>
          </HudBracketFrame>
        </div>
      )}
    </main>
  );
}

