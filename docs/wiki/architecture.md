# Architecture

## Overview

Luminotype is a typing test split into a static single-page frontend and a thin content API. There
is no authentication and no database: all per-user state (settings and results history) is kept in
the browser's `localStorage`, and the backend serves **shared content** — word lists and quotes —
from read-only JSON bundled at build time.

```
┌──────────────┐     /api/*      ┌──────────────┐    import    ┌──────────────┐
│   Browser    │ ───────────────▶│   API (Hono) │ ────────────▶│  bundled     │
│  (React SPA) │◀─────────────── │   word/quote │◀──────────── │  JSON corpus │
└──────────────┘   JSON DTOs     └──────────────┘              └──────────────┘
       │
       ▼
  localStorage (settings + results history)
```

The browser always talks to a single origin. On **Cloudflare Pages** the Hono app runs as a Pages
Function at `/api/*` alongside the static assets; in **Docker** an nginx container serves the SPA and
reverse-proxies `/api` to the Node API; in **development** Vite's dev server proxies `/api` to the API
process. The Hono app (`createApiApp()`) is identical across all three. See
[Deployment](./deployment.md) and [Development](./development.md).

## Monorepo layout

The repository is a [pnpm workspace](https://pnpm.io/workspaces).

```
luminotype/
├── apps/
│   ├── web/        @luminotype/web — React + Vite frontend
│   └── api/        @luminotype/api — Hono content API (bundled JSON)
├── packages/
│   └── shared/     @luminotype/shared — types shared by web and api
├── functions/      Cloudflare Pages Function (serves the Hono app at /api/*)
├── docker-compose.yml
├── wrangler.toml        Cloudflare Pages runtime config
├── tsconfig.base.json   shared TypeScript compiler options
└── pnpm-workspace.yaml
```

### Packages

- **`@luminotype/shared`** (`packages/shared`) — Plain TypeScript types and constants: `TestMode`,
  `TestConfig`, `QuoteLength`, API DTOs (`Language`, `WordListResponse`, `Quote`, `QuoteResponse`),
  and result models (`CharCounts`, `TestResult`). Built with `tsc` to `dist/` and consumed by both
  apps via the `workspace:*` protocol. This is the single source of truth for the API contract.

- **`@luminotype/api`** (`apps/api`) — A [Hono](https://hono.dev) content API. `createApiApp()` in
  `src/app.ts` is runtime-agnostic and reads the word/quote corpus from bundled JSON
  (`src/data/`); `src/index.ts` serves it on Node via `@hono/node-server` for local dev and Docker,
  and `functions/api/[[route]].ts` serves the same app on Cloudflare Pages. See
  [Content corpus](./content.md).

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
- **Bundled JSON instead of a database.** The corpus is small (~34 KB), read-only, and changes rarely,
  so a database earned nothing but operational weight. Serving it from bundled JSON lets the whole API
  run as a Cloudflare Pages Function for free with no DB to provision, while staying easy to grow.
- **A monorepo with a shared package** gives end-to-end type safety with a single `pnpm install`.
