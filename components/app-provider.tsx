"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Brand, Customer, AppData, Order, Product } from "@/lib/types";
import { ApiError, apiRequest } from "@/lib/api";

export type BackendStatus = "connecting" | "online" | "offline";

type AppStore = AppData & {
  ready: boolean;
  refreshData: () => Promise<boolean>;
  backendStatus: BackendStatus;
  backendError: string;
  saveCustomer: (customer: Customer) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  saveProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  saveBrand: (brand: Brand) => Promise<boolean>;
  deleteBrand: (id: string) => Promise<boolean>;
  saveOrder: (order: Order) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>
};

const emptyData: AppData = {
  customers: [],
  products: [],
  brands: [],
  orders: [],
};
const StoreContext = createContext<AppStore | null>(null);

function upsert<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((current) => current.id === item.id);
  if (index < 0) return [item, ...items];
  return items.map((current) => (current.id === item.id ? item : current));
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>("connecting");
  const [backendError, setBackendError] = useState("");
  const backendStatusRef = useRef<BackendStatus>("connecting");
  const mutationQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const fromApi = await apiRequest<AppData>("/api/bootstrap");
        if (!cancelled) {
          setData(fromApi);
          backendStatusRef.current = "online";
          setBackendStatus("online");
          setBackendError("");
        }
      } catch (error) {
        if (!cancelled) {
          backendStatusRef.current = "offline";
          setBackendStatus("offline");
          setBackendError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados da API local.",
          );
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshData = useCallback(async () => {

    try {
      
      const fromApi = await apiRequest<AppData>("/api/bootstrap");

      setData(fromApi);
      setBackendStatus("online");
      backendStatusRef.current = "online";
      setBackendError("");
      setReady(true);

      return true;
    } catch (error) {
      
      // Um 401 significa que a API respondeu, mas a sessão não foi aceita.
      const status =
        error instanceof ApiError && error.status < 500 ? "online" : "offline";

      setBackendStatus(status);
      backendStatusRef.current = status;
      setBackendError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados do painel.",
      );

      return false;

    }

  }, []);

  const syncWithBackend = useCallback(
    (path: string, method: "PUT" | "DELETE", body?: unknown) => {
      if (backendStatusRef.current !== "online") {
        setBackendError(
          "A API está desconectada. Inicie o backend para salvar alterações.",
        );
        return Promise.resolve(false);
      }
      // A fila conserva a ordem entre gravações relacionadas, como cliente e pedido.
      let result = false;
      const next = mutationQueue.current.then(async () => {
        if (backendStatusRef.current !== "online") return;
        try {
          await apiRequest(path, { method, body });
          result = true;
          setBackendError("");
        } catch (error) {
          if (error instanceof ApiError) {
            if (error.status >= 500) {
              backendStatusRef.current = "offline";
              setBackendStatus("offline");
            }
            setBackendError(error.message);
          } else {
            backendStatusRef.current = "offline";
            setBackendStatus("offline");
            setBackendError(
              "Falha de conexão ao gravar. Confira se a API e o PostgreSQL continuam ativos.",
            );
          }
        }
      });
      mutationQueue.current = next;
      return next.then(() => result);
    },
    [],
  );

  const saveCustomer = useCallback(
    async (customer: Customer) => {
      const saved = await syncWithBackend(
        `/api/customers/${encodeURIComponent(customer.id)}`,
        "PUT",
        customer,
      );
      if (saved)
        setData((current) => ({
          ...current,
          customers: upsert(current.customers, customer),
        }));
      return saved;
    },
    [syncWithBackend],
  );
  const deleteCustomer = useCallback(
    async (id: string) => {
      const saved = await syncWithBackend(
        `/api/customers/${encodeURIComponent(id)}`,
        "DELETE",
      );
      if (saved)
        setData((current) => ({
          ...current,
          customers: current.customers.filter((item) => item.id !== id),
        }));
      return saved;
    },
    [syncWithBackend],
  );
  const saveProduct = useCallback(
    async (product: Product) => {
      const saved = await syncWithBackend(
        `/api/products/${encodeURIComponent(product.id)}`,
        "PUT",
        product,
      );
      if (saved)
        setData((current) => ({
          ...current,
          products: upsert(current.products, product),
        }));
      return saved;
    },
    [syncWithBackend],
  );
  const deleteProduct = useCallback(
    async (id: string) => {
      const saved = await syncWithBackend(
        `/api/products/${encodeURIComponent(id)}`,
        "DELETE",
      );
      if (saved)
        setData((current) => ({
          ...current,
          products: current.products.filter((item) => item.id !== id),
        }));
      return saved;
    },
    [syncWithBackend],
  );
  const saveBrand = useCallback(
    async (brand: Brand) => {
      const saved = await syncWithBackend(
        `/api/brands/${encodeURIComponent(brand.id)}`,
        "PUT",
        brand,
      );
      if (saved)
        setData((current) => ({
          ...current,
          brands: upsert(current.brands, brand),
        }));
      return saved;
    },
    [syncWithBackend],
  );
  const deleteBrand = useCallback(
    async (id: string) => {
      const saved = await syncWithBackend(
        `/api/brands/${encodeURIComponent(id)}`,
        "DELETE",
      );
      if (saved)
        setData((current) => ({
          ...current,
          brands: current.brands.filter((item) => item.id !== id),
        }));
      return saved;
    },
    [syncWithBackend],
  );
  const saveOrder = useCallback(
    async (order: Order) => {
      const saved = await syncWithBackend(
        `/api/orders/${encodeURIComponent(order.id)}`,
        "PUT",
        order,
      );
      if (saved)
        setData((current) => ({
          ...current,
          orders: upsert(current.orders, order),
        }));
      return saved;
    },
    [syncWithBackend],
  );

  const deleteOrder = useCallback(async (id: string) => {
    const saved = await syncWithBackend(
      `/api/orders/${encodeURIComponent(id)}`,
      "DELETE"
    );

    if (saved) {
      setData((current) => ({
        ...current,
        orders: current.orders.filter((order) => order.id !== id),
      }));
    }

    return saved;
  }, [syncWithBackend]);

  const value = useMemo(
    () => ({
      ...data,
      ready,
      backendStatus,
      backendError,
      refreshData,
      saveCustomer,
      deleteCustomer,
      saveProduct,
      deleteProduct,
      saveBrand,
      deleteBrand,
      saveOrder,
      deleteOrder,
    }),
    [
      data,
      ready,
      backendStatus,
      backendError,
      refreshData,
      saveCustomer,
      deleteCustomer,
      saveProduct,
      deleteProduct,
      saveBrand,
      deleteBrand,
      saveOrder,
      deleteOrder,
    ],
  );
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(StoreContext);
  if (!context)
    throw new Error("useAppData precisa estar dentro de AppDataProvider");
  return context;
}
