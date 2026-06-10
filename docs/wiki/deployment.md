# Deployment

Luminotype's content API is **read-only JSON** (word lists + quotes) bundled at build time — there is
no database. That makes it cheap to host two ways:

1. **Cloudflare Pages** (recommended) — static frontend + the Hono API as a Pages Function. One
   project, automatic CI/CD on `git push`, free tier, nothing to operate.
2. **Docker Compose** — nginx + the Node API, for self-hosting.

Both serve the same Hono app (`createApiApp()` in `apps/api/src/app.ts`): the Node entry
(`src/index.ts`) runs it locally and in containers, and `functions/api/[[route]].ts` runs it on
Cloudflare. The frontend always calls the same `/api/*` paths.

## Cloudflare Pages (recommended)

### How it fits together

```
        *.pages.dev (single origin)
                │
       ┌────────┴─────────┐
       ▼                  ▼
  static assets     functions/api/[[route]].ts
  apps/web/dist     Hono app → bundled JSON corpus
```

- Requests to `/api/*` hit the Pages Function (`functions/api/[[route]].ts`), which serves the Hono
  app reading the bundled JSON — no database, no cold-start DB connection.
- Everything else serves the static Vite bundle. `apps/web/public/_redirects` (`/* /index.html 200`)
  gives the SPA client-side routing; the `/api/*` Function takes precedence over that rule.

### One-time setup (Pages dashboard → "Connect to Git")

After connecting the GitHub repo, set:

| Setting                | Value                                                                           |
| ---------------------- | ------------------------------------------------------------------------------- |
| Production branch      | `main`                                                                          |
| Root directory         | _(leave empty — repo root)_                                                     |
| Build command          | `pnpm --filter @luminotype/shared build && pnpm --filter @luminotype/web build` |
| Build output directory | `apps/web/dist`                                                                 |

Cloudflare auto-detects pnpm from the lockfile and runs `pnpm install` first. `.node-version` (`22`)
pins the Node version; `wrangler.toml` pins `compatibility_date` and the output dir.

No environment variables are required: the frontend's `VITE_API_BASE` defaults to `/api`, which is
same-origin with the Function.

### CI/CD

Once connected, every push to `main` triggers a [Pages build](https://developers.cloudflare.com/workers/ci-cd/builds/)
and deploy; pull requests get preview deployments automatically. To deploy from the CLI instead:

```bash
pnpm --filter @luminotype/shared build && pnpm --filter @luminotype/web build
npx wrangler pages deploy
```

### Why the Function lives at the repo root

Pages looks for the `functions/` directory at the **root directory** of the build. Because this is a
pnpm monorepo, the root directory is the repo root (so workspace installs and the
`@luminotype/api` workspace import resolve), and the Function therefore lives at
`functions/api/[[route]].ts`. The catch-all `[[route]]` matches every `/api/*` path, including nested
ones like `/api/languages/english/words`.

## Docker Compose (self-hosting)

### Topology

```
        host:${WEB_PORT:-8080}
                │
                ▼
        ┌───────────────┐        ┌───────────────┐
        │   web (nginx) │ /api ─▶ │   api (Node)  │
        │  static SPA   │◀────── │   Hono :3001  │
        └───────────────┘        └───────────────┘
```

- **api** — built from `apps/api/Dockerfile`. Serves the Hono app from bundled JSON; only `expose`d
  on the internal network (not published).
- **web** — built from `apps/web/Dockerfile`. nginx serves the static build and proxies `/api` to
  `api:3001`. Published on `${WEB_PORT:-8080}`.

### Quick start

```bash
cp .env.example .env      # optional: change WEB_PORT
docker compose up --build
```

Then open <http://localhost:8080>.

### Environment variables

From `.env.example`:

| Variable   | Purpose                                          |
| ---------- | ------------------------------------------------ |
| `WEB_PORT` | Host port for the web container (default `8080`) |

### Container build details

Both Dockerfiles use the **repository root** as the build context (so workspace packages are
available) and are multi-stage:

- **API** — a build stage installs the workspace, builds `@luminotype/shared` and `@luminotype/api`,
  and copies the JSON corpus (`src/data/*.json`) into `dist/data/`. The runtime stage carries the
  built output and `node_modules`, then starts with `node dist/index.js`.
- **Web** — a build stage produces the Vite static bundle; the runtime stage is `nginx:alpine` with
  `apps/web/nginx.conf` and the `dist/` assets.

> Both Dockerfiles copy **all** workspace `package.json` manifests before `pnpm install` so pnpm can
> resolve and link the `@luminotype/shared` workspace dependency. `.dockerignore` excludes
> `*.tsbuildinfo` to avoid stale incremental build state leaking into images.

### nginx

`apps/web/nginx.conf`:

- `location /api/` → `proxy_pass http://api:3001` (forwarding standard `X-Forwarded-*` headers).
- `location /` → `try_files $uri $uri/ /index.html` for SPA client-side routing.

### Operations

- **Apply new corpus content** — `docker compose up -d --build api` (the JSON is baked into the image
  at build time).
- **Logs** — `docker compose logs -f api`.

## Prebuilt images (GHCR)

`.github/workflows/publish-images.yml` builds and pushes both images to the GitHub Container
Registry on every push to `main`, on `v*` tags, and on manual dispatch (pull requests build only,
without pushing):

| Image                            | Built from            |
| -------------------------------- | --------------------- |
| `ghcr.io/<owner>/luminotype-api` | `apps/api/Dockerfile` |
| `ghcr.io/<owner>/luminotype-web` | `apps/web/Dockerfile` |

- **Tags** — branch name and a `sha-<commit>` tag on every push; `latest` on the default branch;
  semver tags (`1.2.3`, `1.2`) when a `v*` tag is pushed. The image path is lowercased automatically.
- **Auth** — uses the built-in `GITHUB_TOKEN`; no secrets to configure. The job requests
  `packages: write` plus `attestations: write` / `id-token: write` for build provenance.
- **Provenance** — each push generates a signed [build attestation](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds)
  pushed alongside the image.
- **Caching** — layers are cached per image via GitHub Actions cache (`type=gha`).

After the first successful run the package is **private** by default; make it public under
**repo → Packages → package settings → Change visibility** if you want anonymous `docker pull`.

Pull and run a published image directly:

```bash
docker pull ghcr.io/<owner>/luminotype-web:latest
docker pull ghcr.io/<owner>/luminotype-api:latest
```
