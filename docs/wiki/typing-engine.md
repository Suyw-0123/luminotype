# Typing Engine

The typing engine is the heart of the app and the most performance-sensitive code. It lives in
`apps/web/src/engine/`:

- `useTypingEngine.ts` — the stateful hook (state machine, input handling, timing)
- `stats.ts` — pure functions for grading and statistics
- `wordGenerator.ts` — builds the target word list from a pool

## Performance goal

A keystroke must update the screen with near-zero latency, even in long tests. The guiding rule:

> **A keystroke re-renders only the active word, never the entire text.**

This is achieved by:

1. **Generating the target once.** The word list for a test is computed up front and does not change
   while typing (time mode only _appends_ more words, never rewrites existing ones).
2. **Memoizing each word.** `components/Word.tsx` is wrapped in `React.memo`. Only the active word's
   `typed` prop changes on each keystroke, so only that one component re-renders.
3. **Decoupling timers from typing.** Live WPM/timer updates and consistency sampling run on a
   200 ms interval (`TICK_MS`), independent of the keystroke path. The per-second display refreshing
   is cheap and does not touch the per-character render path.

## State machine

```
idle ──first keystroke──▶ running ──time up / last word──▶ finished
  ▲                                                            │
  └────────────────────────── Tab (restart) ──────────────────┘
```

`EngineStatus` is `'idle' | 'running' | 'finished'`. The first printable keystroke calls `start()`,
which records `performance.now()` and starts the interval. `finish()` stops the interval and computes
the final `TestResult`.

## State vs. refs

React state drives rendering; refs feed the interval and event handlers the _latest_ values without
forcing renders.

| React state    | Purpose                                     |
| -------------- | ------------------------------------------- |
| `words`        | Target words (may grow in time mode)        |
| `typedWords`   | Committed words (one per finished word)     |
| `currentInput` | The word currently being typed              |
| `status`       | State machine status                        |
| `result`       | Final `TestResult` once finished            |
| `live`         | `{ wpm, timer }` for the on-screen stat bar |

| Ref                               | Purpose                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `stateRef`                        | Mirror of the above state, read by the interval and key handler                |
| `configRef`                       | Latest `EngineConfig`                                                          |
| `startRef`                        | `performance.now()` at test start                                              |
| `samplesRef`                      | Per-second WPM samples (for consistency; also saved as `TestResult.wpmSeries`) |
| `lastSecondRef`, `lastCorrectRef` | Bookkeeping for per-second sampling                                            |

`wordIndex` is derived as `typedWords.length` (the active word is `words[wordIndex]`).

## Input handling (`handleKeyDown`)

Attached to `window` by `TypingArea`, so the user can start typing immediately without focusing a
field.

- **Tab** — `preventDefault` and `restart()`.
- **Backspace** —
  - within a word: delete the last character (or the whole word with Ctrl/Cmd);
  - at the start of a word: step back into the _previous_ word **only if it was typed incorrectly**
    (a correct word is locked, matching common typing-test behavior).
- **Enter** — finishes a running **zen** test (zen has no other completion condition).
- **Space** — commit the current word into `typedWords`. In time mode the buffer is topped up
  (`generateWords` appends a batch) when fewer than `TIME_WORDS_REFILL_THRESHOLD` words remain ahead.
  In finite modes, committing the last word triggers `finish()`.
- **Printable character** — append to `currentInput`. In finite modes (`words`/`quote`), typing the
  final word exactly auto-commits and finishes the test (no trailing space needed).
- Modifier combos (Ctrl/Cmd + key, except Backspace) and non-character keys are ignored so browser
  shortcuts still work.

## Modes

`EngineConfig.mode` is one of `time`, `words`, `quote`, `zen` (see `@luminotype/shared`):

- **time** — generate an initial batch (`INITIAL_TIME_WORDS = 60`) and append more as needed; finish
  when elapsed ≥ `time` seconds.
- **words** — generate exactly `wordCount` words; finish on the last word.
- **quote** — split a fetched quote `text` into words; finish on the last word.
- **zen** — free typing with no target text. The user types anything (every character counts as
  correct) until they press **Enter** to finish. `WordsDisplay` renders this in "free mode".

## Statistics (`stats.ts`)

All stat functions are pure and unit-tested (`stats.test.ts`).

- **WPM** — `calculateWpm(chars, ms)` = `(chars / 5) / minutes`. The "5 characters = 1 word"
  convention. Final WPM uses correct characters; **raw** WPM uses all keystrokes.
- **Accuracy** — `calculateAccuracy(correct, total)` = `correct / total × 100`.
- **Consistency** — `calculateConsistency(perSecondWpm)` derives the coefficient of variation (CV)
  of the per-second WPM samples and returns `(1 − CV) × 100`, clamped to `0..100`. Steady typing →
  high consistency.
- **Character grading** — `gradeChars({ words, typedWords, activeInput })` returns `CharCounts`:
  - `correct` / `incorrect` for compared characters, plus one correct character per committed
    word boundary (the space);
  - `extra` for characters typed past a word's end;
  - `missed` for target characters in a _committed_ word that were never typed. The active,
    incomplete word never contributes `missed`.

## Sequence of a single keystroke

```
keydown(window)
  └▶ handleKeyDown reads stateRef (latest committed state)
       ├─ printable ─▶ setCurrentInput(prev + ch)
       │                  └▶ only the active <Word> re-renders (memoized siblings skip)
       └─ space ─────▶ setTypedWords([...prev, input]); setCurrentInput('')
```

The 200 ms interval, running in parallel, recomputes live WPM and pushes a consistency sample once
per whole second — never blocking the keystroke path.
