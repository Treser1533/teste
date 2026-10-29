import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db.js";
import { customerBodySchema, idParams } from "../schemas.js";
import type { CustomerInput, IdParams } from "../types.js";
import { listCustomers } from "../repositories/app-repository.js";

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/customers", async () => listCustomers());

  app.put<{ Params: IdParams; Body: CustomerInput }>(
    "/api/customers/:id",
    { schema: { ...idParams, ...customerBodySchema } },
    async (request, reply) => {
      const { id } = request.params;
      const customer = request.body;
      const result = await pool.query(
        `INSERT INTO customers (id, name, phone, email, city, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::date)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone,
         email = EXCLUDED.email, city = EXCLUDED.city
       RETURNING id, name, phone, email, city, created_at::text AS "createdAt"`,
        [
          id,
          customer.name,
          customer.phone,
          customer.email,
          customer.city,
          customer.createdAt.slice(0, 10),
        ],
      );
      return reply.code(200).send(result.rows[0]);
    },
  );

  app.delete<{ Params: IdParams }>(
    "/api/customers/:id",
    { schema: idParams },
    async (request, reply) => {
      const result = await pool.query("DELETE FROM customers WHERE id = $1", [
        request.params.id,
      ]);
      if (!result.rowCount)
        return reply.code(404).send({ message: "Cliente não encontrado." });
      // Pedidos antigos continuam salvos; só deixam de apontar para o cadastro apagado.
      return reply.code(204).send();
    },
  );
};
