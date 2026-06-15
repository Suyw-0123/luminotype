# Content corpus

Luminotype's word lists and quotes are **read-only data, bundled at build time** — there is no
database. The corpus lives in `apps/api/src/data/` as plain TS modules (`export default [...]`) and is
read by a small accessor module (`apps/api/src/data/index.ts`) that the Hono routes call directly. The
same code runs on Node (local dev / Docker) and on Cloudflare Pages Functions.

> The data is stored as `.ts` rather than `.json` on purpose: importing JSON needs the
> `with { type: 'json' }` import attribute, which not every bundler supports (notably the esbuild
> version behind Cloudflare Pages Functions). Plain TS modules bundle everywhere with no attributes.

## Data layer

`apps/api/src/data/index.ts` imports the data modules and exposes:

```ts
export const languages: Language[]; // the languages list
export function getWords(lang, limit): string[] | null; // frequency-ordered slice
export function getRandomQuote(lang, length?): Quote | null; // random, optional length filter
export function getQuotes(lang, length?): Quote[] | null; // full pool, optional length filter
```

- **`getWords`** returns the first `limit` words of a language's list (which is stored in frequency
  order), or `null` for an unknown language. The frontend samples randomly from this pool client-side.
- **`getRandomQuote`** filters by language and optional length, then picks one at random. The quote's
  `id` is its index in the full language pool, so it's stable across requests.
- **`getQuotes`** returns the whole filtered pool (each quote carrying the same stable `id`). The
  frontend uses it to drive a client-side shuffle queue — see
  [frontend.md](frontend.md#quote-selection-shuffle-queue).

## Data files

| File                     | `export default` shape       | Contents                                |
| ------------------------ | ---------------------------- | --------------------------------------- |
| `data/languages.ts`      | `{ code, name }[]`           | Available languages                     |
| `data/english.ts`        | `string[]`                   | Common English words, frequency-ordered |
| `data/quotes.english.ts` | `{ text, source, length }[]` | English quotes                          |

Quote length buckets are roughly: `short` < ~100 chars, `medium` ~100–230, `long` ~230–400,
`thicc` the longest passages (currently ~450–700). The bucket is a hand-set `length` field on each
quote, not computed — pick the bucket that matches a quote's size when adding one.

## Adding content

- **More words** — edit the array in `data/english.ts` (keep it frequency-ordered), or add a new
  language: drop a `data/<lang>.ts` word module, add an entry to `data/languages.ts`, and register it
  in the `WORDS`/`QUOTES` maps in `data/index.ts`.
- **More quotes** — append objects to the array in `data/quotes.english.ts`.

No seeding or migration step is needed — the modules are the source of truth. Changes take effect:

- **locally** — immediately under `pnpm dev` (tsx watches the source);
- **Cloudflare Pages** — on the next `git push` (the data is bundled into the Function);
- **Docker** — on `docker compose up -d --build api` (the data is compiled into the image).

## How it's bundled

- **Node / Docker** — `tsc` compiles `data/*.ts` to `dist/data/*.js`, so the imports resolve at
  runtime with no extra copy step.
- **Cloudflare Pages** — the Function imports `@luminotype/api/app`, and esbuild inlines the imported
  data into the bundle. Total corpus is ~50 KB, so this is negligible.
