// Estes tipos descrevem o contrato JSON da API. O formato espelha lib/types.ts do frontend.
export type Brand = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  createdAt: string;
};
export type Product = {
  id: string;
  name: string;
  brandId: string;
  description: string;
  price: number;
  stock: number;
  flavors: string[];
  accent: string;
  active: boolean;
  tag?: string;
};
export type OrderStatus =
  | "Novo"
  | "Em separação"
  | "Pronto"
  | "Entregue"
  | "Cancelado";
export type PaymentStatus = "Pendente" | "Pago" | "Atrasado";
export type OrderItem = {
  productId: string;
  productName: string;
  flavor: string;
  quantity: number;
  unitPrice: number;
};
export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  dueDate: string;
  note?: string;
};
export type AppData = {
  brands: Brand[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
};

export type BrandInput = Pick<Brand, "name" | "description" | "active"> & {
  id?: string;
};
export type CustomerInput = Omit<Customer, "id"> & { id?: string };
export type ProductInput = Omit<Product, "id"> & { id?: string };
export type OrderInput = Omit<Order, "id" | "customerId"> & {
  id?: string;
  customerId: string | null;
};
export type IdParams = { id: string };
