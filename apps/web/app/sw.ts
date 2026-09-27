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

// Allow clients to trigger skipWaiting explicitly
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Step 7: We manage skipWaiting explicitly via user prompt banner
  clientsClaim: true,
  navigationPreload: true,
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
    // 1. STEP 4: Never cache non-GET API requests (mutations: POST, PUT, DELETE, PATCH)
    // Network-only ensures goal create/delete race conditions are never reintroduced.
    {
      matcher({ url, request }) {
        return url.pathname.startsWith('/api/') && request.method !== 'GET';
      },
      handler: new NetworkOnly(),
    },
    // 2. STEP 4: Network-first with short cache fallback for API GET requests (goals, quests, player data)
    {
      matcher({ url, request }) {
        return url.pathname.startsWith('/api/') && request.method === 'GET';
      },
      handler: new NetworkFirst({
        cacheName: 'api-get-cache',
        networkTimeoutSeconds: 4,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          }),
        ],
      }),
    },
    // 3. STEP 4: Cache-first for static Next.js assets, fonts, icons, styles, scripts (long TTL)
    {
      matcher({ url, request }) {
        return (
          url.pathname.startsWith('/_next/static/') ||
          url.pathname.startsWith('/icons/') ||
          url.pathname.startsWith('/fonts/') ||
          request.destination === 'style' ||
          request.destination === 'script' ||
          request.destination === 'font' ||
          request.destination === 'image'
        );
      },
      handler: new CacheFirst({
        cacheName: 'static-assets-cache',
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 120,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // 4. STEP 4: Navigation requests (pages) network-first with cache fallback
    {
      matcher({ request }) {
        return request.mode === 'navigate' || request.destination === 'document';
      },
      handler: new NetworkFirst({
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 4,
        plugins: [
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
