/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Immediately install and activate new service worker versions
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Clear stale api and pages caches on activation to prevent auth/routing state corruption
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith('api-get-cache') || name.startsWith('pages-cache'))
          .map((name) => {
            console.log('[SW] Purging legacy cache:', name);
            return caches.delete(name);
          })
      );
      await self.clients.claim();
    })()
  );
});

// Allow clients to trigger skipWaiting explicitly
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
  runtimeCaching: [
    // 1. STEP 2: Explicitly exclude ALL auth routes from caching — ALWAYS NETWORK-ONLY
    {
      matcher({ url }) {
        return url.pathname.startsWith('/api/auth');
      },
      handler: new NetworkOnly(),
    },
    // 2. STEP 2: All API mutations (POST, PUT, DELETE, PATCH) — ALWAYS NETWORK-ONLY
    {
      matcher({ request }) {
        return request.method !== 'GET';
      },
      handler: new NetworkOnly(),
    },
    // 3. STEP 2: Next.js RSC dynamic data payload requests — ALWAYS NETWORK-ONLY to prevent stale auth/routing desync
    {
      matcher({ url, request }) {
        return (
          request.headers.get('RSC') === '1' ||
          request.headers.get('Next-Router-Prefetch') === '1' ||
          url.searchParams.has('_rsc')
        );
      },
      handler: new NetworkOnly(),
    },
    // 4. API GET requests (goals list, quest data, character profile) — Network-first with short cache fallback
    {
      matcher({ url, request }) {
        return (
          url.pathname.startsWith('/api/') &&
          !url.pathname.startsWith('/api/auth') &&
          request.method === 'GET'
        );
      },
      handler: new NetworkFirst({
        cacheName: 'api-game-data-v2',
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [200],
          }),
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // 5. Static assets (JS/CSS chunks, fonts, icons, images) — Cache-first with long TTL
    {
      matcher({ url, request }) {
        return (
          url.pathname.startsWith('/_next/static/') ||
          url.pathname.startsWith('/icons/') ||
          url.pathname.startsWith('/fonts/') ||
          url.pathname === '/manifest.json' ||
          url.pathname === '/manifest.webmanifest' ||
          request.destination === 'style' ||
          request.destination === 'script' ||
          request.destination === 'font' ||
          request.destination === 'image'
        );
      },
      handler: new CacheFirst({
        cacheName: 'static-assets-v2',
        plugins: [
          new CacheableResponsePlugin({
            statuses: [200],
          }),
          new ExpirationPlugin({
            maxEntries: 150,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // 6. Navigation HTML shell requests — Network-first with offline fallback
    {
      matcher({ request }) {
        return request.mode === 'navigate' || request.destination === 'document';
      },
      handler: new NetworkFirst({
        cacheName: 'pages-cache-v2',
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [200],
          }),
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
