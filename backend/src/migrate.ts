import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = join(here, "..", "migrations");

async function migrate() {
  // Este registro faz o comando pular migrações que já foram aplicadas.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith(".sql")).sort();
  for (const name of files) {
    const alreadyApplied = await pool.query("SELECT 1 FROM schema_migrations WHERE name = $1", [name]);
    if (alreadyApplied.rowCount) {
      console.log(`↷ ${name} já estava aplicada`);
      continue;
    }

    const sql = await readFile(join(migrationsDirectory, name), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`✓ ${name} aplicada`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate()
  .catch((error: unknown) => {
    console.error("Falha ao executar migrações:", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
