# Build context is the repository root (see docker-compose.yml).
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

# Workspace manifests first for better layer caching.
# All workspace manifests so pnpm can resolve and link workspace packages.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

# Source.
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @luminotype/shared build \
  && pnpm --filter @luminotype/api build

# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production

# Bring over installed deps and build output (workspace symlinks intact).
COPY --from=build /app /app

WORKDIR /app/apps/api
EXPOSE 3001

# The corpus is bundled JSON — no database, no migrations. Just serve.
CMD ["node", "dist/index.js"]
