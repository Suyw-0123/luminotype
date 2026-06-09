# API Reference

The API (`apps/api`) is a [Hono](https://hono.dev) server. It serves typing content — languages,
word lists, and quotes — and holds no user state.

- Base path: all routes are mounted under `/api`.
- Port: `PORT` env var, default `3001`.
- Middleware: request `logger`; `cors()` on `/api/*`.
- Responses are JSON; types come from `@luminotype/shared`.

In production the frontend reaches these via the nginx reverse proxy at the same origin (`/api/...`).

## Endpoints

### `GET /api/health`

Liveness check (used by tooling / smoke tests).

```json
{ "status": "ok" }
```

### `GET /api/languages`

List available languages, ordered by name.

**Response** — `Language[]`

```json
[
  { "code": "english", "name": "English" },
  { "code": "english_1k", "name": "English 1k" }
]
```

### `GET /api/languages/:lang/words`

Frequency-ordered word list for a language.

**Path params**

- `lang` — language code (e.g. `english`).

**Query params**

- `limit` — max words to return. Default `1000`, capped at `5000`.

**Response** — `WordListResponse`

```json
{ "language": "english", "words": ["the", "be", "of", "and", "a"] }
```

**Errors**

- `404` `{ "error": "Unknown language: <lang>" }` if the language does not exist.

### `GET /api/quotes`

A single random quote, optionally filtered by length.

**Query params**

- `lang` — language code. Default `english`.
- `length` — one of `short` | `medium` | `long` | `thicc`. Omit for any length.

**Response** — `QuoteResponse`

```json
{
  "quote": {
    "id": 12,
    "language": "english",
    "text": "The only way to do great work is to love what you do.",
    "source": "Steve Jobs",
    "length": "short"
  }
}
```

Randomization is done in SQL (`order by random() limit 1`).

**Errors**

- `404` `{ "error": "No quote found for the given filters" }` if nothing matches.

## Types

All request/response shapes are defined in `packages/shared/src/index.ts` and imported by both the
API routes and the web client, e.g. `Language`, `WordListResponse`, `Quote`, `QuoteResponse`,
`QuoteLength`, and `ApiError`.

## Adding an endpoint

1. Add/extend the DTO in `@luminotype/shared` and rebuild it (`pnpm --filter @luminotype/shared
build`).
2. Create a route module under `apps/api/src/routes/` returning the typed JSON.
3. Mount it in `apps/api/src/index.ts` under the `/api` router.
4. Consume it from `apps/web/src/lib/api.ts`.
