import { handle } from 'hono/cloudflare-pages';
import { createApiApp } from '@luminotype/api/app';

// Cloudflare Pages catch-all for /api/*. Serves the same Hono app as the local
// Node dev server, reading the bundled JSON corpus — no database at runtime.
export const onRequest = handle(createApiApp());
