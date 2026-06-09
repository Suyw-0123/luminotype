import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString =
  process.env.DATABASE_URL ?? 'postgres://luminotype:luminotype@localhost:5432/luminotype';

/** Long-lived connection pool for the server. */
export const queryClient = postgres(connectionString, { max: 10 });

export const db = drizzle(queryClient, { schema });

export type Db = typeof db;
