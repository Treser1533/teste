"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowDownToLine,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  Pencil,
  Search,
} from "lucide-react";
import { useAppData } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  Field,
  PageHeading,
  PaymentStatusBadge,
  TableCell,
  TableHead,
  TableWrap,
  type Notify,
} from "@/components/admin/shared";
import type { Order, PaymentStatus } from "@/lib/types";
import { currency, dateShort } from "@/lib/utils";

export function FinanceView({ notify }: { notify: Notify }) {
  const { orders, saveOrder } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | PaymentStatus>("Todos");
  const [editing, setEditing] = useState<Order | null>(null);
  const [dueDate, setDueDate] = useState("");
  const amount = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const paid = orders.filter((order) => order.paymentStatus === "Pago");
  const pending = orders.filter((order) => order.paymentStatus === "Pendente");
  const late = orders.filter((order) => order.paymentStatus === "Atrasado");
  const pendingTotal = [...pending, ...late].reduce(
    (sum, order) => sum + amount(order),
    0,
  );
  const receivedTotal = paid.reduce((sum, order) => sum + amount(order), 0);
  const filtered = useMemo(
    () =>
      orders
        .filter(
          (order) =>
            (filter === "Todos" || order.paymentStatus === filter) &&
            `${order.customerName} ${order.id} ${order.customerPhone}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [orders, filter, query],
  );
  const customersWithPending = new Set(
    [...pending, ...late].map((order) => order.customerId),
  ).size;
  const customersPaid = new Set(paid.map((order) => order.customerId)).size;

  async function markPaid(order: Order) {
    if (await saveOrder({ ...order, paymentStatus: "Pago" }))
      notify(
        `Status de pagamento de ${order.customerName} salvo no backend. A confirmação financeira continua manual.`,
      );
  }
  function openDue(order: Order) {
    setEditing(order);
    setDueDate(order.dueDate);
  }
  async function saveDue() {
    if (!editing || !dueDate) return;
    if (!(await saveOrder({ ...editing, dueDate }))) return;
    setEditing(null);
    notify(`Data prevista do pedido ${editing.id} gravada no backend.`);
  }

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="CONTROLE DE RECEBIMENTOS"
        title="Financeiro"
        description="Visualize pagamentos pendentes, recebidos e as datas combinadas."
        action={
          <Button
            variant="secondary"
            onClick={() => notify("Exportação ainda não implementada.")}
          >
            <ArrowDownToLine /> Exportar resumo
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <FinanceMetric
          icon={<CircleDollarSign />}
          label="Total recebido"
          value={currency(receivedTotal)}
          detail={`${customersPaid} clientes com pagamento`}
          color="emerald"
        />
        <FinanceMetric
          icon={<Clock3 />}
          label="Em aberto"
          value={currency(pendingTotal)}
          detail={`${customersWithPending} clientes com valor pendente`}
          color="amber"
        />
        <FinanceMetric
          icon={<CalendarClock />}
          label="Pagamentos pendentes"
          value={String(pending.length + late.length).padStart(2, "0")}
          detail={`${pending.length} no prazo · ${late.length} atrasados`}
          color="rose"
        />
        <FinanceMetric
          icon={<Check />}
          label="Pedidos pagos"
          value={String(paid.length).padStart(2, "0")}
          detail="Status registrados no backend; sem cobrança real"
          color="violet"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">
            Resumo por pedido
          </h2>
          <p className="mt-1 text-[10px] text-zinc-600">
            Valores previstos e registros gravados no PostgreSQL local
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <Input
              className="pl-9 sm:w-64"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar cliente ou pedido"
            />
          </div>
          <div className="flex gap-1">
            {(["Todos", "Pendente", "Atrasado", "Pago"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`rounded-lg px-2.5 py-2 text-[10px] transition ${filter === status ? "bg-white/[.09] text-white" : "text-zinc-600 hover:text-zinc-300"}`}
                >
                  {status}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {orders.length ? (
        <div className="mt-3">
          <TableWrap>
            <thead className="border-b border-white/[.07] bg-[#141617]">
              <tr>
                <TableHead>CLIENTE</TableHead>
                <TableHead>PEDIDO</TableHead>
                <TableHead>VALOR</TableHead>
                <TableHead>DATA PREVISTA</TableHead>
                <TableHead>STATUS DO PAGAMENTO</TableHead>
                <TableHead>AÇÃO</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.045]">
              {filtered.map((order) => (
                <tr key={order.id} className="transition hover:bg-white/[.02]">
                  <TableCell>
                    <span className="font-medium text-zinc-200">
                      {order.customerName}
                    </span>
                    <span className="mt-1 block text-[9px] text-zinc-600">
                      {order.customerPhone || "Telefone não informado"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-zinc-300">
                      #{order.id}
                    </span>
                    <span className="mt-1 block max-w-48 truncate text-[9px] text-zinc-600">
                      {order.items.map((item) => item.productName).join(", ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-200">
                    {currency(amount(order))}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => openDue(order)}
                      className="flex items-center gap-1.5 text-zinc-400 transition hover:text-lime-200"
                    >
                      <CalendarClock className="size-3 text-zinc-600" />
                      {order.paymentStatus === "Pago" ? (
                        <span className="text-emerald-300/70">Recebido</span>
                      ) : (
                        <span
                          className={
                            order.paymentStatus === "Atrasado"
                              ? "text-rose-300"
                              : ""
                          }
                        >
                          {dateShort(order.dueDate)}
                        </span>
                      )}
                      <Pencil className="ml-1 size-3 opacity-40" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    {order.paymentStatus === "Pago" ? (
                      <span className="text-[10px] text-zinc-700">
                        Confirmado
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 text-[10px]"
                        onClick={() => markPaid(order)}
                      >
                        Marcar pago <Check />
                      </Button>
                    )}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/[.07] bg-[#17191a]">
          <EmptyState
            title="Sem movimentações financeiras"
            text="Os pedidos e pagamentos do catálogo aparecerão aqui."
          />
        </div>
      )}
      {orders.length > 0 && !filtered.length && (
        <div className="mt-3 rounded-xl border border-dashed border-white/10">
          <EmptyState
            title="Nenhum pagamento encontrado"
            text="Ajuste a busca ou o filtro de status."
          />
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <PaymentList
          title="A receber"
          subtitle="Clientes com pagamento pendente"
          entries={[...pending, ...late]}
          kind="pending"
          onUpdate={markPaid}
          amount={amount}
        />
        <PaymentList
          title="Já recebidos"
          subtitle="Clientes com pagamento confirmado"
          entries={paid}
          kind="paid"
          onUpdate={markPaid}
          amount={amount}
        />
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-300/[.12] bg-violet-300/[.04] p-3 text-[10px] leading-4 text-zinc-500">
        <CircleDollarSign className="mt-0.5 size-3.5 shrink-0 text-violet-200" />
        O status “Pago” é gravado no PostgreSQL, mas apenas classifica o pedido;
        nenhuma transação financeira é processada.
      </div>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <Badge variant="muted" className="mb-1">
              DADOS DE PAGAMENTO
            </Badge>
            <DialogTitle>Editar previsão</DialogTitle>
            <DialogDescription>
              {editing?.customerName} · pedido {editing?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5">
            <Field label="Data prevista de pagamento">
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveDue}>
              Salvar data <Check />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FinanceMetric({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-300/10 text-emerald-200",
    amber: "bg-amber-300/10 text-amber-200",
    rose: "bg-rose-300/10 text-rose-200",
    violet: "bg-violet-300/10 text-violet-200",
  };
  return (
    <div className="rounded-2xl border border-white/[.08] bg-[#17191a] p-4">
      <div className="flex items-center justify-between">
        <span
          className={`grid size-9 place-items-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </span>
        {color === "rose" ? (
          <span className="size-1.5 rounded-full bg-rose-300" />
        ) : null}
      </div>
      <p className="mt-4 text-[10px] text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-1 truncate text-[9px] text-zinc-600">{detail}</p>
    </div>
  );
}

function PaymentList({
  title,
  subtitle,
  entries,
  kind,
  onUpdate,
  amount,
}: {
  title: string;
  subtitle: string;
  entries: Order[];
  kind: "paid" | "pending";
  onUpdate: (order: Order) => void;
  amount: (order: Order) => number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#17191a]">
      <div className="flex items-center justify-between border-b border-white/[.06] p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="mt-1 text-[10px] text-zinc-600">{subtitle}</p>
        </div>
        <Badge variant={kind === "paid" ? "success" : "warning"}>
          {entries.length} {entries.length === 1 ? "pedido" : "pedidos"}
        </Badge>
      </div>
      {entries.length ? (
        <div className="divide-y divide-white/[.045]">
          {entries.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-200">
                  {order.customerName}
                </p>
                <p className="mt-1 truncate text-[9px] text-zinc-600">
                  #{order.id} ·{" "}
                  {kind === "paid"
                    ? "Pagamento confirmado"
                    : `Previsto para ${dateShort(order.dueDate)}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-zinc-200">
                    {currency(amount(order))}
                  </p>
                  <div className="mt-1">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>
                {kind === "pending" && (
                  <button
                    aria-label={`Marcar pagamento ${order.id} como pago`}
                    onClick={() => onUpdate(order)}
                    className="grid size-8 place-items-center rounded-lg border border-white/[.07] text-zinc-500 hover:border-emerald-300/20 hover:bg-emerald-300/[.08] hover:text-emerald-200"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            kind === "paid"
              ? "Nenhum pagamento confirmado"
              : "Nenhuma pendência"
          }
          text={
            kind === "paid"
              ? "Pagamentos marcados como recebidos aparecerão aqui."
              : "Todos os pagamentos estão em dia."
          }
        />
      )}
    </section>
  );
}
