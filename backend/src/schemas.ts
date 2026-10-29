// JSON Schema valida a entrada HTTP antes de executar qualquer consulta ao banco.
const text = { type: "string" as const };
const idParams = { params: { type: "object" as const, required: ["id"], properties: { id: text } } };

export const brandBodySchema = {
  body: {
    type: "object" as const,
    additionalProperties: false,
    required: ["name", "description", "active"],
    properties: {
      id: text,
      name: { type: "string" as const, minLength: 2, maxLength: 80 },
      description: { type: "string" as const, maxLength: 500 },
      active: { type: "boolean" as const },
    },
  },
};

export const customerBodySchema = {
  body: {
    type: "object" as const,
    additionalProperties: false,
    required: ["name", "phone", "email", "city", "createdAt"],
    properties: {
      id: text,
      name: { type: "string" as const, minLength: 3, maxLength: 120 },
      phone: { type: "string" as const, minLength: 10, maxLength: 30 },
      email: { type: "string" as const, maxLength: 160 },
      city: { type: "string" as const, maxLength: 120 },
      createdAt: { type: "string" as const, minLength: 10, maxLength: 30 },
    },
  },
};

export const productBodySchema = {
  body: {
    type: "object" as const,
    additionalProperties: false,
    required: ["name", "brandId", "description", "price", "stock", "flavors", "accent", "active"],
    properties: {
      id: text,
      name: { type: "string" as const, minLength: 2, maxLength: 120 },
      brandId: { type: "string" as const, minLength: 1 },
      description: { type: "string" as const, maxLength: 1000 },
      price: { type: "number" as const, exclusiveMinimum: 0 },
      stock: { type: "integer" as const, minimum: 0 },
      flavors: { type: "array" as const, items: { type: "string" as const, minLength: 2, maxLength: 80 } },
      accent: { type: "string" as const, enum: ["lime", "orange", "violet", "cyan"] },
      active: { type: "boolean" as const },
      tag: { type: ["string", "null"] as const, maxLength: 40 },
    },
  },
};

const orderItem = {
  type: "object" as const,
  additionalProperties: false,
  required: ["productId", "productName", "flavor", "quantity", "unitPrice"],
  properties: {
    productId: text,
    productName: { type: "string" as const, minLength: 1, maxLength: 120 },
    flavor: { type: "string" as const, minLength: 1, maxLength: 80 },
    quantity: { type: "integer" as const, minimum: 1, maximum: 500 },
    unitPrice: { type: "number" as const, exclusiveMinimum: 0 },
  },
};

export const orderBodySchema = {
  body: {
    type: "object" as const,
    additionalProperties: false,
    required: ["customerId", "customerName", "customerPhone", "items", "status", "paymentStatus", "createdAt", "dueDate"],
    properties: {
      id: text,
      customerId: { type: ["string", "null"] as const },
      customerName: { type: "string" as const, minLength: 3, maxLength: 120 },
      customerPhone: { type: "string" as const, maxLength: 30 },
      items: { type: "array" as const, minItems: 1, items: orderItem },
      status: { type: "string" as const, enum: ["Novo", "Em separação", "Pronto", "Entregue", "Cancelado"] },
      paymentStatus: { type: "string" as const, enum: ["Pendente", "Pago", "Atrasado"] },
      createdAt: { type: "string" as const, minLength: 10, maxLength: 40 },
      dueDate: { type: "string" as const, minLength: 10, maxLength: 10 },
      note: { type: ["string", "null"] as const, maxLength: 1000 },
    },
  },
};

export { idParams };
