/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@life-rpg/types', '@life-rpg/db'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
    outputFileTracingIncludes: {
      '/api/**/*': [
        '../../node_modules/.pnpm/@prisma+client*/**/*',
        '../../packages/db/prisma/**/*',
        './node_modules/@prisma/client/**/*',
        './node_modules/.prisma/client/**/*',
      ],
    },
  },
};

module.exports = nextConfig;

