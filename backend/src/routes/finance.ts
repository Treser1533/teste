import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db.js";

export const financeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/finance/summary", async () => {
    const result = await pool.query(`
      WITH order_totals AS (
        SELECT o.id, o.payment_status,
          COALESCE(SUM(i.quantity * i.unit_price), 0) AS total
        FROM orders o
        LEFT JOIN order_items i ON i.order_id = o.id
        GROUP BY o.id
      )
      SELECT
        COALESCE(SUM(total) FILTER (WHERE payment_status = 'Pago'), 0) AS received,
        COALESCE(SUM(total) FILTER (WHERE payment_status IN ('Pendente', 'Atrasado')), 0) AS outstanding,
        COUNT(*) FILTER (WHERE payment_status = 'Pendente')::int AS pending_count,
        COUNT(*) FILTER (WHERE payment_status = 'Atrasado')::int AS overdue_count,
        COUNT(*) FILTER (WHERE payment_status = 'Pago')::int AS paid_count
      FROM order_totals
    `);

    const row = result.rows[0];
    return {
      received: Number(row.received),
      outstanding: Number(row.outstanding),
      pendingCount: Number(row.pending_count),
      overdueCount: Number(row.overdue_count),
      paidCount: Number(row.paid_count),
    };
  });
};
