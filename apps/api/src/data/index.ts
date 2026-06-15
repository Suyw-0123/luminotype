import type { Language, Quote, QuoteLength } from '@luminotype/shared';
import languagesData from './languages.js';
import englishWords from './english.js';
import englishQuotes from './quotes.english.js';

/**
 * Static content layer. The corpus is read-only data bundled at build time as
 * plain TS modules (no JSON import attributes — those aren't supported by every
 * bundler), so the same code runs unchanged on Node (local dev / Docker) and on
 * Cloudflare Pages Functions. No database required.
 */

export const languages: Language[] = languagesData;

const WORDS: Record<string, readonly string[]> = {
  english: englishWords,
};

interface RawQuote {
  text: string;
  source: string | null;
  length: string;
}

const QUOTES: Record<string, readonly RawQuote[]> = {
  english: englishQuotes as RawQuote[],
};

/** Frequency-ordered word list for a language, capped at `limit`. Null if unknown. */
export function getWords(lang: string, limit: number): string[] | null {
  const pool = WORDS[lang];
  if (!pool) return null;
  return pool.slice(0, limit);
}

function toQuote(lang: string, pool: readonly RawQuote[], raw: RawQuote): Quote {
  return {
    // Position in the full language pool — stable across requests.
    id: pool.indexOf(raw),
    language: lang,
    text: raw.text,
    source: raw.source,
    length: raw.length as QuoteLength,
  };
}

/** A random quote for a language, optionally filtered by length. Null if none match. */
export function getRandomQuote(lang: string, length?: QuoteLength): Quote | null {
  const pool = QUOTES[lang];
  if (!pool) return null;
  const filtered = length ? pool.filter((q) => q.length === length) : pool;
  if (filtered.length === 0) return null;
  const picked = filtered[Math.floor(Math.random() * filtered.length)]!;
  return toQuote(lang, pool, picked);
}

/** Every quote for a language, optionally filtered by length. The client uses
 *  this to maintain its own shuffle queue (no repeats until the pool is
 *  exhausted). Null if the language is unknown. */
export function getQuotes(lang: string, length?: QuoteLength): Quote[] | null {
  const pool = QUOTES[lang];
  if (!pool) return null;
  const filtered = length ? pool.filter((q) => q.length === length) : pool;
  return filtered.map((q) => toQuote(lang, pool, q));
}
