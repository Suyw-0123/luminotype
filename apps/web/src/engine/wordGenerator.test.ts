import { describe, it, expect } from 'vitest';
import { generateWords } from './wordGenerator';

const POOL = ['the', 'cat', 'sat', 'on', 'mat'];

describe('generateWords', () => {
  it('returns the requested number of words', () => {
    expect(generateWords(POOL, 10)).toHaveLength(10);
    expect(generateWords(POOL, 0)).toHaveLength(0);
  });

  it('returns an empty array for an empty pool', () => {
    expect(generateWords([], 10)).toEqual([]);
  });

  it('only emits words from the pool when no options are set', () => {
    for (const w of generateWords(POOL, 50)) {
      expect(POOL).toContain(w);
    }
  });

  it('can mix in numeric tokens', () => {
    const out = generateWords(POOL, 200, { numbers: true });
    expect(out.some((w) => /^\d+$/.test(w))).toBe(true);
  });

  it('capitalizes the first word when punctuation is enabled', () => {
    const out = generateWords(POOL, 5, { punctuation: true });
    expect(out[0]![0]).toBe(out[0]![0]!.toUpperCase());
  });
});
