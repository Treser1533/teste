import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db.js";
import { idParams, orderBodySchema } from "../schemas.js";
import type { IdParams, OrderInput } from "../types.js";
import { listOrders } from "../repositories/app-repository.js";

function postgresCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/orders", async () => listOrders());

  app.put<{ Params: IdParams; Body: OrderInput }>("/api/orders/:id", { schema: { ...idParams, ...orderBodySchema } }, async (request, reply) => {
    const { id } = request.params;
    const order = request.body;
    const client = await pool.connect();

    try {
      // A transação mantém o pedido e suas linhas sincronizados mesmo se uma inserção falhar.
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO orders (id, customer_id, customer_name, customer_phone, status, payment_status, created_at, due_date, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::date, $9)
         ON CONFLICT (id) DO UPDATE SET customer_id = EXCLUDED.customer_id,
           customer_name = EXCLUDED.customer_name, customer_phone = EXCLUDED.customer_phone,
           status = EXCLUDED.status, payment_status = EXCLUDED.payment_status,
           due_date = EXCLUDED.due_date, note = EXCLUDED.note`,
        [id, order.customerId || null, order.customerName, order.customerPhone, order.status, order.paymentStatus, order.createdAt, order.dueDate, order.note ?? null],
      );

      await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);
      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, flavor, quantity, unit_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, item.productId || null, item.productName, item.flavor, item.quantity, item.unitPrice],
        );
      }

      await client.query("COMMIT");
      const saved = (await listOrders()).find((item) => item.id === id);
      return reply.code(200).send(saved);
    } catch (error) {
      await client.query("ROLLBACK");
      if (postgresCode(error) === "23503") {
        return reply.code(404).send({ message: "O cliente ou produto selecionado não existe." });
      }
      throw error;
    } finally {
      client.release();
    }
  });

  app.delete<{ Params: IdParams }>("/api/orders/:id", { schema: idParams }, async (request, reply) => {
    const result = await pool.query("DELETE FROM orders WHERE id = $1", [request.params.id]);
    console.log(result)
    if (!result.rowCount) return reply.code(404).send({ message: "Pedido não encontrado." });
    return reply.code(204).send();
  });
};
