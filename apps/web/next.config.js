const withSerwistInit = require('@serwist/next').default;

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@life-rpg/types', '@life-rpg/db'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/**/*': [
        '../../node_modules/.pnpm/@prisma+client*/**/*',
        '../../packages/db/prisma/**/*',
        './node_modules/@prisma/client/**/*',
        './node_modules/.prisma/client/**/*',
      ],
    },
  },
};

module.exports = withSerwist(nextConfig);
