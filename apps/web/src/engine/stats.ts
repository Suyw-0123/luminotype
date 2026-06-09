import type { CharCounts } from '@luminotype/shared';

/** Standard typing convention: one "word" is 5 characters. */
const CHARS_PER_WORD = 5;

/** Words per minute from a character count over an elapsed time. */
export function calculateWpm(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  const minutes = ms / 60000;
  return chars / CHARS_PER_WORD / minutes;
}

/** Accuracy as a 0-100 percentage of correct keystrokes. */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 100;
  return (correct / total) * 100;
}

/**
 * Consistency as a 0-100 percentage derived from the coefficient of variation
 * of per-second WPM samples. Steady typing => high consistency.
 */
export function calculateConsistency(perSecondWpm: number[]): number {
  const samples = perSecondWpm.filter((w) => w > 0);
  if (samples.length < 2) return 100;
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  if (mean === 0) return 0;
  const variance = samples.reduce((acc, w) => acc + (w - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return Math.max(0, Math.min(100, (1 - cv) * 100));
}

export interface GradeInput {
  /** Target words for the test. */
  words: string[];
  /** Committed words (fully submitted via space or final word). */
  typedWords: string[];
  /** Partially typed active word, if the test ended mid-word. */
  activeInput?: string;
}

/**
 * Grade typed input against the target, producing character counts.
 * - committed words contribute correct/incorrect/extra and `missed` for any
 *   target characters never reached;
 * - the active (incomplete) word contributes correct/incorrect/extra only.
 * - one space per committed word boundary counts as a correct character.
 */
export function gradeChars({ words, typedWords, activeInput }: GradeInput): CharCounts {
  const counts: CharCounts = { correct: 0, incorrect: 0, extra: 0, missed: 0 };

  const gradeWord = (target: string, typed: string, committed: boolean) => {
    const common = Math.min(target.length, typed.length);
    for (let i = 0; i < common; i++) {
      if (typed[i] === target[i]) counts.correct++;
      else counts.incorrect++;
    }
    if (typed.length > target.length) {
      counts.extra += typed.length - target.length;
    } else if (committed && typed.length < target.length) {
      counts.missed += target.length - typed.length;
    }
  };

  const committedCount = Math.min(typedWords.length, words.length);
  for (let i = 0; i < committedCount; i++) {
    gradeWord(words[i]!, typedWords[i]!, true);
  }

  // Spaces between committed words count as correct characters.
  if (committedCount > 0) {
    counts.correct += committedCount;
  }

  // Active partial word (test ended before it was committed).
  if (activeInput && committedCount < words.length) {
    gradeWord(words[committedCount]!, activeInput, false);
  }

  return counts;
}
