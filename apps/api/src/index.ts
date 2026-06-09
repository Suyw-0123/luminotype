import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { languagesRoute } from './routes/languages.js';
import { quotesRoute } from './routes/quotes.js';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors());

const api = new Hono();

api.get('/health', (c) => c.json({ status: 'ok' }));
api.route('/languages', languagesRoute);
api.route('/quotes', quotesRoute);

app.route('/api', api);

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export { app };
