import pg from "pg";

const { Pool } = pg;

// Pool reutiliza conexões em vez de abrir uma conexão nova para cada requisição.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error("Erro inesperado em uma conexão ociosa do PostgreSQL:", error);
});

export async function checkDatabase() {
  await pool.query("SELECT 1");
}
