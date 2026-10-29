import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { checkDatabase, pool } from "./db.js";
import { apiRoutes } from "./routes/index.js";
import { ensureInitialAdmin } from "./auth.js";

const app = Fastify({ logger: true });

// Registre o tratamento antes das rotas para que todos os módulos o herdem.
app.setErrorHandler((error, _request, reply) => {
  if (error.validation) {
    return reply
      .code(400)
      .send({ message: "Dados inválidos", details: error.validation });
  }
  app.log.error(error);
  return reply
    .code(500)
    .send({ message: "O servidor não conseguiu concluir a solicitação." });
});

const allowedOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

await app.register(cors, {
   origin: allowedOrigins,
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization"],
   credentials: true,
});
await app.register(apiRoutes);

app.get("/health", async () => {
  await checkDatabase();
  return { status: "ok", database: "connected" };
});

app.addHook("onClose", async () => pool.end());

const port = Number(process.env.PORT ?? 4000);
try {
  await checkDatabase();
  await ensureInitialAdmin();
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(
    error,
    "Não foi possível iniciar a API. Confira DATABASE_URL e se o PostgreSQL está ativo.",
  );
  await app.close();
  process.exitCode = 1;
}
