# Arise Life MMO RPG

A gamified life-goal-tracking application built with Next.js, Express, Prisma, and TypeScript in a pnpm monorepo.

## Structure

```
arise-life-mmo-rpg/
├── apps/
│   ├── web/                      # Next.js 14 (App Router) frontend, TailwindCSS, TypeScript
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   └── api/                      # Express backend, TypeScript
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── db/                       # Prisma schema + shared client singleton
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   └── types/                    # Shared TypeScript types for web and api
│       ├── src/
│       │   ├── quest.ts
│       │   ├── player.ts
│       │   └── index.ts
│       └── package.json
├── package.json                  # Root monorepo scripts & dependencies
├── pnpm-workspace.yaml           # pnpm workspace configuration
├── tsconfig.json                 # Base TypeScript configuration
├── render.yaml                   # Render Blueprint for apps/api
├── .gitignore
└── README.md
```

## Quick Start (Verification)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate Prisma Client
```bash
pnpm db:generate
```

### 3. Run Development Servers
```bash
pnpm dev
```

- **Frontend (Web)**: [http://localhost:3005](http://localhost:3005)
- **Backend (API Health)**: [http://localhost:4000/health](http://localhost:4000/health)
