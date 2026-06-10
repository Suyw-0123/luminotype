# Luminotype

A fast, minimalist typing test web app. Pick a mode, start typing, and your speed (wpm), accuracy,
raw speed, and consistency are measured in real time. Results and settings are stored locally in
your browser — no account required.

![play_demo](luminotype-demo.gif)

Modes: `quote`, `time`, `words`, and `zen` (free typing). Press **Tab** to restart, **Enter** to
finish a zen run.

## Quick start

Requires Node.js >= 20 and pnpm 10 (`corepack enable`). There's no database — the word lists and
quotes are read-only JSON bundled at build time.

```bash
pnpm install

# Run web (http://localhost:5173) + api (http://localhost:3001) together
pnpm dev
```

Or run the whole stack in containers:

```bash
docker compose up --build  # then open http://localhost:8080
```

## Deployment

The recommended target is **Cloudflare Pages**: the static frontend plus the Hono API as a Pages
Function, with automatic CI/CD on every `git push`. Docker Compose and prebuilt GHCR images are
available for self-hosting. See [Deployment](./docs/wiki/deployment.md).

## Documentation

Full technical documentation lives in the [`docs/wiki`](./docs/wiki/README.md):

| Document                                      | What it covers                                              |
| --------------------------------------------- | ----------------------------------------------------------- |
| [Architecture](./docs/wiki/architecture.md)   | System design, monorepo layout, and request/data flow       |
| [Typing Engine](./docs/wiki/typing-engine.md) | The performance-critical input loop, state machine, stats   |
| [Frontend](./docs/wiki/frontend.md)           | React structure, theming, state stores, scrolling word view |
| [API Reference](./docs/wiki/api.md)           | HTTP endpoints, request/response shapes, error behavior     |
| [Content corpus](./docs/wiki/content.md)      | The JSON word lists & quotes and how to extend them         |
| [Development](./docs/wiki/development.md)     | Local setup, workspace scripts, and testing                 |
| [Deployment](./docs/wiki/deployment.md)       | Cloudflare Pages, Docker Compose, and GHCR images           |

## License

See [LICENSE](./LICENSE).
