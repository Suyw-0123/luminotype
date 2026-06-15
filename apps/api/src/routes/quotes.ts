import { Hono } from 'hono';
import type { QuoteResponse, QuoteListResponse, ApiError, QuoteLength } from '@luminotype/shared';
import { QUOTE_LENGTHS } from '@luminotype/shared';
import { getRandomQuote, getQuotes } from '../data/index.js';

export const quotesRoute = new Hono();

function parseLength(value: string | undefined): QuoteLength | undefined {
  return value && (QUOTE_LENGTHS as readonly string[]).includes(value)
    ? (value as QuoteLength)
    : undefined;
}

/** GET /api/quotes?lang=&length= — a random quote, optionally filtered by length. */
quotesRoute.get('/', (c) => {
  const lang = c.req.query('lang') ?? 'english';
  const length = parseLength(c.req.query('length'));

  const quote = getRandomQuote(lang, length);
  if (!quote) {
    return c.json<ApiError>({ error: 'No quote found for the given filters' }, 404);
  }

  return c.json<QuoteResponse>({ quote });
});

/** GET /api/quotes/all?lang=&length= — the full (filtered) pool, for the
 *  client's shuffle queue. 404 only when the language itself is unknown. */
quotesRoute.get('/all', (c) => {
  const lang = c.req.query('lang') ?? 'english';
  const length = parseLength(c.req.query('length'));

  const quotes = getQuotes(lang, length);
  if (!quotes) {
    return c.json<ApiError>({ error: 'Unknown language' }, 404);
  }

  return c.json<QuoteListResponse>({ quotes });
});
