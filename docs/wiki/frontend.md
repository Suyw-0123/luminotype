# Frontend

The frontend (`apps/web`) is a React 18 SPA built with Vite and TypeScript.

## Entry & routing

- `src/main.tsx` mounts `<App>` inside `BrowserRouter`.
- `src/App.tsx` defines the layout (a `Header` above a flex-column `main`) and routes:

| Route               | Page               | Purpose                                               |
| ------------------- | ------------------ | ----------------------------------------------------- |
| `/`                 | `TestPage`         | The typing test (config bar + typing area)            |
| `/settings`         | `SettingsPage`     | Theme, language, sound                                |
| `/stats`            | `StatsPage`        | Local results history (WPM chart + table)             |
| `/stats/:timestamp` | `ResultDetailPage` | Full detail for one result (looked up by `timestamp`) |
| `/about`            | `AboutPage`        | About the app                                         |

`App` also applies the active theme via `useEffect(() => applyTheme(theme), [theme])`.

## Directory map

```
src/
├── engine/        Typing engine (see typing-engine.md)
├── components/     UI building blocks
├── pages/          Route-level screens
├── store/          Zustand stores (persisted to localStorage)
├── themes/         Theme definitions + applyTheme()
├── lib/            API client
└── test/           Test setup
```

### Key components

- **`Word`** — a single word as per-character `<span>`s; `React.memo`-ized and marked `data-active`.
- **`WordsDisplay`** — the scrolling word viewport (see below).
- **`TypingArea`** — consumes `useTypingEngine`, attaches the global `keydown` listener, renders the
  stat bar / words / results, and persists each finished `TestResult` to the store.
- **`TypingTest`** — loads the corpus for the active config and builds the `EngineConfig`. It uses a
  `key` derived from the config + loaded text so the engine **remounts** cleanly when the test
  parameters change.
- **`ConfigBar`** — mode and per-mode option selectors (time/word-count/quote-length, punctuation,
  numbers), bound to the `configStore`.
- **`StatBar`** / **`Results`** — live progress and the final score screen. `Results` also renders a
  `TestWpmGraph` of the just-finished test.
- **`WpmChart`** — a dependency-free SVG line chart of WPM **across tests**, shown on `StatsPage`. It
  scales to its container via a fixed `viewBox` and re-themes through `currentColor` (no charting
  library). Each point is clickable, navigating to that result's detail page.
- **`TestWpmGraph`** — same SVG/theming approach, but plots WPM **within a single test**: the
  per-second `wpmSeries` carried on a `TestResult`. Shown on the `Results` screen and the result
  detail page. Needs ≥ 2 samples (a test lasting ≳ 2 s), otherwise renders nothing.

## State management (Zustand)

Two stores, both using the `persist` middleware so they survive reloads. Note the runtime typing
state is deliberately **not** in Zustand — it lives inside the engine to avoid broadcasting renders
on every keystroke.

- **`configStore`** (`localStorage` key `luminotype-config`) — `mode`, `time`, `wordCount`,
  `quoteLength`, `language`, `punctuation`, `numbers`, `theme`, `sound`, with their setters.
- **`resultsStore`** (`localStorage` key `luminotype-results`) — `history: TestResult[]` capped at
  `MAX_HISTORY = 200` (newest-first), with `addResult`, `removeResult(timestamp)` (delete a single
  result), and `clearHistory`. `StatsPage` shows a WPM trend chart over the full history, then a
  paginated table (10 per page); each row is clickable (→ `/stats/:timestamp`, the per-result detail
  page) and exposes per-row delete via `removeResult`.

## Theming

Themes are pure CSS-variable swaps, defined in `src/themes/themes.ts`.

- Each `Theme` declares colors (`bg`, `main`, `caret`, `sub`, `subAlt`, `text`, `error`,
  `errorExtra`).
- `applyTheme(id)` writes those values as CSS custom properties (`--bg-color`, …) on
  `document.documentElement`.
- `tailwind.config.ts` maps Tailwind color names to those variables (e.g. `bg: 'var(--bg-color)'`),
  so every utility class re-themes instantly with **no re-render** — only the CSS variables change.
- Built-in themes: `light` (default, `DEFAULT_THEME_ID`), `dark`, `nord`, `dracula`, `matrix`,
  `gruvbox`, `solarized light`.
  `index.css` seeds the `:root` fallback to the light palette for the first paint.

Adding a theme = appending one entry to the `themes` array.

## The scrolling word view

`WordsDisplay` keeps the typing area a **fixed height** — `visibleLines` lines tall (from
`configStore`, default 3, selectable in settings) — and scrolls the text vertically to follow the
cursor, instead of letting the page grow and forcing the user to scroll.

- The outer container is fixed-height with `overflow: hidden`.
- The inner word container is translated with `translateY(-offset)` and a short CSS transition.
- A `useLayoutEffect` keyed on `wordIndex` measures the active word (`[data-active="true"]`) and sets
  the offset so the active line stays on the **second visible line** (one line of context above).
- Because the active word's vertical position only changes when it wraps to a new line, this does not
  run on every keystroke. `WINDOW = 120` bounds how many upcoming words are rendered.

## API client

`src/lib/api.ts` wraps `fetch` against `import.meta.env.VITE_API_BASE ?? '/api'`:

- `fetchLanguages()` → `Language[]`
- `fetchWords(language, limit = 1000)` → `string[]` (in-memory cached per `language:limit`)
- `fetchQuote(language, length?)` → `Quote` (one random quote; still used for one-off picks)
- `fetchQuotes(language, length?)` → `Quote[]` (the full filtered pool, for the shuffle queue)

## Quote selection (shuffle queue)

In quote mode, pressing Tab requests a new quote. Rather than independent random draws (which can
repeat back-to-back), `src/lib/quoteQueue.ts` treats the pool as a **shuffle bag**:

- On first use it calls `fetchQuotes` once and Fisher–Yates-shuffles an index order. Each Tab walks
  that order, so **every quote is shown once before any repeat**.
- When a round is exhausted it reshuffles; if the new round would open with the quote that just
  ended the previous one, it swaps it forward so **Tab never immediately repeats**.
- State is a module-level singleton keyed by `lang:length`, so it survives `TypingArea` remounting on
  each Tab and any route navigation. The fetched pool is cached there too. (It is not persisted, so a
  full page reload starts a fresh shuffle.)

`TypingTest` calls `nextQuote(language, length)` for both the initial quote and every Tab refresh.

## Build

`pnpm --filter @luminotype/web build` runs `tsc -b` (type check across project references) then
`vite build`, emitting static assets to `apps/web/dist`. In development, `vite` serves on port 5173
and proxies `/api` to `http://localhost:3001`.
