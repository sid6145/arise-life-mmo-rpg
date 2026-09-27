'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Crosshair, Lock, Mail, User, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { HudBackgroundLayer } from '@/components/HudBackgroundLayer';
import { HudBracketFrame } from '@/components/HudBracketFrame';
import { HudUnderlineInput } from '@/components/HudUnderlineInput';
import { HudAuthButton } from '@/components/HudAuthButton';
import { emitFeedback } from '@/lib/feedbackBus';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorFlash, setErrorFlash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [glitchSuccess, setGlitchSuccess] = useState(false);

  // Sync mode when query parameter changes
  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setMode('signup');
    }
  }, [searchParams]);

  const triggerError = (msg: string) => {
    setError(msg);
    setErrorFlash(true);
    emitFeedback('error');
    // Single 150ms error pulse flash per Section 13.2
    setTimeout(() => {
      setErrorFlash(false);
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorFlash(false);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // 1. Register User + Player in Neon DB
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          triggerError(regData.error || 'Registration failed');
          setLoading(false);
          return;
        }
      }

      // 2. Sign in with credentials
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        triggerError(
          mode === 'signup'
            ? 'Account created but sign in failed. Please try logging in.'
            : 'Invalid credentials or neural authentication rejected.'
        );
        setLoading(false);
        return;
      }

      // 3. Single-frame glitch on success before routing (Section 13.3)
      emitFeedback('auth_success');
      setGlitchSuccess(true);

      setTimeout(() => {
        router.push(callbackUrl);
        router.refresh();
      }, 70);
    } catch (err) {
      console.error('Auth error:', err);
      triggerError('An unexpected error occurred. Neural link disrupted.');
      setLoading(false);
    }
  };

  return (
    <HudBracketFrame
      active={true}
      rarity="rare"
      className={`p-6 sm:p-8 bg-bg-panel-glass/95 backdrop-blur-md border border-border-subtle shadow-2xl space-y-6 relative overflow-hidden transition-all duration-150 animate-hud-enter ${
        errorFlash ? 'animate-error-pulse' : ''
      }`}
    >
      {/* 13.4 Mode Toggle Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-bg-panel-900 border border-border-subtle">
        <button
          type="button"
          onClick={() => {
            emitFeedback('tap');
            setMode('signin');
            setError('');
          }}
          className={`py-2 text-xs font-mono font-bold tracking-widest uppercase transition-all select-none border-b-2 ${
            mode === 'signin'
              ? 'bg-bg-panel-800 text-accent-cyber-cyan border-accent-cyber-cyan shadow-glow-cyan'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          // ACCESS TERMINAL
        </button>
        <button
          type="button"
          onClick={() => {
            emitFeedback('tap');
            setMode('signup');
            setError('');
          }}
          className={`py-2 text-xs font-mono font-bold tracking-widest uppercase transition-all select-none border-b-2 ${
            mode === 'signup'
              ? 'bg-bg-panel-800 text-accent-cyber-cyan border-accent-cyber-cyan shadow-glow-cyan'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          // NEW OPERATIVE
        </button>
      </div>

      {/* Error Callout */}
      {error && (
        <div className="p-3 bg-accent-cyber-red/10 border border-accent-cyber-red text-red-300 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-accent-cyber-red shrink-0" />
          <span className="tracking-wide">{error}</span>
        </div>
      )}

      {/* 13.2 Form with Underline Fields & Focus Brackets */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'signup' && (
          <HudUnderlineInput
            label="Operative Callsign"
            type="text"
            required
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. V // Netrunner"
            autoComplete="name"
            error={Boolean(error)}
          />
        )}

        <HudUnderlineInput
          label="Neural Link ID (Email)"
          type="email"
          required
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operative@nightcity.net"
          autoComplete="email"
          error={Boolean(error)}
        />

        <HudUnderlineInput
          label="Security Cipher (Password)"
          type="password"
          required
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          error={Boolean(error)}
        />

        {/* 13.3 Instant-Press Submit Button with Text Decrypt Scramble */}
        <div className="pt-2">
          <HudAuthButton
            type="submit"
            loading={loading}
            loadingText={mode === 'signup' ? 'INITIALIZING OPERATIVE...' : 'AUTHENTICATING CIPHER...'}
            glitchSuccess={glitchSuccess}
          >
            {mode === 'signup' ? 'REGISTER & JACK IN' : 'AUTHENTICATE & ENTER'}
          </HudAuthButton>
        </div>
      </form>

      {/* 13.4 Secondary Footer Links & Telemetry Status */}
      <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-accent-street-green">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="tracking-wider">PROTO_V2 // 256-BIT NEURAL</span>
        </div>

        <button
          type="button"
          onClick={() => {
            emitFeedback('tap');
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError('');
          }}
          className="text-slate-400 hover:text-accent-cyber-cyan transition-colors underline uppercase tracking-wider select-none"
        >
          {mode === 'signin' ? 'Need Credentials?' : 'Existing Operative?'}
        </button>
      </div>
    </HudBracketFrame>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 text-slate-200">
      <div className="w-full max-w-md space-y-5">
        {/* Header Navigation & Tactical Logo */}
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/"
            onClick={() => emitFeedback('tap')}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-accent-cyber-cyan transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO DISPATCH</span>
          </Link>

          <span className="text-[10px] font-mono text-accent-cyber-red tracking-widest uppercase font-bold">
            SYS_AUTH // ACTIVE
          </span>
        </div>

        {/* Terminal Identity Brand */}
        <div className="text-center space-y-1.5 pb-1">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-bg-panel-800 border-2 border-accent-cyber-red shadow-glow-red clip-cyber-btn mb-1">
            <Crosshair className="w-6 h-6 text-accent-cyber-red animate-pulse" />
          </div>
          <h1 className="font-mono font-black text-2xl text-white tracking-widest uppercase flex items-center justify-center gap-2">
            LIFE <span className="text-accent-cyber-red">//</span> RPG
          </h1>
          <p className="font-mono text-[11px] text-slate-400 tracking-wider uppercase">
            // MILITARIZED NETRUNNER OS //
          </p>
        </div>

        <Suspense
          fallback={
            <div className="p-8 bg-bg-panel-glass border border-border-subtle text-center text-xs font-mono text-accent-cyber-cyan animate-pulse">
              INITIALIZING AUTHENTICATION MATRIX...
            </div>
          }
        >
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
