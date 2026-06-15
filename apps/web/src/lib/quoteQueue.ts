import type { Quote, QuoteLength } from '@luminotype/shared';
import { fetchQuotes } from './api';

/**
 * Quote selection as a shuffle bag rather than independent random draws:
 * pressing Tab walks a shuffled order of the whole (filtered) pool, so every
 * quote is shown once before any repeats. When a round finishes we reshuffle;
 * if the new round would open with the same quote that just ended the previous
 * one, we swap it forward so Tab never immediately repeats a quote.
 *
 * State lives at module scope (a singleton per lang+length) so it survives the
 * TypingArea remounting on each Tab and any route navigation. Fetching the pool
 * is also cached here.
 */
interface Bag {
  quotes: Quote[];
  order: number[];
  cursor: number;
  lastId: number | null;
}

const bags = new Map<string, Promise<Bag>>();

function shuffledIndices(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

async function getBag(language: string, length?: QuoteLength): Promise<Bag> {
  const key = `${language}:${length ?? 'any'}`;
  let bag = bags.get(key);
  if (!bag) {
    bag = fetchQuotes(language, length).then((quotes) => ({
      quotes,
      order: shuffledIndices(quotes.length),
      cursor: 0,
      lastId: null,
    }));
    bags.set(key, bag);
  }
  return bag;
}

/** The next quote in the shuffle order; reshuffles (without an immediate repeat)
 *  once the pool is exhausted. */
export async function nextQuote(language: string, length?: QuoteLength): Promise<Quote> {
  const bag = await getBag(language, length);
  if (bag.quotes.length === 0) {
    throw new Error('No quotes available for the selected length');
  }

  if (bag.cursor >= bag.order.length) {
    bag.order = shuffledIndices(bag.quotes.length);
    bag.cursor = 0;
    // Avoid repeating the just-seen quote across the round boundary.
    if (bag.quotes.length > 1 && bag.quotes[bag.order[0]!]!.id === bag.lastId) {
      [bag.order[0], bag.order[1]] = [bag.order[1]!, bag.order[0]!];
    }
  }

  const quote = bag.quotes[bag.order[bag.cursor]!]!;
  bag.cursor += 1;
  bag.lastId = quote.id;
  return quote;
}
