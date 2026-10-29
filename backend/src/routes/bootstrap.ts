import type { FastifyPluginAsync } from "fastify";
import { readAppData } from "../repositories/app-repository.js";
import { requireAuthenticated } from "../auth.js";

export const bootstrapRoutes: FastifyPluginAsync = async (app) => {
  // O frontend recebe o estado atual diretamente do PostgreSQL.
  app.get("/api/bootstrap",{ preHandler: requireAuthenticated }, async () => readAppData());
};
