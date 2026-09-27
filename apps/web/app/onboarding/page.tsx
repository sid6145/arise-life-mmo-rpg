'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Crosshair,
  Terminal,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Dumbbell,
  Brain,
  Palette,
  Briefcase,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';
import { HudProgressBar } from '@/components/HudProgressBar';

type Step = 'welcome' | 'character' | 'goal' | 'generating' | 'ready';

const PRESET_GOALS = [
  { id: 'fit', label: 'Run 100km this month', category: 'Endurance', icon: Dumbbell, color: 'text-neon-cyan' },
  { id: 'learn', label: 'Master Next.js & TypeScript', category: 'Intelligence', icon: Brain, color: 'text-neon-purple' },
  { id: 'create', label: 'Design & ship 4 UI open-source kits', category: 'Creative', icon: Palette, color: 'text-neon-gold' },
  { id: 'career', label: 'Read 2 engineering books', category: 'Intelligence', icon: Briefcase, color: 'text-green-matrix' },
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>('welcome');
  const [characterName, setCharacterName] = useState('Adventurer V');
  const [characterClass, setCharacterClass] = useState('Cyber Paladin');
  const [goalText, setGoalText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Intelligence');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedQuestTitle, setGeneratedQuestTitle] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const startGeneration = async () => {
    setStep('generating');
    setGenerationProgress(20);

    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 400);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }

      const res = await fetch(`${API_URL}/api/goals`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          title: goalText.trim(),
          category: selectedCategory,
        }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (res.ok) {
        const json = await res.json();
        const firstQuest = json.data?.quests?.[0];
        if (firstQuest) {
          setGeneratedQuestTitle(firstQuest.title);
        }
      }
      setStep('ready');
    } catch (err) {
      console.error('[Onboarding] Error creating goal:', err);
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setStep('ready');
    }
  };

  return (
    <main className="min-h-screen bg-base bg-tech-grid flex items-center justify-center p-4 sm:p-6 text-slate-200">
      <div className="w-full max-w-xl">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between font-mono text-xs text-slate-500 mb-3 px-1">
          <span className="flex items-center gap-1.5 text-cyan-neon">
            <Terminal className="w-3.5 h-3.5" /> CHARACTER SETUP
          </span>
          <span>STEP {step === 'welcome' ? '1/4' : step === 'character' ? '2/4' : step === 'goal' ? '3/4' : '4/4'}</span>
        </div>

        {/* Main Onboarding Container */}
        <div className="cyber-panel bg-surface-900 border border-border-glass p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-neon/5 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: WELCOME / AUTH */}
          {step === 'welcome' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-neon/10 border-2 border-cyan-neon flex items-center justify-center clip-cyber-btn shadow-glow-cyan">
                  <Crosshair className="w-6 h-6 text-cyan-neon animate-spin-slow" />
                </div>
                <div>
                  <h1 className="font-orbitron font-extrabold text-2xl text-white tracking-wider uppercase">
                    Welcome to Life RPG
                  </h1>
                  <p className="font-mono text-xs text-slate-400">TURN YOUR GOALS INTO AN EPIC ADVENTURE</p>
                </div>
              </div>

              <div className="bg-surface-800 p-4 border border-border-subtle rounded-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-neon">
                  <Lock className="w-3.5 h-3.5" /> PERSISTENT REAL-TIME RPG PROGRESSION
                </div>
                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                  Life RPG transforms your real-world goals into calibrated quests backed by OpenRouter AI and Neon PostgreSQL.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep('character')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-neon hover:bg-cyan-300 text-black font-mono font-bold uppercase tracking-wider text-sm clip-cyber-btn shadow-glow-cyan transition-all"
                >
                  <span>CREATE CHARACTER</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-[11px] font-mono text-slate-500">
                    Quick setup mode • Instant start
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHARACTER CREATION */}
          {step === 'character' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono text-cyan-neon uppercase tracking-widest">
                  CHARACTER CREATION
                </span>
                <h2 className="font-orbitron font-extrabold text-2xl text-white tracking-wide uppercase mt-1">
                  Name Your Character
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Choose your character name and starting class.
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 mb-1.5 uppercase tracking-wider">
                    CHARACTER NAME
                  </label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Enter character name..."
                    className="w-full bg-surface-800 border border-border-subtle focus:border-cyan-neon p-3 text-white font-mono text-sm focus:outline-none focus:shadow-glow-cyan transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1.5 uppercase tracking-wider">
                    STARTING CLASS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Cyber Paladin', 'Shadow Rogue', 'Techno Mage', 'Bio Monk'].map((archetype) => (
                      <button
                        key={archetype}
                        type="button"
                        onClick={() => setCharacterClass(archetype)}
                        className={`p-2.5 text-left border transition-all text-xs font-mono uppercase ${
                          characterClass === archetype
                            ? 'border-cyan-neon bg-cyan-950/60 text-cyan-neon shadow-glow-cyan font-bold'
                            : 'border-border-subtle bg-surface-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {archetype}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('welcome')}
                  className="px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-slate-300 font-mono text-xs uppercase tracking-wider border border-border-subtle"
                >
                  BACK
                </button>
                <button
                  onClick={() => setStep('goal')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-cyan-neon hover:bg-cyan-300 text-black font-mono font-bold uppercase tracking-wider text-xs clip-cyber-btn shadow-glow-cyan transition-all"
                >
                  <span>SET YOUR FIRST GOAL</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SET FIRST GOAL */}
          {step === 'goal' && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono text-amber-xp uppercase tracking-widest">
                  GOAL SETUP
                </span>
                <h2 className="font-orbitron font-extrabold text-2xl text-white tracking-wide uppercase mt-1">
                  Set Your First Goal
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Tell us what you want to achieve. The AI Grandmaster will auto-generate and persist your first daily quest in the database.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                    GOAL DESCRIPTION
                  </label>
                  <textarea
                    rows={2}
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    placeholder="e.g. Read 2 books and complete a coding side project this month..."
                    className="w-full bg-surface-800 border border-border-subtle focus:border-cyan-neon p-3 text-white font-sans text-sm focus:outline-none focus:shadow-glow-cyan transition-all"
                  />
                </div>

                <div>
                  <span className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
                    OR CHOOSE A POPULAR GOAL PRESET
                  </span>
                  <div className="space-y-2">
                    {PRESET_GOALS.map((preset) => {
                      const Icon = preset.icon;
                      const isSelected = goalText === preset.label;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => {
                            setGoalText(preset.label);
                            setSelectedCategory(preset.category);
                          }}
                          className={`p-2.5 border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-xp bg-amber-950/40 shadow-glow-amber text-white'
                              : 'border-border-subtle bg-surface-800/80 hover:border-slate-500 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${preset.color}`} />
                            <div>
                              <div className="text-xs font-mono font-bold">{preset.label}</div>
                              <div className="text-[10px] text-slate-400">{preset.category}</div>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-xp shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('character')}
                  className="px-4 py-2.5 bg-surface-800 hover:bg-surface-700 text-slate-300 font-mono text-xs uppercase tracking-wider border border-border-subtle"
                >
                  BACK
                </button>
                <button
                  disabled={!goalText.trim()}
                  onClick={startGeneration}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-xp hover:bg-yellow-300 disabled:opacity-50 text-black font-mono font-bold uppercase tracking-wider text-xs clip-cyber-btn shadow-glow-amber transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>INITIALIZE GOAL & QUEST</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATION / CONFIRMATION */}
          {step === 'generating' && (
            <div className="py-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-cyan-950/60 border-2 border-cyan-neon flex items-center justify-center clip-cyber-btn shadow-glow-cyan animate-pulse">
                <Sparkles className="w-8 h-8 text-cyan-neon animate-spin" />
              </div>

              <div className="space-y-2">
                <h3 className="font-orbitron font-bold text-xl text-white uppercase tracking-wider">
                  Synthesizing Quest Data
                </h3>
                <p className="font-mono text-xs text-cyan-neon">
                  Persisting goal to Neon PostgreSQL and generating first daily quest with OpenRouter...
                </p>
              </div>

              <div className="space-y-1.5 max-w-xs mx-auto">
                <HudProgressBar
                  progress={generationProgress}
                  variant="xp"
                  className="h-2 w-full"
                  trackClassName="bg-surface-800 border border-border-subtle"
                />
                <div className="text-[11px] font-mono text-slate-400 text-right">{generationProgress}%</div>
              </div>
            </div>
          )}

          {step === 'ready' && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 mx-auto bg-green-950/60 border-2 border-green-matrix flex items-center justify-center clip-cyber-btn shadow-glow-matrix">
                <ShieldCheck className="w-8 h-8 text-green-matrix" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono text-green-matrix uppercase tracking-widest">
                  SETUP COMPLETE
                </span>
                <h3 className="font-orbitron font-extrabold text-2xl text-white uppercase tracking-wider">
                  Goal & Daily Quest Ready!
                </h3>
                <p className="text-xs text-slate-300 font-sans max-w-sm mx-auto">
                  Your goal has been saved and your initial daily quest is ready in your Quest Log.
                </p>
              </div>

              <div className="bg-surface-800 p-4 border border-border-subtle text-left space-y-1 font-mono text-xs">
                <div className="text-slate-400">CHARACTER: <span className="text-white font-bold">{characterName}</span></div>
                <div className="text-slate-400">CLASS: <span className="text-cyan-neon">{characterClass}</span></div>
                <div className="text-slate-400">PRIMARY GOAL: <span className="text-amber-xp">{goalText}</span></div>
                {generatedQuestTitle && (
                  <div className="text-slate-400">DAILY QUEST: <span className="text-green-matrix font-bold">{generatedQuestTitle}</span></div>
                )}
              </div>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-cyan-neon hover:bg-cyan-300 text-black font-mono font-bold uppercase tracking-wider text-sm clip-cyber-btn shadow-glow-cyan transition-all"
              >
                <span>GO TO QUEST LOG</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
