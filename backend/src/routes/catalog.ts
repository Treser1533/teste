import type { FastifyPluginAsync } from "fastify";
import { pool } from "../db.js";
import { brandBodySchema, idParams, productBodySchema } from "../schemas.js";
import type { BrandInput, IdParams, ProductInput } from "../types.js";
import { listBrands, listProducts } from "../repositories/app-repository.js";

function postgresCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}

export const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/brands", async () => listBrands());

  // PUT com um ID estável cria a marca quando ainda não existe e atualiza quando já existe.
  app.put<{ Params: IdParams; Body: BrandInput }>("/api/brands/:id", { schema: { ...idParams, ...brandBodySchema } }, async (request, reply) => {
    const { id } = request.params;
    const { name, description, active } = request.body;
    try {
      const result = await pool.query(
        `INSERT INTO brands (id, name, description, active) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, active = EXCLUDED.active
         RETURNING id, name, description, active`,
        [id, name, description, active],
      );
      return reply.code(200).send(result.rows[0]);
    } catch (error) {
      if (postgresCode(error) === "23505") return reply.code(409).send({ message: "Já existe uma marca com esse nome." });
      throw error;
    }
  });

  app.delete<{ Params: IdParams }>("/api/brands/:id", { schema: idParams }, async (request, reply) => {
    try {
      const result = await pool.query("DELETE FROM brands WHERE id = $1", [request.params.id]);
      if (!result.rowCount) return reply.code(404).send({ message: "Marca não encontrada." });
      return reply.code(204).send();
    } catch (error) {
      if (postgresCode(error) === "23503") return reply.code(409).send({ message: "Remova os produtos desta marca antes de excluí-la." });
      throw error;
    }
  });

  app.get("/api/products", async () => listProducts());

  app.put<{ Params: IdParams; Body: ProductInput }>("/api/products/:id", { schema: { ...idParams, ...productBodySchema } }, async (request, reply) => {
    const { id } = request.params;
    const product = request.body;
    const client = await pool.connect();
    try {
      // Produto e sabores são gravados juntos: ou tudo salva, ou nada salva.
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO products (id, brand_id, name, description, price, stock, accent, active, tag)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name,
           description = EXCLUDED.description, price = EXCLUDED.price, stock = EXCLUDED.stock,
           accent = EXCLUDED.accent, active = EXCLUDED.active, tag = EXCLUDED.tag`,
        [id, product.brandId, product.name, product.description, product.price, product.stock, product.accent, product.active, product.tag ?? null],
      );
      await client.query("DELETE FROM product_flavors WHERE product_id = $1", [id]);
      for (const flavor of new Set(product.flavors)) {
        await client.query("INSERT INTO product_flavors (product_id, flavor) VALUES ($1, $2)", [id, flavor]);
      }
      await client.query("COMMIT");
      const saved = (await listProducts()).find((item) => item.id === id);
      return reply.code(200).send(saved);
    } catch (error) {
      await client.query("ROLLBACK");
      if (postgresCode(error) === "23503") return reply.code(404).send({ message: "A marca selecionada não existe." });
      throw error;
    } finally {
      client.release();
    }
  });

  app.delete<{ Params: IdParams }>("/api/products/:id", { schema: idParams }, async (request, reply) => {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [request.params.id]);
    if (!result.rowCount) return reply.code(404).send({ message: "Produto não encontrado." });
    return reply.code(204).send();
  });
};
