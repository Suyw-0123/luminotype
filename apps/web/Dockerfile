# Build context is the repository root (see docker-compose.yml).
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app

# All workspace manifests so pnpm can resolve and link workspace packages.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/web apps/web

RUN pnpm --filter @luminotype/shared build \
  && pnpm --filter @luminotype/web build

# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
