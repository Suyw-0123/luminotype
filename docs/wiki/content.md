# Content corpus

Luminotype's word lists and quotes are **read-only JSON, bundled at build time** — there is no
database. The corpus lives in `apps/api/src/data/` and is read by a small accessor module
(`apps/api/src/data/index.ts`) that the Hono routes call directly. The same code runs on Node
(local dev / Docker) and on Cloudflare Pages Functions.

## Data layer

`apps/api/src/data/index.ts` imports the JSON and exposes three things:

```ts
export const languages: Language[]; // the languages list
export function getWords(lang, limit): string[] | null; // frequency-ordered slice
export function getRandomQuote(lang, length?): Quote | null; // random, optional length filter
```

- **`getWords`** returns the first `limit` words of a language's list (which is stored in frequency
  order), or `null` for an unknown language. The frontend samples randomly from this pool client-side.
- **`getRandomQuote`** filters by language and optional length, then picks one at random. The quote's
  `id` is its index in the full language pool, so it's stable across requests.

## Data files

| File                       | Shape                        | Contents                                |
| -------------------------- | ---------------------------- | --------------------------------------- |
| `data/languages.json`      | `{ code, name }[]`           | Available languages                     |
| `data/english.json`        | `string[]`                   | Common English words, frequency-ordered |
| `data/quotes.english.json` | `{ text, source, length }[]` | English quotes                          |

Quote length buckets are roughly: `short` < ~100 chars, `medium` ~100–230, `long` ~230–400,
`thicc` > ~600.

## Adding content

- **More words** — edit `data/english.json` (keep it frequency-ordered), or add a new language: drop
  a `data/<lang>.json` word file, add an entry to `data/languages.json`, and register it in the
  `WORDS`/`QUOTES` maps in `data/index.ts`.
- **More quotes** — append objects to `data/quotes.english.json`.

No seeding or migration step is needed — the JSON is the source of truth. Changes take effect:

- **locally** — immediately under `pnpm dev` (tsx watches the source);
- **Cloudflare Pages** — on the next `git push` (the JSON is bundled into the Function);
- **Docker** — on `docker compose up -d --build api` (the JSON is copied into the image).

## How it's bundled

- **Node / Docker** — `tsc` compiles `data/index.ts`; the Dockerfile copies `src/data/*.json` into
  `dist/data/` so the compiled `import … with { type: 'json' }` resolves at runtime.
- **Cloudflare Pages** — the Function imports `@luminotype/api/app`, and esbuild inlines the imported
  JSON into the bundle. Total corpus is ~34 KB, so this is negligible.
