import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

// 0001 and 0002 shipped before this runner existed, and Postgres applies
// everything in db/migrations/ through docker-entrypoint-initdb.d on the first
// boot of an empty volume. On such a database the objects are already there, so
// re-running the files would fail on "type already exists". Each entry names a
// relation that only exists once that migration has run; if it is present we
// record the migration as applied instead of executing it. Migrations added
// from 0003 onwards never need an entry here.
const BASELINE: Record<string, string> = {
  "0001_init.sql": "public.training_plans",
  "0002_authjs.sql": "public.accounts",
};

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing required environment variable: DATABASE_URL");

  const pool = new Pool({ connectionString, max: 1 });

  try {
    await pool.query(`
      create table if not exists public.schema_migrations (
        filename   text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((name) => name.endsWith(".sql"))
      .sort();

    const applied = new Set(
      (await pool.query<{ filename: string }>("select filename from public.schema_migrations")).rows.map(
        (row) => row.filename,
      ),
    );

    let ran = 0;

    for (const file of files) {
      if (applied.has(file)) continue;

      const sentinel = BASELINE[file];
      if (sentinel) {
        const { rows } = await pool.query<{ exists: boolean }>("select to_regclass($1) is not null as exists", [
          sentinel,
        ]);
        if (rows[0]?.exists) {
          await pool.query("insert into public.schema_migrations (filename) values ($1)", [file]);
          console.log(`[migrate] baseline  ${file} (${sentinel} already present)`);
          continue;
        }
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const client = await pool.connect();

      try {
        await client.query("begin");
        await client.query(sql);
        await client.query("insert into public.schema_migrations (filename) values ($1)", [file]);
        await client.query("commit");
        console.log(`[migrate] applied   ${file}`);
        ran += 1;
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        client.release();
      }
    }

    console.log(ran === 0 ? "[migrate] Nothing to apply, database is up to date." : `[migrate] Applied ${ran} migration(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[migrate] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
