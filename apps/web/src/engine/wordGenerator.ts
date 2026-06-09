export interface GenerateOptions {
  punctuation?: boolean;
  numbers?: boolean;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SENTENCE_ENDERS = ['.', '?', '!'];

/**
 * Generate `count` words sampled from `pool`, optionally mixing in punctuation
 * and numbers.
 */
export function generateWords(pool: string[], count: number, opts: GenerateOptions = {}): string[] {
  if (pool.length === 0) return [];
  const out: string[] = [];
  let capitalizeNext = opts.punctuation; // start sentences capitalized

  for (let i = 0; i < count; i++) {
    // Numbers: occasionally emit a numeric token instead of a word.
    if (opts.numbers && Math.random() < 0.15) {
      out.push(String(randomInt(0, 9999)));
      continue;
    }

    let word = randomItem(pool);

    if (opts.punctuation) {
      if (capitalizeNext) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        capitalizeNext = false;
      }
      const roll = Math.random();
      if (roll < 0.08 && i < count - 1) {
        word += randomItem(SENTENCE_ENDERS);
        capitalizeNext = true;
      } else if (roll < 0.15) {
        word += ',';
      }
    }

    out.push(word);
  }

  return out;
}
