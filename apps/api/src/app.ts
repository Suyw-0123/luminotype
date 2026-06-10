import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { languagesRoute } from './routes/languages.js';
import { quotesRoute } from './routes/quotes.js';

/**
 * Builds the content API. Runtime-agnostic: it depends only on Hono and the
 * bundled JSON corpus, so the same app is served by the Node dev server
 * (`src/index.ts`) and by the Cloudflare Pages Function (`/functions`).
 */
export function createApiApp() {
  const app = new Hono();
  app.use('*', logger());
  app.use('/api/*', cors());

  const api = new Hono();
  api.get('/health', (c) => c.json({ status: 'ok' }));
  api.route('/languages', languagesRoute);
  api.route('/quotes', quotesRoute);

  app.route('/api', api);
  return app;
}
