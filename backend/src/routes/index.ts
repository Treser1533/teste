import type { FastifyPluginAsync } from "fastify";
import { authRoutes } from "./auth.js";
import { catalogRoutes } from "./catalog.js";
import { customerRoutes } from "./customers.js";
import { bootstrapRoutes } from "./bootstrap.js";
import { financeRoutes } from "./finance.js";
import { orderRoutes } from "./orders.js";
import { requireAuthenticated } from "../auth.js";

export const apiRoutes: FastifyPluginAsync = async (app) => {
  //Sem esse registro, /api/auth/login respose 401
  await app.register(authRoutes);

  // A leitura do catálogo pode continuar pública.
  // Proteja os PUT e DELETE de marcas e produtos conforme o passo 3.
  await app.register(catalogRoutes);

  // As rotas abaixo só ficam disponíveis com uma sessão válida.
  await app.register(async (privateApp) => {
    privateApp.addHook("preHandler", requireAuthenticated);

    await app.register(bootstrapRoutes);
    await app.register(customerRoutes);
    await app.register(orderRoutes);
    await app.register(financeRoutes);
  }) 
};
