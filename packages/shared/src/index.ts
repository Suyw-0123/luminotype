/**
 * Shared types between the web frontend and the api backend.
 * Single source of truth for API DTOs and core domain models.
 */

// ---------------------------------------------------------------------------
// Test configuration domain
// ---------------------------------------------------------------------------

export type TestMode = 'time' | 'words' | 'quote' | 'zen';

/** Selectable durations (seconds) for the `time` mode. */
export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export type TimeOption = (typeof TIME_OPTIONS)[number];

/** Selectable word counts for the `words` mode. */
export const WORD_COUNT_OPTIONS = [10, 25, 50, 100] as const;
export type WordCountOption = (typeof WORD_COUNT_OPTIONS)[number];

export type QuoteLength = 'short' | 'medium' | 'long' | 'thicc';
export const QUOTE_LENGTHS: readonly QuoteLength[] = ['short', 'medium', 'long', 'thicc'];

export interface TestConfig {
  mode: TestMode;
  /** Active duration when mode === 'time'. */
  time: TimeOption;
  /** Active word count when mode === 'words'. */
  wordCount: WordCountOption;
  /** Quote length filter when mode === 'quote'. */
  quoteLength: QuoteLength;
  /** Language code, e.g. "english". */
  language: string;
  /** Whether punctuation should be mixed into generated words. */
  punctuation: boolean;
  /** Whether numbers should be mixed into generated words. */
  numbers: boolean;
}

// ---------------------------------------------------------------------------
// API DTOs (content / corpus service)
// ---------------------------------------------------------------------------

export interface Language {
  code: string;
  name: string;
}

export interface WordListResponse {
  language: string;
  words: string[];
}

export interface Quote {
  id: number;
  language: string;
  text: string;
  source: string | null;
  length: QuoteLength;
}

export interface QuoteResponse {
  quote: Quote;
}

export interface QuoteListResponse {
  quotes: Quote[];
}

export interface ApiError {
  error: string;
}

// ---------------------------------------------------------------------------
// Test results / statistics
// ---------------------------------------------------------------------------

export interface CharCounts {
  correct: number;
  incorrect: number;
  /** Extra characters typed past the end of a word. */
  extra: number;
  /** Characters in the target that were never typed (skipped words). */
  missed: number;
}

export interface TestResult {
  /** Words per minute, based on correctly typed characters. */
  wpm: number;
  /** Raw words per minute, ignoring correctness. */
  raw: number;
  /** Percentage 0-100. */
  accuracy: number;
  /** Percentage 0-100; lower variance => higher consistency. */
  consistency: number;
  chars: CharCounts;
  /** Elapsed seconds of active typing. */
  durationSeconds: number;
  mode: TestMode;
  language: string;
  /** Epoch milliseconds when the test completed. */
  timestamp: number;
}
