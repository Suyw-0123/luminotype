# Luminotype — Technical Wiki

Technical documentation for Luminotype, a fast, minimalist typing test web app.

This wiki describes how the system is built and how the pieces fit together. For a quick start,
see the repository [`README.md`](../../README.md).

## Contents

| Document                            | What it covers                                                          |
| ----------------------------------- | ----------------------------------------------------------------------- |
| [Architecture](./architecture.md)   | High-level system design, the monorepo layout, and request/data flow    |
| [Typing Engine](./typing-engine.md) | The performance-critical input loop, state machine, and stat math       |
| [Frontend](./frontend.md)           | React app structure, theming, state stores, and the scrolling word view |
| [API Reference](./api.md)           | HTTP endpoints, request/response shapes, and error behavior             |
| [Content corpus](./content.md)      | The JSON word lists & quotes and how to extend them                     |
| [Development](./development.md)     | Local setup, workspace scripts, and testing                             |
| [Deployment](./deployment.md)       | Cloudflare Pages, Docker Compose, and GHCR images                       |

## At a glance

- **Frontend** — React + Vite + TypeScript, Tailwind CSS (CSS-variable themes), Zustand, React Router
- **Backend** — Hono + TypeScript content API (word lists & quotes) over read-only bundled JSON
- **Monorepo** — pnpm workspaces: `apps/web`, `apps/api`, `packages/shared`
- **Deployment** — Cloudflare Pages (static frontend + Hono Pages Function) or Docker Compose

## Design principles

1. **Typing latency comes first.** The input loop is engineered so a keystroke re-renders only the
   active word, never the whole text. See [Typing Engine](./typing-engine.md).
2. **No account required.** All user data (settings, results history) lives in `localStorage`. The
   backend only serves shared content (word lists and quotes).
3. **One source of truth for types.** API DTOs and domain models live in `@luminotype/shared` and
   are imported by both the web and api apps.
