"use client";

import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Package,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAppData } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmptyState,
  OrderStatusBadge,
  PageHeading,
  PaymentStatusBadge,
  type Notify,
} from "@/components/admin/shared";
import { currency, dateShort, dateTime } from "@/lib/utils";

export function OverviewView({
  notify,
  goTo,
}: {
  notify: Notify;
  goTo: (id: string) => void;
}) {
  const { orders, customers, products } = useAppData();
  const valueOf = (order: (typeof orders)[number]) =>
    order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const openOrders = orders.filter(
    (order) => !["Entregue", "Cancelado"].includes(order.status),
  );
  const paid = orders
    .filter((order) => order.paymentStatus === "Pago")
    .reduce((sum, order) => sum + valueOf(order), 0);
  const pending = orders
    .filter((order) => order.paymentStatus !== "Pago")
    .reduce((sum, order) => sum + valueOf(order), 0);
  const unpaid = orders.filter((order) => order.paymentStatus !== "Pago");
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - (6 - index));
    return day;
  });
  const chartCounts = chartDays.map(
    (day) =>
      orders.filter(
        (order) =>
          new Date(order.createdAt).toISOString().slice(0, 10) ===
          day.toISOString().slice(0, 10),
      ).length,
  );
  const maxChartCount = Math.max(1, ...chartCounts);
  const chartBars = chartCounts.map((count) =>
    count ? Math.max(14, (count / maxChartCount) * 100) : 4,
  );

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="DADOS DO BACKEND"
        title="Visão geral da operação"
        description="Resumo dos pedidos, clientes e valores carregados do Banco de Dados."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Package />}
          label="Pedidos em andamento"
          value={String(openOrders.length).padStart(2, "0")}
          detail={`${orders.length} pedidos no total`}
          accent="lime"
        />
        <Metric
          icon={<CircleDollarSign />}
          label="Vendas recebidas"
          value={currency(paid)}
          detail="Pedidos com pagamento confirmado"
          accent="violet"
        />
        <Metric
          icon={<Clock3 />}
          label="Valores em aberto"
          value={currency(pending)}
          detail={`${unpaid.length} pagamentos aguardando`}
          accent="amber"
        />
        <Metric
          icon={<Users />}
          label="Clientes cadastrados"
          value={String(customers.length).padStart(2, "0")}
          detail="Na DataBase"
          accent="cyan"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_.85fr]">
        <Card className="overflow-hidden transition-transform duration-300 ease-out hover:scale-102 hover:border-lime-300">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-sm">Movimento de pedidos</CardTitle>
              <p className="mt-1 text-[10px] text-zinc-600">
                Últimos 7 dias · Pedidos salvos no backend
              </p>
            </div>
            <button
              onClick={() =>
                notify(
                  "Gráfico calculado a partir dos pedidos do PostgreSQL local.",
                )
              }
              className="rounded-lg p-2 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
              aria-label="Informações do gráfico"
            >
              <TrendingUp className="size-4" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-1.5 border-b border-white/[.07] px-1 sm:gap-2.5">
              {chartBars.map((bar, index) => (
                <div
                  key={index}
                  className="group relative flex h-full flex-1 items-end"
                >
                  <div
                    style={{ height: `${bar}%` }}
                    className={`w-full rounded-t-[4px] transition-colors group-hover:bg-lime-200 ${index === chartBars.length - 1 ? "bg-lime-300" : "bg-lime-300/20"}`}
                  />
                  <div className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[#292d2d] px-1.5 py-1 text-[8px] text-white group-hover:block">
                    {Math.round(bar / 8)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-[9px] text-zinc-600">
              {chartDays.map((day) => (
                <span key={day.toISOString()}>
                  {day.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    timeZone: "UTC",
                  })}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-300 ease-out hover:scale-102 hover:border-lime-300" onClick={() => goTo("finance")}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Pagamentos próximos</CardTitle>
              <p className="mt-1 text-[10px] text-zinc-600">
                Valores em aberto por pedido
              </p>
            </div>
            <button
              onClick={() => goTo("finance")}
              className="flex items-center gap-1 text-[10px] font-medium text-lime-300 transition hover:text-lime-200"
            >
              Ver todos <ArrowRight className="size-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-1">
            {unpaid.length ? (
              unpaid.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 transition hover:bg-white/[.03]"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#232627] text-[9px] font-semibold text-zinc-300">
                      {order.customerName
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-zinc-200">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-[9px] text-zinc-600">
                        Vence em {dateShort(order.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-zinc-200">
                      {currency(valueOf(order))}
                    </p>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="Tudo em dia"
                text="Não há pagamentos pendentes."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_.85fr]">
        <Card className="transition-transform duration-300 ease-out hover:scale-102 hover:border-lime-300" onClick={() => goTo("orders")}>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Pedidos recentes</CardTitle>
              <p className="mt-1 text-[10px] text-zinc-600">
                Acompanhe as últimas solicitações
              </p>
            </div>
            <button
              onClick={() => goTo("orders")}
              className="flex items-center gap-1 text-[10px] font-medium text-lime-300 transition hover:text-lime-200"
            >
              Ver pedidos <ArrowRight className="size-3" />
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/[.05]">
              {orders.length ? (
                orders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime-300/[.08] text-lime-200">
                        <Package className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-200">
                          {order.customerName}
                        </p>
                        <p className="mt-1 truncate text-[9px] text-zinc-600">
                          #{order.id} · {order.items[0]?.productName}
                          {order.items.length > 1
                            ? ` +${order.items.length - 1}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-[9px] text-zinc-600">
                        {dateTime(order.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="Ainda não há pedidos"
                  text="Os pedidos recebidos pelo catálogo aparecerão aqui."
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-transform duration-300 ease-out hover:scale-102 hover:border-lime-300">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Estoque em atenção</CardTitle>
              <p className="mt-1 text-[10px] text-zinc-600">
                Produtos com até 8 unidades
              </p>
            </div>

            <button
              onClick={() => goTo("products")}
              className="flex items-center gap-1 text-[10px] font-medium text-lime-300 transition hover:text-lime-200"
            >
              Ver estoque <ArrowRight className="size-3" />
            </button>
          </CardHeader>
          <CardContent className="space-y-1">
            {products.filter((product) => product.stock <= 8 && product.active)
              .length ? (
              products
                .filter((product) => product.stock <= 8 && product.active)
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-white/[.03]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-rose-400/[.08] text-rose-300">
                        <Package className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-200">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-[9px] text-zinc-500">
                          {product.stock === 0
                            ? "Sem estoque"
                            : "Estoque baixo"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={product.stock === 0 ? "danger" : "warning"}>
                      {product.stock} un.
                    </Badge>
                  </div>
                ))
            ) : (
              <EmptyState
                title="Estoque saudável"
                text="Todos os produtos estão acima do limite."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




// CARD METRIC UI/
function Metric({ icon,label,value,detail,accent,}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  const styles: Record<string, string> = {
    lime: "bg-lime-300/10 text-lime-200",
    violet: "bg-violet-300/10 text-violet-200",
    amber: "bg-amber-300/10 text-amber-200",
    cyan: "bg-cyan-300/10 text-cyan-200",
  };
  return (
    <Card className="transition-transform duration-300 ease-out hover:scale-102 hover:rotate-1 hover:border-lime-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between ">
          <span
            className={`grid size-9 place-items-center rounded-xl ${styles[accent]}`}
          >
            {icon}
          </span>
          <ArrowUpRight className="size-3.5 text-zinc-700" />
        </div>
        <p className="mt-4 text-[10px] text-zinc-500">{label}</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-white">
          {value}
        </p>
        <p className="mt-1 truncate text-[9px] text-zinc-600">{detail}</p>
      </CardContent>
    </Card>
  );
}
