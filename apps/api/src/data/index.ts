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

/** A random quote for a language, optionally filtered by length. Null if none match. */
export function getRandomQuote(lang: string, length?: QuoteLength): Quote | null {
  const pool = QUOTES[lang];
  if (!pool) return null;
  const filtered = length ? pool.filter((q) => q.length === length) : pool;
  if (filtered.length === 0) return null;
  const picked = filtered[Math.floor(Math.random() * filtered.length)]!;
  return {
    // Position in the full language pool — stable across requests.
    id: pool.indexOf(picked),
    language: lang,
    text: picked.text,
    source: picked.source,
    length: picked.length as QuoteLength,
  };
}
