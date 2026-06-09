import { Hono } from 'hono';
import { asc, eq } from 'drizzle-orm';
import type { Language, WordListResponse, ApiError } from '@luminotype/shared';
import { db } from '../db/client.js';
import { languages, words } from '../db/schema.js';

export const languagesRoute = new Hono();

/** GET /api/languages — list available languages. */
languagesRoute.get('/', async (c) => {
  const rows = await db
    .select({ code: languages.code, name: languages.name })
    .from(languages)
    .orderBy(asc(languages.name));
  return c.json<Language[]>(rows);
});

/** GET /api/languages/:lang/words?limit= — frequency-ordered word list. */
languagesRoute.get('/:lang/words', async (c) => {
  const lang = c.req.param('lang');
  const limitParam = Number(c.req.query('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 5000) : 1000;

  const exists = await db
    .select({ code: languages.code })
    .from(languages)
    .where(eq(languages.code, lang))
    .limit(1);
  if (exists.length === 0) {
    return c.json<ApiError>({ error: `Unknown language: ${lang}` }, 404);
  }

  const rows = await db
    .select({ word: words.word })
    .from(words)
    .where(eq(words.languageCode, lang))
    .orderBy(asc(words.frequencyRank))
    .limit(limit);

  return c.json<WordListResponse>({ language: lang, words: rows.map((r) => r.word) });
});
