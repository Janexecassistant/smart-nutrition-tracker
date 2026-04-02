# Smart Nutrition Tracker

Smart nutrition tracking app. Track food, hit goals, know what to eat next.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.2
- [Docker](https://www.docker.com/) (for Postgres, Redis, Typesense)
- [Node.js](https://nodejs.org/) >= 20 (for Next.js and Expo)

### 1. Clone and install

```bash
git clone <repo-url> smart-nutrition-tracker
cd smart-nutrition-tracker
bun install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432), Redis (port 6379), and Typesense (port 8108).

### 3. Set up environment

```bash
cp .env.example .env
# Edit .env with your Supabase keys (or use local Supabase CLI)
```

### 4. Run database migrations and seed

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
```

### 5. Start development

```bash
bun run dev
```

This starts all apps concurrently:
- **API** → http://localhost:3001
- **Web** → http://localhost:3000
- **Mobile** → Expo DevTools

## Project Structure

```
snt/
  apps/
    api/          → Hono API server (Bun)
    web/          → Next.js web app
    mobile/       → Expo React Native app
  packages/
    shared/       → TypeScript types, Zod schemas, constants
    db/           → Drizzle ORM schema, migrations, seed data
    nutrition/    → Calorie/macro calculation engine
    suggestions/  → Meal suggestion engine (WIP)
    ui/           → Shared UI components (WIP)
```

## Tech Stack

- **Frontend:** React Native (Expo) + Next.js
- **Backend:** Hono on Bun
- **Database:** PostgreSQL via Drizzle ORM
- **Auth:** Supabase Auth
- **Search:** Typesense
- **Cache:** Redis
- **Monorepo:** Turborepo

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Start all apps in dev mode |
| `bun run build` | Build all apps |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run database migrations |
| `bun run db:seed` | Seed database with sample foods |
| `bun run type-check` | Type-check all packages |
| `bun run lint` | Lint all packages |
