import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db.js";
import {
  clearSessionCookie,
  createSession,
  deleteCurrentSession,
  DUMMY_PASSWORD_HASH,
  getAuthenticatedUser,
  verifyPassword,
} from "../auth.js";

const loginBodySchema = {
  body: {
    type: "object" as const,
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: { type: "string" as const, minLength: 3, maxLength: 160 },
      password: { type: "string" as const, minLength: 1, maxLength: 200 },
    },
  },
};

// Limita tentativas por IP enquanto o processo da API estiver em execução.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: { email: string; password: string } }>(
    "/api/auth/login",
    { schema: loginBodySchema },
    async (request, reply) => {
      const now = Date.now();
      const key = request.ip;
      let attempt = loginAttempts.get(key);
      if (!attempt || attempt.resetAt <= now) {
        attempt = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
        loginAttempts.set(key, attempt);
      }
      if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
        return reply
          .code(429)
          .send({
            message:
              "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
          });
      }
      attempt.count += 1;

      const email = request.body.email.trim().toLowerCase();
      const result = await pool.query<{
        id: string;
        email: string;
        password_hash: string;
      }>("SELECT id, email, password_hash FROM admin_users WHERE email = $1", [
        email,
      ]);
      const user = result.rows[0];
      // Faz também um hash quando o e-mail não existe para reduzir diferenças de tempo.
      const validPassword = user
        ? await verifyPassword(request.body.password, user.password_hash)
        : await verifyPassword(request.body.password, DUMMY_PASSWORD_HASH);

      // A mesma mensagem evita revelar se um e-mail está cadastrado.
      if (!user || !validPassword) {
        return reply.code(401).send({ message: "E-mail ou senha incorretos." });
      }

      loginAttempts.delete(key);
      await createSession(user.id, request, reply);
      return reply.send({ user: { id: user.id, email: user.email } });
    },
  );

  app.get("/api/auth/me", async (request, reply) => {
    const user = await getAuthenticatedUser(request);
    if (!user)
      return reply.code(401).send({ message: "Você não está autenticado." });
    return { user };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await deleteCurrentSession(request);
    clearSessionCookie(reply);
    return reply.code(204).send();
  });
};
