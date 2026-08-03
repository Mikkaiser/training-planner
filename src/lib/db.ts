import { Pool } from "pg";

// Reuse a single pool across hot reloads in dev.
const globalForPg = globalThis as unknown as { _tpPool?: Pool };

export const pool =
  globalForPg._tpPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg._tpPool = pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// Postgres returns numeric as string and timestamptz as Date. The app types
// expect number and ISO string, so queries cast explicitly using these.
export const TS = (col: string, alias: string) =>
  `to_char(${col} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as ${alias}`;
