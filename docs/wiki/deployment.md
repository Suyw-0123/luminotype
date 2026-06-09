# Deployment

The full stack runs via Docker Compose: PostgreSQL, the API, and an nginx container serving the built
frontend and reverse-proxying the API.

## Topology

```
        host:${WEB_PORT:-8080}
                │
                ▼
        ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
        │   web (nginx) │ /api ─▶ │   api (Node)  │ ─SQL─▶ │  db (Postgres)│
        │  static SPA   │◀────── │   Hono :3001  │◀────── │     :5432     │
        └───────────────┘        └───────────────┘        └───────────────┘
```

- **db** — `postgres:16-alpine` with a named volume `db-data` and a `pg_isready` healthcheck. Port
  `5432` is published so local `pnpm dev`/`pnpm seed` can reach it too.
- **api** — built from `apps/api/Dockerfile`. On boot it runs migrations, seeds (idempotently), then
  serves. Only `expose`d on the internal network (not published).
- **web** — built from `apps/web/Dockerfile`. nginx serves the static build and proxies `/api` to
  `api:3001`. Published on `${WEB_PORT:-8080}`.

## Quick start

```bash
cp .env.example .env      # adjust credentials/ports if desired
docker compose up --build
```

Then open <http://localhost:8080>.

## Environment variables

From `.env.example`:

| Variable                                              | Purpose                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials                                       |
| `DATABASE_URL`                                        | Connection string the API uses (`@db:5432` inside Compose) |
| `WEB_PORT`                                            | Host port for the web container (default `8080`)           |
| `POSTGRES_PORT`                                       | Host port for Postgres (default `5432`)                    |

## Container build details

Both Dockerfiles use the **repository root** as the build context (so workspace packages are
available) and are multi-stage:

- **API** — a build stage installs the workspace, builds `@luminotype/shared` and `@luminotype/api`,
  and copies the seed `data/` into `dist/`. The runtime stage carries the built output and
  `node_modules`, then on start runs:
  `node dist/db/migrate.js && node dist/seed/index.js && node dist/index.js`.
- **Web** — a build stage produces the Vite static bundle; the runtime stage is `nginx:alpine` with
  `apps/web/nginx.conf` and the `dist/` assets.

> Both Dockerfiles copy **all** workspace `package.json` manifests before `pnpm install` so pnpm can
> resolve and link the `@luminotype/shared` workspace dependency. `.dockerignore` excludes
> `*.tsbuildinfo` to avoid stale incremental build state leaking into images.

## nginx

`apps/web/nginx.conf`:

- `location /api/` → `proxy_pass http://api:3001` (forwarding standard `X-Forwarded-*` headers).
- `location /` → `try_files $uri $uri/ /index.html` for SPA client-side routing.

## Operations

- **Apply new seed content** — `docker compose up -d --build api` (the API re-seeds on boot).
- **Reset the database** — `docker compose down -v` removes the `db-data` volume.
- **Logs** — `docker compose logs -f api` (the API logs migration/seed progress on startup).

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
