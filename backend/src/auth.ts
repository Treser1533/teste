import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { pool } from "./db.js";

const COOKIE_NAME = "rnpods_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias
// Hash fictício com o mesmo tamanho do hash real, para o caminho de e-mail inexistente.
export const DUMMY_PASSWORD_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(64)}`;

type AuthUser = { id: string; email: string };

// O scrypt usa uma salt aleatória e não exige dependências externas de hash.
function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt);
  // timingSafeEqual evita comparar senhas byte a byte com tempo variável.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sessionTokenHash(token: string) {
  // O token puro só vai para o cookie HttpOnly; no banco fica apenas seu SHA-256.
  return createHash("sha256").update(token).digest("hex");
}

function readCookie(request: FastifyRequest, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const pair = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!pair) return null;
  try {
    return decodeURIComponent(pair.slice(name.length + 1));
  } catch {
    return null;
  }
}

function cookieHeader(token: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setSessionCookie(reply: FastifyReply, token: string) {
  reply.header("Set-Cookie", cookieHeader(token, SESSION_DURATION_SECONDS));
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.header("Set-Cookie", cookieHeader("", 0));
}

export async function getAuthenticatedUser(request: FastifyRequest): Promise<AuthUser | null> {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;

  const result = await pool.query<AuthUser>(
    `SELECT u.id, u.email
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [sessionTokenHash(token)],
  );
  return result.rows[0] ?? null;
}

// Use como preHandler nas rotas privadas. O cookie é verificado no PostgreSQL.
export async function requireAuthenticated(request: FastifyRequest, reply: FastifyReply) {
  const user = await getAuthenticatedUser(request);
  if (!user) return reply.code(401).send({ message: "Sessão inválida ou expirada. Entre novamente." });
}

export async function createSession(userId: string, request: FastifyRequest, reply: FastifyReply) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = sessionTokenHash(token);

  await pool.query(
    `INSERT INTO admin_sessions (token_hash, user_id, expires_at, user_agent)
     VALUES ($1, $2, NOW() + make_interval(secs => $3::double precision), $4)`,
    [tokenHash, userId, SESSION_DURATION_SECONDS, String(request.headers["user-agent"] ?? "").slice(0, 500)],
  );
  setSessionCookie(reply, token);
}

export async function deleteCurrentSession(request: FastifyRequest) {
  const token = readCookie(request, COOKIE_NAME);
  if (token) await pool.query("DELETE FROM admin_sessions WHERE token_hash = $1", [sessionTokenHash(token)]);
}

// Na primeira inicialização, cria o primeiro administrador a partir do backend/.env.
export async function ensureInitialAdmin() {
  await pool.query("DELETE FROM admin_sessions WHERE expires_at <= NOW()");
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    const existing = await pool.query("SELECT 1 FROM admin_users LIMIT 1");
    if (existing.rowCount) return;
    throw new Error("Configure ADMIN_EMAIL e ADMIN_PASSWORD em backend/.env para criar o primeiro administrador.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL precisa ser um endereço de e-mail válido.");
  }
  if (password.length < 5) {
    throw new Error("ADMIN_PASSWORD precisa ter pelo menos 5 caracteres.");
  }

  const existing = await pool.query<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM admin_users WHERE email = $1",
    [email],
  );
  const passwordHash = await hashPassword(password);
  if (existing.rows[0]) {
    // ADMIN_PASSWORD no .env também permite atualizar a senha e revogar sessões antigas.
    if (!await verifyPassword(password, existing.rows[0].password_hash)) {
      await pool.query("UPDATE admin_users SET password_hash = $2 WHERE id = $1", [existing.rows[0].id, passwordHash]);
      await pool.query("DELETE FROM admin_sessions WHERE user_id = $1", [existing.rows[0].id]);
      console.info(`Senha administrativa atualizada para ${email}; sessões anteriores foram revogadas.`);
    }
    return;
  }

  await pool.query(
    "INSERT INTO admin_users (id, email, password_hash) VALUES ($1, $2, $3)",
    [`admin-${randomUUID()}`, email, passwordHash],
  );
  console.info(`Conta administrativa preparada para ${email}.`);
}
