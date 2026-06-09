import { Hono } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import type { QuoteResponse, ApiError, QuoteLength } from '@luminotype/shared';
import { QUOTE_LENGTHS } from '@luminotype/shared';
import { db } from '../db/client.js';
import { quotes } from '../db/schema.js';

export const quotesRoute = new Hono();

/** GET /api/quotes?lang=&length= — a random quote, optionally filtered by length. */
quotesRoute.get('/', async (c) => {
  const lang = c.req.query('lang') ?? 'english';
  const lengthParam = c.req.query('length');
  const length =
    lengthParam && (QUOTE_LENGTHS as readonly string[]).includes(lengthParam)
      ? (lengthParam as QuoteLength)
      : undefined;

  const where = length
    ? and(eq(quotes.languageCode, lang), eq(quotes.lengthCategory, length))
    : eq(quotes.languageCode, lang);

  const rows = await db
    .select()
    .from(quotes)
    .where(where)
    .orderBy(sql`random()`)
    .limit(1);

  const row = rows[0];
  if (!row) {
    return c.json<ApiError>({ error: 'No quote found for the given filters' }, 404);
  }

  return c.json<QuoteResponse>({
    quote: {
      id: row.id,
      language: row.languageCode,
      text: row.text,
      source: row.source,
      length: row.lengthCategory as QuoteLength,
    },
  });
});
