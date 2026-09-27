import type { Config } from 'tailwindcss';
import path from 'path';

const config: Config = {
  content: [
    path.join(__dirname, './app/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, './components/**/*.{js,ts,jsx,tsx,mdx}'),
    path.join(__dirname, './lib/**/*.{js,ts,jsx,tsx,mdx}'),
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/app/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/components/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/web/lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/*/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 6s linear infinite',
      },
      colors: {
        // Design.md Section 1.1 Core Surfaces & Lines
        'bg-void': '#07050a',
        'bg-panel-900': '#120608',
        'bg-panel-800': '#1a0a0d',
        'bg-panel-glass': 'rgba(15, 5, 8, 0.9)',
        'hud-hairline': '#ff003c',
        'border-subtle': '#2a1418',
        'border-bracket': '#ff3b5c',

        // Section 1.2 Accent Palette
        'accent-cyber-red': '#ff003c',
        'accent-cyber-cyan': '#00f6ff',
        'accent-eddie-gold': '#ffd84a',
        'accent-street-green': '#3cff9e',
        'accent-danger-orange': '#ff8a3d',

        // Section 1.3 Rarity Color System
        rarity: {
          common: '#c9d1d9',
          uncommon: '#3cff9e',
          rare: '#3ba7ff',
          epic: '#bf5af2',
          legendary: '#ffb020',
          iconic: '#ff003c',
        },

        // Backward compatibility mappings
        base: '#07050a',
        'cyan-neon': '#00f6ff',
        'blue-electric': '#3ba7ff',
        'amber-xp': '#ffd84a',
        'green-matrix': '#3cff9e',
        'neon-crimson': '#ff003c',
        'neon-purple': '#bf5af2',
      },
      fontFamily: {
        orbitron: ['var(--font-orbitron)', 'Orbitron', 'sans-serif'],
        mono: ['var(--font-mono)', 'Share Tech Mono', 'monospace'],
        body: ['var(--font-chakra)', 'Chakra Petch', 'sans-serif'],
        sans: ['var(--font-chakra)', 'Chakra Petch', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 15px rgba(255, 0, 60, 0.45)',
        'glow-cyan': '0 0 15px rgba(0, 246, 255, 0.45)',
        'glow-gold': '0 0 15px rgba(255, 216, 74, 0.45)',
        'glow-amber': '0 0 15px rgba(255, 216, 74, 0.45)',
        'glow-green': '0 0 15px rgba(60, 255, 158, 0.45)',
        'glow-matrix': '0 0 15px rgba(60, 255, 158, 0.45)',
        'glow-purple': '0 0 15px rgba(191, 90, 242, 0.45)',
        'glow-crimson': '0 0 15px rgba(255, 0, 60, 0.45)',
        'bracket': '0 0 10px rgba(255, 59, 92, 0.3)',
      },
      backgroundImage: {
        'scanlines': 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25) 1px, transparent 1px, transparent 2px)',
        'cyber-grid': 'linear-gradient(to right, rgba(255, 0, 60, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 0, 60, 0.05) 1px, transparent 1px)',
      },
    },
  },
  safelist: [
    'border-border-subtle',
    'border-border-bracket',
    'border-hud-hairline',
    'border-accent-cyber-red',
    'border-accent-cyber-cyan',
    'border-accent-eddie-gold',
    'border-accent-street-green',
    'border-accent-danger-orange',
    'border-rarity-common',
    'border-rarity-uncommon',
    'border-rarity-rare',
    'border-rarity-epic',
    'border-rarity-legendary',
    'border-rarity-iconic',
    'text-accent-cyber-red',
    'text-accent-cyber-cyan',
    'text-accent-eddie-gold',
    'text-accent-street-green',
    'text-accent-danger-orange',
    'text-rarity-common',
    'text-rarity-uncommon',
    'text-rarity-rare',
    'text-rarity-epic',
    'text-rarity-legendary',
    'text-rarity-iconic',
    'shadow-glow-red',
    'shadow-glow-cyan',
    'shadow-glow-gold',
    'shadow-glow-green',
    'shadow-glow-purple',
  ],
  plugins: [],
};

export default config;
