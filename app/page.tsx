"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  MoveUpRight,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/components/app-provider";
import { currency } from "@/lib/utils";

export default function HomePage() {
  const { orders, customers, backendStatus, ready } = useAppData();
  const paidTotal = orders
    .filter((order) => order.paymentStatus === "Pago")
    .reduce(
      (total, order) =>
        total +
        order.items.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ),
      0,
    );
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return date;
  });
  const dailyOrders = lastSevenDays.map(
    (date) =>
      orders.filter(
        (order) =>
          new Date(order.createdAt).toISOString().slice(0, 10) ===
          date.toISOString().slice(0, 10),
      ).length,
  );
  const maxDailyOrders = Math.max(1, ...dailyOrders);
  const chartBars = dailyOrders.map((count) =>
    count ? Math.max(18, (count / maxDailyOrders) * 100) : 4,
  );
  const latestOrder = orders[0];
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#101213]">
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[700px]" />
      <div className="pointer-events-none absolute -right-48 top-24 size-[540px] rounded-full bg-lime-300/[.07] blur-[120px]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="RN PODS início"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-[#11140e]">
            <Sparkles className="size-5" />
          </span>
          <span className="text-sm font-bold tracking-[.2em] text-white">
            RN<span className="ml-1 text-lime-300">PODS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <Link href="/catalogo" className="transition hover:text-white">
            Catálogo
          </Link>
          <a href="#recursos" className="transition hover:text-white">
            Recursos
          </a>
          <Link href="/admin" className="transition hover:text-white">
            Área administrativa
          </Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/catalogo">
            Ver catálogo <ArrowRight />
          </Link>
        </Button>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-24 pt-14 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:pb-32 lg:pt-20">
        <div className="rise-in relative z-10 max-w-2xl">
          <Badge className="mb-7 border-lime-200/20 bg-lime-300/[.07] text-lime-200">
            <span className="size-1.5 rounded-full bg-lime-300" /> CATÁLOGO &
            GESTÃO EM UM SÓ LUGAR
          </Badge>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-white sm:text-6xl lg:text-[76px]">
            Sua operação,
            <br />
            <span className="text-zinc-500">sem névoa.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-zinc-400 sm:text-lg">
            Organize catálogo, clientes, pedidos e pagamentos com uma visão
            simples de cada etapa.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/admin">
                Abrir painel <ArrowUpRight />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/catalogo">
                Explorar catálogo <ArrowDownRight />
              </Link>
            </Button>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-zinc-500">
            <span className="flex items-center gap-2">
              <CircleCheck
                className={`size-3.5 ${backendStatus === "online" ? "text-lime-300" : "text-amber-300"}`}
              />{" "}
              {backendStatus === "online"
                ? "API PostgreSQL conectada"
                : backendStatus === "connecting"
                  ? "Conectando ao backend"
                  : "API offline"}
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-lime-300" /> Dados
              carregados do servidor local
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[510px] lg:ml-auto">
          <div className="absolute inset-8 rounded-[40px] bg-lime-300/10 blur-[80px]" />
          <div className="relative rounded-[28px] border border-white/10 bg-[#181b1c] p-4 shadow-2xl shadow-black/40 sm:p-5">
            <div className="flex items-center justify-between border-b border-white/[.07] px-2 pb-4">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-lime-300" />
                <span className="text-xs font-medium text-zinc-400">
                  Visão geral
                </span>
              </div>
              <span className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-500">
                ÚLTIMOS 7 DIAS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-4">
              <MiniMetric
                label="Vendas recebidas"
                value={ready ? currency(paidTotal) : "…"}
                trend="Status Pago no banco"
              />
              <MiniMetric
                label="Pedidos salvos"
                value={ready ? String(orders.length) : "…"}
                trend={`${customers.length} clientes no banco`}
              />
            </div>
            <div className="rounded-2xl border border-white/[.07] bg-[#111314] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">
                    Movimento de pedidos
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-600">
                    Últimos 7 dias · PostgreSQL
                  </p>
                </div>
                <span className="text-[10px] text-lime-300">
                  {ready ? `${orders.length} no total` : "Carregando"}
                </span>
              </div>
              <div className="flex h-32 items-end gap-2 sm:gap-3">
                {chartBars.map((height, index) => (
                  <div key={index} className="group relative flex-1">
                    <div
                      style={{ height: `${height}%` }}
                      className="rounded-t-md bg-lime-300/30 transition-all duration-500 group-hover:bg-lime-200"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[9px] uppercase tracking-wide text-zinc-600">
                {lastSevenDays.map((date) => (
                  <span key={date.toISOString()}>
                    {date
                      .toLocaleDateString("pt-BR", {
                        weekday: "short",
                        timeZone: "UTC",
                      })
                      .replace(".", "")}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/[.07] bg-[#111314] p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-violet-400/10 text-violet-200">
                  <Package className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-medium text-white">
                    {latestOrder
                      ? `Pedido #${latestOrder.id}`
                      : "Nenhum pedido recente"}
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    {latestOrder
                      ? `${latestOrder.customerName} · ${latestOrder.status}`
                      : "Os pedidos salvos aparecem aqui."}
                  </p>
                </div>
              </div>
              {latestOrder && (
                <Badge variant="warning">{latestOrder.status}</Badge>
              )}
            </div>
          </div>
          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/10 bg-[#1b1e1f] p-4 shadow-xl sm:block">
            <p className="text-[10px] text-zinc-500">CLIENTES NO BANCO</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex -space-x-2">
                {customers.slice(0, 3).map((customer, index) => (
                  <span
                    key={customer.id}
                    className={`grid size-7 place-items-center rounded-full border-2 border-[#1b1e1f] text-[9px] ${["bg-[#80568c]", "bg-[#a76641]", "bg-[#657c84]"][index]}`}
                  >
                    {customer.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                ))}
              </div>
              <span className="text-xs font-semibold text-white">
                {ready ? customers.length : "…"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="recursos"
        className="relative border-t border-white/[.06] bg-[#131516] px-5 py-20 sm:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[.2em] text-lime-300">
                FLUXO OPERACIONAL
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white sm:text-4xl">
                Tudo conectado à sua rotina.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-zinc-500">
              Cadastros e pedidos lidos e gravados pelo backend Fastify com
              PostgreSQL local.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            <Feature
              icon={<Package />}
              number="01"
              title="Catálogo independente"
              text="Apresente marcas, produtos e sabores em uma vitrine feita para celular e computador."
            />
            <Feature
              icon={<CircleCheck />}
              number="02"
              title="Pedidos organizados"
              text="Acompanhe cada pedido, os dados do cliente e o andamento em uma única tela."
            />
            <Feature
              icon={<MoveUpRight />}
              number="03"
              title="Visão financeira"
              text="Encontre valores pendentes, pagamentos recebidos e datas combinadas com rapidez."
            />
          </div>
        </div>
      </section>
      <footer className="flex flex-col gap-3 border-t border-white/[.06] px-5 py-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>© 2026 RN Pods Catalog</span>
        <span>
          Todos os direitos reservados
        </span>
      </footer>
    </main>
  );
}

function MiniMetric({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-[#111314] p-4">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <div className="mt-2 flex flex-col gap-1">
        <p className="text-xl font-semibold tracking-tight text-white">
          {value}
        </p>
        <span className="text-[9px] text-zinc-500">{trend}</span>
      </div>
    </div>
  );
}
function Feature({
  icon,
  number,
  title,
  text,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/[.07] bg-[#17191a] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-lime-300/20">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-lime-300/10 text-lime-200">
          {icon}
        </span>
        <span className="text-[10px] tracking-widest text-zinc-700">
          {number}
        </span>
      </div>
      <h3 className="mt-6 text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  );
}
