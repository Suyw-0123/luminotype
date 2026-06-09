import { describe, it, expect } from 'vitest';
import { calculateWpm, calculateAccuracy, calculateConsistency, gradeChars } from './stats';

describe('calculateWpm', () => {
  it('returns 0 for non-positive time', () => {
    expect(calculateWpm(100, 0)).toBe(0);
    expect(calculateWpm(100, -5)).toBe(0);
  });

  it('computes 60 wpm for 5 correct chars per second over a minute', () => {
    // 300 chars / 5 = 60 words in 1 minute.
    expect(calculateWpm(300, 60000)).toBe(60);
  });

  it('scales with elapsed time', () => {
    // 25 chars = 5 words in 30s => 10 wpm.
    expect(calculateWpm(25, 30000)).toBe(10);
  });
});

describe('calculateAccuracy', () => {
  it('is 100 when nothing was typed', () => {
    expect(calculateAccuracy(0, 0)).toBe(100);
  });

  it('is the ratio of correct to total keystrokes', () => {
    expect(calculateAccuracy(90, 100)).toBe(90);
    expect(calculateAccuracy(1, 2)).toBe(50);
  });
});

describe('calculateConsistency', () => {
  it('is 100 for steady (zero-variance) typing', () => {
    expect(calculateConsistency([60, 60, 60, 60])).toBe(100);
  });

  it('is 100 with fewer than two samples', () => {
    expect(calculateConsistency([])).toBe(100);
    expect(calculateConsistency([42])).toBe(100);
  });

  it('drops below 100 when speed fluctuates', () => {
    const c = calculateConsistency([20, 80, 20, 80]);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(100);
  });
});

describe('gradeChars', () => {
  it('counts a perfectly typed set of words including spaces', () => {
    const counts = gradeChars({ words: ['the', 'cat'], typedWords: ['the', 'cat'] });
    // 3 + 3 correct chars + 2 word-boundary spaces.
    expect(counts).toEqual({ correct: 8, incorrect: 0, extra: 0, missed: 0 });
  });

  it('counts incorrect characters', () => {
    const counts = gradeChars({ words: ['cat'], typedWords: ['cot'] });
    expect(counts.correct).toBe(2 + 1); // c, t correct + 1 space
    expect(counts.incorrect).toBe(1); // o vs a
  });

  it('counts extra characters past the word end', () => {
    const counts = gradeChars({ words: ['cat'], typedWords: ['catt'] });
    expect(counts.extra).toBe(1);
  });

  it('counts missed characters for committed-but-short words', () => {
    const counts = gradeChars({ words: ['catnip'], typedWords: ['cat'] });
    expect(counts.missed).toBe(3);
  });

  it('does not count missed for the active (incomplete) word', () => {
    const counts = gradeChars({
      words: ['the', 'catnip'],
      typedWords: ['the'],
      activeInput: 'cat',
    });
    expect(counts.missed).toBe(0);
    expect(counts.correct).toBe(3 + 1 + 3); // 'the' + space + 'cat'
  });
});
