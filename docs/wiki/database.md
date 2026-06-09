# Database

PostgreSQL accessed through [Drizzle ORM](https://orm.drizzle.team) on the `postgres-js` driver.
All database code lives in `apps/api/src/db/` and `apps/api/src/seed/`.

## Connection

`apps/api/src/db/client.ts` creates a pooled connection and the Drizzle instance:

```ts
const connectionString =
  process.env.DATABASE_URL ?? 'postgres://luminotype:luminotype@localhost:5432/luminotype';
export const queryClient = postgres(connectionString, { max: 10 });
export const db = drizzle(queryClient, { schema });
```

`DATABASE_URL` is the single configuration knob (host `db` inside Docker, `localhost` for local dev).

## Schema

Defined in `apps/api/src/db/schema.ts`.

### `languages`

| Column | Type   | Notes                        |
| ------ | ------ | ---------------------------- |
| `code` | `text` | Primary key (e.g. `english`) |
| `name` | `text` | Display name                 |

### `words`

| Column           | Type      | Notes                                  |
| ---------------- | --------- | -------------------------------------- |
| `id`             | `serial`  | Primary key                            |
| `language_code`  | `text`    | FK → `languages.code` (cascade delete) |
| `word`           | `text`    | The word                               |
| `frequency_rank` | `integer` | 1-based rank; lower = more common      |

Indexes:

- `words_lang_rank_idx` on `(language_code, frequency_rank)` — powers the ordered word query.
- `words_lang_word_uniq` unique on `(language_code, word)`.

### `quotes`

| Column            | Type     | Notes                                    |
| ----------------- | -------- | ---------------------------------------- |
| `id`              | `serial` | Primary key                              |
| `language_code`   | `text`   | FK → `languages.code` (cascade delete)   |
| `text`            | `text`   | The quote text                           |
| `source`          | `text`   | Author/source, nullable                  |
| `length_category` | `text`   | `short` \| `medium` \| `long` \| `thicc` |

Index:

- `quotes_lang_len_idx` on `(language_code, length_category)` — powers the filtered random query.

## Migrations

Drizzle Kit, configured in `apps/api/drizzle.config.ts` (output dir `apps/api/drizzle`).

```bash
pnpm db:generate   # diff schema.ts → new SQL migration in apps/api/drizzle/
pnpm db:migrate    # apply pending migrations (runs src/db/migrate.ts)
```

`migrate.ts` uses a dedicated single connection and Drizzle's `migrate()` against the `./drizzle`
folder. Generated migration SQL is committed to the repo.

## Seeding

`apps/api/src/seed/index.ts` loads JSON from `apps/api/src/seed/data/` and is **idempotent** — safe
to run repeatedly:

- `languages` — inserted with `onConflictDoNothing`.
- `words` — deleted then re-inserted per language (rank = array index + 1).
- `quotes` — English quotes deleted then re-inserted.

```bash
pnpm seed
```

### Seed data files

| File                       | Contents                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| `data/languages.json`      | Language codes/names                                                       |
| `data/english.json`        | Ordered array of common English words (used by `english` and `english_1k`) |
| `data/quotes.english.json` | `{ text, source, length }[]`                                               |

`WORD_SOURCES` in the seed maps language codes to their word file. Quote length buckets are roughly:
`short` < ~100 chars, `medium` ~100–230, `long` ~230–400, `thicc` > ~600.

### Adding content

- **More words** — edit `data/english.json` (or add a new language file + entry in
  `languages.json` and `WORD_SOURCES`), then `pnpm seed`.
- **More quotes** — append objects to `data/quotes.english.json`, then `pnpm seed`. In a Docker
  deployment the API container re-seeds on every boot, so `docker compose up -d --build api` applies
  them.

## Notes on ordering / randomization

- Word queries are deterministic: `order by frequency_rank asc limit :limit`. The frontend samples
  randomly from this pool client-side.
- Quote selection is random in SQL (`order by random() limit 1`), filtered by language and optional
  length.
