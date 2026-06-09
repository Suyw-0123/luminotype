# Architecture

## Overview

Luminotype is a typing test split into a static single-page frontend and a thin content API backed
by PostgreSQL. There is no authentication: all per-user state (settings and results history) is kept
in the browser's `localStorage`. The backend exists only to serve **shared content** — word lists
and quotes — that benefits from living in a database.

```
┌──────────────┐     /api/*      ┌──────────────┐     SQL      ┌──────────────┐
│   Browser    │ ───────────────▶│   API (Hono) │ ────────────▶│  PostgreSQL  │
│  (React SPA) │◀─────────────── │   word/quote │◀──────────── │  words/quotes│
└──────────────┘   JSON DTOs     └──────────────┘   rows       └──────────────┘
       │
       ▼
  localStorage (settings + results history)
```

In production an nginx container serves the built SPA and reverse-proxies `/api` to the API
container, so the browser always talks to a single origin. In development, Vite's dev server proxies
`/api` to the API process. See [Deployment](./deployment.md) and [Development](./development.md).

## Monorepo layout

The repository is a [pnpm workspace](https://pnpm.io/workspaces).

```
luminotype/
├── apps/
│   ├── web/        @luminotype/web — React + Vite frontend
│   └── api/        @luminotype/api — Hono API + Drizzle ORM
├── packages/
│   └── shared/     @luminotype/shared — types shared by web and api
├── docker-compose.yml
├── tsconfig.base.json   shared TypeScript compiler options
└── pnpm-workspace.yaml
```

### Packages

- **`@luminotype/shared`** (`packages/shared`) — Plain TypeScript types and constants: `TestMode`,
  `TestConfig`, `QuoteLength`, API DTOs (`Language`, `WordListResponse`, `Quote`, `QuoteResponse`),
  and result models (`CharCounts`, `TestResult`). Built with `tsc` to `dist/` and consumed by both
  apps via the `workspace:*` protocol. This is the single source of truth for the API contract.

- **`@luminotype/api`** (`apps/api`) — A [Hono](https://hono.dev) server run on Node via
  `@hono/node-server`. Talks to PostgreSQL through [Drizzle ORM](https://orm.drizzle.team) on the
  `postgres-js` driver. Owns the database schema, migrations, and the seed data.

- **`@luminotype/web`** (`apps/web`) — A React 18 SPA built with Vite. Tailwind for styling, Zustand
  for persisted settings/results, and React Router for navigation. Contains the typing engine.

## Type sharing

Because both apps import from `@luminotype/shared`, an API response type and the frontend's
expectation of it cannot drift apart without a compile error. For example the words endpoint returns
`WordListResponse`, and `apps/web/src/lib/api.ts` deserializes into the same type.

## Data flow of a test

1. The frontend reads the active `TestConfig` from the Zustand `configStore`.
2. `TypingTest` fetches the corpus for that config — a word pool (`GET /api/languages/:lang/words`)
   and, for quote mode, a quote (`GET /api/quotes`).
3. The corpus is handed to the typing engine (`useTypingEngine`), which generates the target text.
4. The user types; the engine tracks state and computes live/final statistics.
5. On completion, the resulting `TestResult` is appended to the `resultsStore` and persisted to
   `localStorage`. Nothing is sent back to the server.

See [Typing Engine](./typing-engine.md) for step 3–4 and [API Reference](./api.md) for step 2.

## Why these choices

- **No backend persistence of results** keeps the system simple and privacy-friendly; the API is
  stateless and trivially cacheable.
- **Postgres for the corpus** (rather than static JSON shipped to the client) lets word lists and
  quotes grow, be queried by language/length, and be randomized server-side without bloating the
  bundle.
- **A monorepo with a shared package** gives end-to-end type safety with a single `pnpm install`.
