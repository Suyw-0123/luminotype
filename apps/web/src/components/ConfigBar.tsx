import { useConfigStore } from '../store/configStore';
import {
  TIME_OPTIONS,
  WORD_COUNT_OPTIONS,
  QUOTE_LENGTHS,
  type TestMode,
  type QuoteLength,
} from '@luminotype/shared';

const MODES: TestMode[] = ['quote', 'time', 'words', 'zen'];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-sm transition-colors ${
        active ? 'text-main' : 'text-sub hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

export function ConfigBar() {
  const c = useConfigStore();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded bg-sub-alt px-4 py-2 text-text">
      {/* Punctuation/numbers only affect generated words, not fixed quotes. */}
      {c.mode !== 'quote' && (
        <>
          <div className="flex items-center gap-1">
            <Pill active={c.punctuation} onClick={c.togglePunctuation}>
              @ punctuation
            </Pill>
            <Pill active={c.numbers} onClick={c.toggleNumbers}>
              # numbers
            </Pill>
          </div>

          <span className="text-sub">|</span>
        </>
      )}

      <div className="flex items-center gap-1">
        {MODES.map((m) => (
          <Pill key={m} active={c.mode === m} onClick={() => c.setMode(m)}>
            {m}
          </Pill>
        ))}
      </div>

      <span className="text-sub">|</span>

      <div className="flex items-center gap-1">
        {c.mode === 'time' &&
          TIME_OPTIONS.map((t) => (
            <Pill key={t} active={c.time === t} onClick={() => c.setTime(t)}>
              {t}
            </Pill>
          ))}
        {c.mode === 'words' &&
          WORD_COUNT_OPTIONS.map((w) => (
            <Pill key={w} active={c.wordCount === w} onClick={() => c.setWordCount(w)}>
              {w}
            </Pill>
          ))}
        {c.mode === 'quote' &&
          QUOTE_LENGTHS.map((q) => (
            <Pill
              key={q}
              active={c.quoteLength === q}
              onClick={() => c.setQuoteLength(q as QuoteLength)}
            >
              {q}
            </Pill>
          ))}
        {c.mode === 'zen' && <span className="text-sm text-sub">zen mode</span>}
      </div>
    </div>
  );
}
