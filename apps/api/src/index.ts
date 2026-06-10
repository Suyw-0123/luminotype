import { serve } from '@hono/node-server';
import { createApiApp } from './app.js';

// Node entry point for local development. Production runs the same app on
// Cloudflare Pages Functions (see /functions/api/[[route]].ts).
const app = createApiApp();

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

export { app };
