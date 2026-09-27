import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Orbitron, Share_Tech_Mono, Chakra_Petch } from 'next/font/google';
import { Navigation } from '../components/Navigation';
import { AuthProvider } from '../components/AuthProvider';
import { PwaManager } from '../components/PwaManager';
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

export const viewport: Viewport = {
  themeColor: '#07050a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Life RPG - Cyberpunk Goal Tracker',
  description: 'Level up your real life with daily, weekly, and boss quests.',
  applicationName: 'Life RPG',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Life RPG',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="bg-bg-void text-slate-200 font-sans antialiased min-h-screen selection:bg-[#00f6ff] selection:text-black pb-16 md:pb-0">
        <AuthProvider session={session}>
          <HudBackgroundLayer>
            <HudNavigationWipe />
            <Navigation initialUser={session?.user || null} initialPlayer={player} />
            {children}
            <PwaManager />
          </HudBackgroundLayer>
        </AuthProvider>
      </body>
    </html>
  );
}
