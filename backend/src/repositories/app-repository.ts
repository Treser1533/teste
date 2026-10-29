import { pool } from "../db.js";
import type {
  Brand,
  Customer,
  AppData,
  Order,
  OrderItem,
  Product,
} from "../types.js";

export async function listBrands(): Promise<Brand[]> {
  const result = await pool.query(
    "SELECT id, name, description, active FROM brands ORDER BY name",
  );
  return result.rows as Brand[];
}

export async function listProducts(): Promise<Product[]> {
  const result = await pool.query(`
    SELECT p.id, p.name, p.brand_id AS "brandId", p.description, p.price,
           p.stock, p.accent, p.active, p.tag,
           COALESCE(array_agg(pf.flavor ORDER BY pf.flavor)
             FILTER (WHERE pf.flavor IS NOT NULL), ARRAY[]::text[]) AS flavors
    FROM products p
    LEFT JOIN product_flavors pf ON pf.product_id = p.id
    GROUP BY p.id
    ORDER BY p.name
  `);
  return result.rows.map((row) => ({
    ...row,
    price: Number(row.price),
    tag: row.tag ?? undefined,
  })) as Product[];
}

export async function listCustomers(): Promise<Customer[]> {
  const result = await pool.query(`
    SELECT id, name, phone, email, city, created_at::text AS "createdAt"
    FROM customers ORDER BY created_at DESC, name
  `);
  return result.rows as Customer[];
}

export async function listOrders(): Promise<Order[]> {
  const ordersResult = await pool.query(`
    SELECT id, customer_id AS "customerId", customer_name AS "customerName",
           customer_phone AS "customerPhone", status, payment_status AS "paymentStatus",
           created_at AS "createdAt", due_date::text AS "dueDate", note
    FROM orders ORDER BY created_at DESC, id DESC
  `);
  const itemsResult = await pool.query(`
    SELECT id, order_id AS "orderId", product_id AS "productId",
           product_name AS "productName", flavor, quantity, unit_price AS "unitPrice"
    FROM order_items ORDER BY order_id, id
  `);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemsResult.rows) {
    const current = itemsByOrder.get(row.orderId) ?? [];
    current.push({
      productId: row.productId ?? "",
      productName: row.productName,
      flavor: row.flavor,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
    });
    itemsByOrder.set(row.orderId, current);
  }

  return ordersResult.rows.map((row) => ({
    ...row,
    customerId: row.customerId ?? "",
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    note: row.note ?? undefined,
    items: itemsByOrder.get(row.id) ?? [],
  })) as Order[];
}

export async function readAppData(): Promise<AppData> {
  const [brands, products, customers, orders] = await Promise.all([
    listBrands(),
    listProducts(),
    listCustomers(),
    listOrders(),
  ]);
  return { brands, products, customers, orders };
}
