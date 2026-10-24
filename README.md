# Habit Tracker

A full-stack habit tracker: create habits, check them off every day and watch your streaks grow.

This is a learning project for practicing React, TypeScript, Node.js, Express and PostgreSQL. It is built step by step in short sprints. See the [roadmap](ROADMAP.md) and the [sprint plan with progress](SPRINTS.md) (both in Ukrainian).

## Tech stack

| Layer        | Now                                                | Planned                                              |
| ------------ | -------------------------------------------------- | ---------------------------------------------------- |
| Monorepo     | npm workspaces                                     | —                                                    |
| Frontend     | React 19, Vite 8, Tailwind CSS 4                   | React Router, TanStack Query, React Hook Form        |
| Backend      | Node.js 24, Express 5, TypeScript (run with `tsx`) | NestJS rewrite for comparison                        |
| Validation   | Zod (environment config)                           | Shared Zod schemas in `packages/shared`              |
| Database     | PostgreSQL 18 in Docker                            | Drizzle ORM and migrations                           |
| Logging      | pino, pino-http                                    | —                                                    |
| Code quality | ESLint 9, Prettier, Husky + lint-staged            | GitHub Actions CI                                    |
| Tests        | —                                                  | Vitest, Supertest, React Testing Library, Playwright |

## Project structure

```
habit-tracker/
├── apps/
│   ├── api/              # Express API (TypeScript)
│   └── web/              # React app (Vite + Tailwind)
├── packages/
│   └── shared/           # Shared Zod schemas and types
├── docker-compose.yml    # PostgreSQL
├── .env.example          # Environment variables template
└── package.json          # npm workspaces and root scripts
```

## Getting started

### Prerequisites

- Node.js 24 (pinned in `.nvmrc`; with nvm, run `nvm use`)
- Docker with Docker Compose v2

### Setup

```bash
git clone https://github.com/romaprok/habit-tracker.git
cd habit-tracker
nvm use
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

Open http://localhost:5173. The page should show **API: ok · DB: ok**.

`npm run dev` starts the API and the web app together, and `Ctrl+C` stops both. Run all commands from the repository root.

### Ports

| Service        | Port                                                                                |
| -------------- | ----------------------------------------------------------------------------------- |
| Web app (Vite) | `5173`                                                                              |
| API (Express)  | `3000`. In development the web app reaches it through the Vite proxy at `/api`      |
| PostgreSQL     | `5433`, not the default `5432`, to avoid clashing with a locally installed Postgres |

If a port is busy, change it in `.env`: `PORT`, `POSTGRES_PORT` and the port inside `DATABASE_URL`.

## Scripts

| Command                   | What it does                           |
| ------------------------- | -------------------------------------- |
| `npm run dev`             | Start the API and the web app together |
| `npm run lint`            | Run ESLint on the whole monorepo       |
| `npm run typecheck`       | Type-check all packages (`tsc -b`)     |
| `npm run dev -w apps/api` | Start only the API                     |
| `npm run dev -w apps/web` | Start only the web app                 |

Git hooks are installed by `npm install`: `pre-commit` lints and formats staged files, `pre-push` runs the type check.

## Environment variables

Copy `.env.example` to `.env`. The API validates its variables with Zod on startup and refuses to start, with a clear message, if something is missing or invalid.

| Variable                                            | Used by         | Description                                                 |
| --------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Docker Compose  | Credentials and name of the database created on first start |
| `POSTGRES_PORT`                                     | Docker Compose  | Host port for PostgreSQL                                    |
| `DATABASE_URL`                                      | API             | PostgreSQL connection string                                |
| `PORT`                                              | API, Vite proxy | API port                                                    |

## API

| Method | Path          | Response                                                                                          |
| ------ | ------------- | ------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/health` | `200 {"api":"ok","db":"ok"}`, or `503 {"api":"ok","db":"error"}` when the database is unavailable |
