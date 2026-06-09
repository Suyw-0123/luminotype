import { useEffect, useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { fetchWords, fetchQuote } from '../lib/api';
import type { EngineConfig } from '../engine/useTypingEngine';
import { TypingArea } from './TypingArea';

/**
 * Loads the corpus (word pool / quote) for the active config, then renders the
 * typing area. A `key` derived from the loaded content remounts the engine when
 * the underlying text changes (new language, new quote, etc.).
 */
export function TypingTest() {
  const config = useConfigStore();
  const [pool, setPool] = useState<string[]>([]);
  const [quoteText, setQuoteText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Bumped to force a fresh quote / regeneration on demand.
  const [reloadKey, setReloadKey] = useState(0);

  const needsQuote = config.mode === 'quote';

  useEffect(() => {
    let cancelled = false;
    // Only block on the very first load; on a refresh keep the current text
    // visible until the new corpus arrives (no loading flash on Tab).
    setError(null);

    const load = async () => {
      try {
        const words = await fetchWords(config.language);
        if (cancelled) return;
        setPool(words);
        if (needsQuote) {
          const quote = await fetchQuote(config.language, config.quoteLength);
          if (cancelled) return;
          setQuoteText(quote.text);
        } else {
          setQuoteText(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load corpus');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [config.language, needsQuote, config.quoteLength, reloadKey]);

  if (loading) {
    return <p className="text-sub">loading…</p>;
  }
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-error">{error}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="self-start rounded bg-sub-alt px-4 py-2 text-text hover:bg-main hover:text-bg"
        >
          retry
        </button>
      </div>
    );
  }

  const engineConfig: EngineConfig = {
    mode: config.mode,
    time: config.time,
    wordCount: config.wordCount,
    punctuation: config.punctuation,
    numbers: config.numbers,
    language: config.language,
    pool,
    text: quoteText ?? undefined,
  };

  // Remount the engine whenever the core parameters or loaded content change.
  const engineKey = [
    config.mode,
    config.time,
    config.wordCount,
    config.language,
    config.punctuation,
    config.numbers,
    quoteText ?? '',
    reloadKey,
  ].join('|');

  return (
    <TypingArea
      key={engineKey}
      config={engineConfig}
      onRequestNewTest={() => setReloadKey((k) => k + 1)}
    />
  );
}
