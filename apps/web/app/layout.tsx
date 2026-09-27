import './globals.css';
import type { Metadata } from 'next';
import { Orbitron, Share_Tech_Mono, Chakra_Petch } from 'next/font/google';
import { Navigation } from '../components/Navigation';
import { AuthProvider } from '../components/AuthProvider';
import { auth } from '../auth';
import { getCachedPlayer } from '@/lib/data';

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const chakraPetch = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
});

import { HudBackgroundLayer } from '../components/HudBackgroundLayer';
import { HudNavigationWipe } from '../components/HudNavigationWipe';

export const metadata: Metadata = {
  title: 'Life RPG - Cyberpunk Goal Tracker',
  description: 'Level up your real life with daily, weekly, and boss quests.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  let player = null;

  if (session?.user?.id) {
    player = await getCachedPlayer(session.user.id);
  }

  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${shareTechMono.variable} ${chakraPetch.variable} dark`}
    >
      <body className="bg-bg-void text-slate-200 font-sans antialiased min-h-screen selection:bg-[#00f6ff] selection:text-black pb-16 md:pb-0">
        <AuthProvider session={session}>
          <HudBackgroundLayer>
            <HudNavigationWipe />
            <Navigation initialUser={session?.user || null} initialPlayer={player} />
            {children}
          </HudBackgroundLayer>
        </AuthProvider>
      </body>
    </html>
  );
}
