# Development

## Prerequisites

- Node.js >= 20
- pnpm 10 — `corepack enable`
- Docker + Docker Compose (for PostgreSQL during local dev)

## First-time setup

```bash
pnpm install

# Start PostgreSQL (published on localhost:5432)
docker compose up -d db

# Apply migrations and seed the corpus
pnpm db:migrate
pnpm seed

# Run web (http://localhost:5173) + api (http://localhost:3001) together
pnpm dev
```

`pnpm dev` runs the web and api dev servers concurrently. Vite proxies `/api` to the API process, so
the frontend uses the same-origin `/api` path in both dev and prod.

## Workspace scripts (run from the repo root)

| Script             | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `pnpm dev`         | Run web + api in watch mode                           |
| `pnpm build`       | Build `shared`, then `api`, then `web` for production |
| `pnpm test`        | Run all unit/integration tests (Vitest)               |
| `pnpm lint`        | ESLint + Prettier check                               |
| `pnpm format`      | Apply Prettier formatting                             |
| `pnpm db:generate` | Generate a Drizzle migration from the schema          |
| `pnpm db:migrate`  | Apply migrations to the database                      |
| `pnpm seed`        | Seed languages, word lists, and quotes                |

Per-package scripts run with a filter, e.g. `pnpm --filter @luminotype/web build` or
`pnpm --filter @luminotype/api typecheck`.

## Build order & the shared package

`@luminotype/shared` compiles to `dist/`, which the apps import. After changing shared types, rebuild
it (`pnpm --filter @luminotype/shared build`) — `pnpm build` already does this first. The shared
`tsconfig` intentionally does **not** use `composite`/incremental output, to avoid a stale
`.tsbuildinfo` suppressing emits (notably inside Docker builds).

## TypeScript

`tsconfig.base.json` holds shared strict options (`strict`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`, etc.). Each package extends it. The web app uses project references
(`tsconfig.app.json` + `tsconfig.node.json`).

## Testing

Tests use [Vitest](https://vitest.dev). The web app uses `jsdom` + Testing Library.

```bash
pnpm test                          # all packages
pnpm --filter @luminotype/web test # web only
```

Current coverage lives in `apps/web/src/engine/`:

- `stats.test.ts` — WPM / accuracy / consistency / character grading (pure functions).
- `wordGenerator.test.ts` — word sampling, punctuation, and numbers.
- `useTypingEngine.test.tsx` — an integration test that drives the engine through real `keydown`
  events via `TypingArea` and asserts the result/persistence/restart behavior.

The API's `test` script passes when no test files are present (`--passWithNoTests`).

### Tips for engine tests

- `fireEvent.keyDown` wraps each event in a synchronous `act()`, so state flushes between
  keystrokes — drive input one character at a time rather than batching inside a single `act`.
- Zustand stores are module singletons; reset them in `beforeEach`
  (`useResultsStore.setState({ history: [] })`) so tests don't leak state into each other.

## Code style

ESLint (flat config in `eslint.config.js`) with the TypeScript and React Hooks plugins, plus
Prettier. Run `pnpm lint` before committing; `pnpm format` auto-fixes formatting.
