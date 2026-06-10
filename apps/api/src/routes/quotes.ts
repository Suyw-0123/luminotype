import { Hono } from 'hono';
import type { QuoteResponse, ApiError, QuoteLength } from '@luminotype/shared';
import { QUOTE_LENGTHS } from '@luminotype/shared';
import { getRandomQuote } from '../data/index.js';

export const quotesRoute = new Hono();

/** GET /api/quotes?lang=&length= — a random quote, optionally filtered by length. */
quotesRoute.get('/', (c) => {
  const lang = c.req.query('lang') ?? 'english';
  const lengthParam = c.req.query('length');
  const length =
    lengthParam && (QUOTE_LENGTHS as readonly string[]).includes(lengthParam)
      ? (lengthParam as QuoteLength)
      : undefined;

  const quote = getRandomQuote(lang, length);
  if (!quote) {
    return c.json<ApiError>({ error: 'No quote found for the given filters' }, 404);
  }

  return c.json<QuoteResponse>({ quote });
});
