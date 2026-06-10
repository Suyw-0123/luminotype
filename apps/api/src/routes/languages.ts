import { Hono } from 'hono';
import type { Language, WordListResponse, ApiError } from '@luminotype/shared';
import { languages, getWords } from '../data/index.js';

export const languagesRoute = new Hono();

/** GET /api/languages — list available languages. */
languagesRoute.get('/', (c) => {
  const sorted = [...languages].sort((a, b) => a.name.localeCompare(b.name));
  return c.json<Language[]>(sorted);
});

/** GET /api/languages/:lang/words?limit= — frequency-ordered word list. */
languagesRoute.get('/:lang/words', (c) => {
  const lang = c.req.param('lang');
  const limitParam = Number(c.req.query('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 5000) : 1000;

  const words = getWords(lang, limit);
  if (!words) {
    return c.json<ApiError>({ error: `Unknown language: ${lang}` }, 404);
  }

  return c.json<WordListResponse>({ language: lang, words });
});
