# T3 Stack Template

Personal starter template based on [T3 Stack](https://create.t3.gg/), upgraded to latest versions.

## Tech Stack

| Category       | Technology                        |
| -------------- | --------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack)|
| Language       | TypeScript 5.9 (strict)           |
| API            | tRPC 11                           |
| Database       | Prisma 7 + PostgreSQL (pg driver) |
| Auth           | better-auth (email/password)      |
| Styling        | Tailwind CSS 4                    |
| Validation     | Zod 4                             |
| Linting        | ESLint 9 (flat config)            |
| Formatting     | Prettier + tailwindcss plugin     |
| Git Hooks      | Husky (pre-push: lint + typecheck)|

## Quick Start

```bash
# 1. Clone / use template
gh repo create my-project --template latteouka/t3-template --clone
cd my-project

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET

# 4. Start database & push schema
./start-database.sh        # or start your own PostgreSQL
pnpm db:push

# 5. Start dev server
pnpm dev
```

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── api/
│   │   ├── auth/[...all]/ # better-auth API route
│   │   └── trpc/[trpc]/   # tRPC API route
│   ├── layout.tsx         # Root layout (Geist font, TRPCProvider)
│   └── page.tsx           # Home page
├── env.js                 # Environment variable validation (Zod)
├── server/
│   ├── api/
│   │   ├── root.ts        # tRPC app router
│   │   ├── routers/       # tRPC route handlers
│   │   └── trpc.ts        # tRPC context & procedures
│   ├── better-auth/       # Auth configuration
│   └── db.ts              # Prisma client (pg driver adapter)
├── styles/globals.css     # Tailwind CSS
└── trpc/                  # tRPC client (React + RSC)
prisma/
└── schema.prisma          # Database schema (auth tables)
prisma.config.ts           # Prisma 7 config (migration URL)
```

## Scripts

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Start dev server (Turbopack)         |
| `pnpm build`         | Production build                     |
| `pnpm check`         | ESLint + TypeScript type check       |
| `pnpm lint`          | ESLint only                          |
| `pnpm typecheck`     | TypeScript only                      |
| `pnpm db:push`       | Push schema to database              |
| `pnpm db:studio`     | Open Prisma Studio                   |
| `pnpm db:generate`   | Run Prisma migrations (dev)          |
| `pnpm format:write`  | Format code with Prettier            |
