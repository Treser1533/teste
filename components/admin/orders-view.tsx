"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ClipboardList,
  Delete,
  DeleteIcon,
  Edit3,
  FileText,
  Plus,
  Search,
  Trash,
  Trash2,
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
  Select,
  TableCell,
  TableHead,
  TableWrap,
  type Notify,
} from "@/components/admin/shared";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/lib/types";
import { escapeHtml, currency, dateShort, dateTime } from "@/lib/utils";

const orderStatuses: OrderStatus[] = [
  "Novo",
  "Em separação",
  "Pronto",
  "Entregue",
  "Cancelado",
];
const paymentStatuses: PaymentStatus[] = ["Pendente", "Pago", "Atrasado"];

// Imprimir Nota para os pedidos dos pods
function printOrderNote(order: Order, notify: Notify) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    notify("Permita a abertura de pop-ups para gerar a nota do pedido.");
    return;
  }

  printWindow.opener = null;
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.productName)}<small>${escapeHtml(item.flavor || "—")}</small></td>
          <td class="number">${escapeHtml(item.quantity)}</td>
          <td class="number">${escapeHtml(currency(item.unitPrice))}</td>
          <td class="number">${escapeHtml(currency(item.quantity * item.unitPrice))}</td>
        </tr>`,
    )
    .join("");
  const note = order.note?.trim()
    ? `<section class="note"><h2>Observações</h2><p>${escapeHtml(order.note.trim())}</p></section>`
    : "";
  const total = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const html = `<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Nota do pedido ${escapeHtml(order.id)}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #181818; font: 14px/1.5 Arial, sans-serif; }
          header { display: flex; justify-content: space-between; gap: 24px; padding-bottom: 20px; border-bottom: 2px solid #222; }
          .eyebrow { margin: 0 0 5px; color: #666; font-size: 10px; font-weight: 700; letter-spacing: .12em; }
          h1 { margin: 0; font-size: 24px; }
          .order-id { text-align: right; }
          .order-id strong { display: block; font-size: 16px; }
          .muted { color: #666; font-size: 12px; }
          .section { margin-top: 24px; }
          h2 { margin: 0 0 10px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
          .customer { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
          .label { display: block; color: #777; font-size: 10px; text-transform: uppercase; }
          table { width: 100%; margin-top: 24px; border-collapse: collapse; }
          th { padding: 9px 8px; background: #f0f0f0; font-size: 10px; text-align: left; text-transform: uppercase; }
          td { padding: 11px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
          td small { display: block; color: #666; }
          .number { text-align: right; white-space: nowrap; }
          .total { display: flex; justify-content: space-between; margin-top: 14px; padding: 13px 8px; border-top: 2px solid #222; font-size: 16px; font-weight: 700; }
          .note { margin-top: 24px; padding: 12px; border: 1px solid #ddd; }
          .note p { margin: 0; white-space: pre-wrap; }
          footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #ddd; color: #777; font-size: 10px; }
          @media screen { body { max-width: 800px; margin: 36px auto; padding: 28px; box-shadow: 0 2px 18px #0002; } }
        </style>
      </head>
      <body>
        <header>
          <div><p class="eyebrow">COMPROVANTE</p><h1>Nota do pedido</h1></div>
          <div class="order-id"><strong>#${escapeHtml(order.id)}</strong><span class="muted">Criado em ${escapeHtml(dateTime(order.createdAt))}</span></div>
        </header>
        <section class="section">
          <h2>Dados do cliente</h2>
          <div class="customer">
            <div><span class="label">Nome</span>${escapeHtml(order.customerName)}</div>
            <div><span class="label">Telefone</span>${escapeHtml(order.customerPhone || "Não informado")}</div>
            <div><span class="label">Status do pedido</span>${escapeHtml(order.status)}</div>
            <div><span class="label">Pagamento</span>${escapeHtml(order.paymentStatus)}</div>
            <div><span class="label">Vencimento</span>${escapeHtml(dateShort(order.dueDate))}</div>
          </div>
        </section>
        <table>
          <thead><tr><th>Produto e sabor</th><th class="number">Qtd.</th><th class="number">Unitário</th><th class="number">Subtotal</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total"><span>Total do pedido</span><span>${escapeHtml(currency(total))}</span></div>
        ${note}
        <footer>Comprovante para conferência do pedido. Não substitui nota fiscal.</footer>
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}

export function OrdersView({ notify }: { notify: Notify }) {
  const { orders, customers, products, saveOrder, deleteOrder } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [editing, setEditing] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [flavor, setFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  // Variaveis de apagar Order
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteAttemped, setDeleteAttemped] = useState(false);


  const visibleOrders = useMemo(
    () =>
      [...orders]
        .filter(
          (order) =>
            (filter === "Todos" ||
              order.status === filter ||
              order.paymentStatus === filter) &&
            `${order.id} ${order.customerName} ${order.customerPhone} ${order.items.map((item) => item.productName).join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, filter, query],
  );
  const selectedProduct = products.find((product) => product.id === productId);
  const orderTotal = (order: Order) =>
    order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function changeStatus(order: Order, status: OrderStatus) {
    if (await saveOrder({ ...order, status }))
      notify(`Pedido ${order.id} gravado com status “${status}”.`);
  }
  async function changePayment(order: Order, paymentStatus: PaymentStatus) {
    if (await saveOrder({ ...order, paymentStatus }))
      notify(`Pagamento de ${order.id} atualizado no backend.`);
  }
  function openCreate() {
    setCreating(true);
    setCustomerId(customers[0]?.id ?? "");
    setProductId(
      products.find((product) => product.active && product.stock > 0)?.id ?? "",
    );
    setFlavor("");
    setQuantity(1);
    setNote("");
    setError("");
  }

  async function createOrder() {
    const customer = customers.find((item) => item.id === customerId);
    const product = products.find((item) => item.id === productId);
    if (!customer || !product || product.stock < 1) {
      setError("Escolha um cliente e um produto disponível.");
      return;
    }
    if (!flavor || quantity < 1 || quantity > product.stock) {
      setError("Revise o sabor e a quantidade escolhidos.");
      return;
    }
    const order: Order = {
      id: `RN-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: [
        {
          productId: product.id,
          productName: product.name,
          flavor,
          quantity,
          unitPrice: product.price,
        },
      ],
      status: "Novo",
      paymentStatus: "Pendente",
      createdAt: new Date().toISOString(),
      dueDate,
      note: note.trim() || undefined,
    };
    if (!(await saveOrder(order))) {
      setError("O backend não confirmou a gravação do pedido.");
      return;
    }
    setCreating(false);
    notify(`Pedido ${order.id} criado para ${customer.name}.`);
  }

  // Deletar Produtos da Database /// PRIMEIRA ROTINA
  // async function removeOrder(order: Order) {
  //   const confirmed = window.confirm(
  //     `Tem certeza que deseja excluir o pedido ${order.id}? Esta ação não pode ser desfeita.`
  //   );

  //  if (!confirmed) return;

  //   if (await deleteProduct(order.id)) {
  //     notify(`Pedido ${order.id} excluído com sucesso!.`);
  //   }

  // }


  // Delete Pedido Com Modal
  function requestDeleteOrder(order: Order) {
    setDeleteError("");
    setOrderToDelete(order);
    setDeleteAttemped(false);
  }

  async function confirmDeleteOrder() {
    if (!orderToDelete || isDeletingOrder ) return;

    
    setIsDeletingOrder(true);
    setDeleteError("");

    try {
      const deleted = await deleteOrder(orderToDelete.id);

      if (!deleted) {
        setDeleteAttemped(true);
        setDeleteError("A API recusou ou não conseguiu concluir a exclusão.")
        return;
      }

      notify(`Pedido ${orderToDelete.id} excluído com sucesso!`)
      setOrderToDelete(null);
    } catch {
      setDeleteError("Falha ao chamar a API. Confira se o backend está ativo.");
    } finally {
      setIsDeletingOrder(false);
    }
}

  async function saveEdited() {
    if (!editing) return;
    if (!editing.dueDate) {
      setError("Informe uma data prevista de pagamento.");
      return;
    }
    if (
      !editing.items.length ||
      editing.items.some((item) => item.quantity < 1 || !item.flavor)
    ) {
      setError("Adicione ao menos um item e confira as quantidades e sabores.");
      return;
    }
    if (!(await saveOrder(editing))) {
      setError("Não foi possível gravar as alterações no backend.");
      return;
    }
    setEditing(null);
    setError("");
    notify(`Detalhes do pedido ${editing.id} atualizados.`);
  }

  function updateEditingItem(index: number, patch: Partial<OrderItem>) {
    setEditing((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item, itemIndex) =>
              itemIndex === index ? { ...item, ...patch } : item,
            ),
          }
        : current,
    );
  }

  function changeEditingProduct(index: number, nextProductId: string) {
    const product = products.find((item) => item.id === nextProductId);
    const currentItem = editing?.items[index];
    if (!product || !currentItem) return;
    updateEditingItem(index, {
      productId: product.id,
      productName: product.name,
      flavor: product.flavors[0] ?? "",
      unitPrice: product.price,
      quantity: Math.min(currentItem.quantity, Math.max(1, product.stock)),
    });
  }

  function addEditingItem() {
    const product = products.find((item) => item.active && item.stock > 0);
    if (!product) {
      setError("Não há produtos disponíveis para adicionar.");
      return;
    }
    setEditing((current) =>
      current
        ? {
            ...current,
            items: [
              ...current.items,
              {
                productId: product.id,
                productName: product.name,
                flavor: product.flavors[0] ?? "",
                quantity: 1,
                unitPrice: product.price,
              },
            ],
          }
        : current,
    );
    setError("");
  }

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="ACOMPANHAMENTO"
        title="Pedidos"
        description="Organize os pedidos recebidos e acompanhe cada etapa."
        action={
          <Button onClick={openCreate}>
            <Plus /> Novo pedido
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <Input
            placeholder="Buscar pedido ou cliente"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">Exibir</span>
          <Select
            className="h-9 w-auto min-w-36"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option>Todos</option>
            {orderStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
            {paymentStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </Select>
        </div>
      </div>

      {orders.length ? (
        <TableWrap>
          <thead className="border-b border-white/[.07] bg-[#141617]">
            <tr>
              <TableHead>PEDIDO</TableHead>
              <TableHead>CLIENTE</TableHead>
              <TableHead>ITENS</TableHead>
              <TableHead>TOTAL</TableHead>
              <TableHead>STATUS DO PEDIDO</TableHead>
              <TableHead>PAGAMENTO</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>VENCIMENTO</TableHead>
              <TableHead>AÇOES</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.045]">
            {visibleOrders.map((order) => (
              <tr key={order.id} className="transition hover:bg-white/[.02]">
                <TableCell>
                  <button
                    onClick={() => setEditing(order)}
                    className="text-left"
                  >
                    <span className="font-semibold text-zinc-200">
                      #{order.id}
                    </span>
                    <span className="mt-1 block text-[9px] text-zinc-600">
                      {dateTime(order.createdAt)}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <span className="block font-medium text-zinc-200">
                    {order.customerName}
                  </span>
                  <span className="mt-1 block text-[10px] text-zinc-600">
                    {order.customerPhone || "Telefone não informado"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block max-w-40 truncate text-zinc-300">
                    {order.items
                      .map((item) => `${item.quantity}× ${item.productName}`)
                      .join(", ")}
                  </span>
                  <span className="mt-1 block max-w-40 truncate text-[10px] text-zinc-600">
                    {order.items.map((item) => item.flavor).join(", ")}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-zinc-200">
                  {currency(orderTotal(order))}
                </TableCell>
                <TableCell>
                  <Select
                    aria-label={`Status do pedido ${order.id}`}
                    className="h-8 min-w-32 py-1 text-[10px]"
                    value={order.status}
                    onChange={(event) =>
                      changeStatus(order, event.target.value as OrderStatus)
                    }
                  >
                    {orderStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    aria-label={`Pagamento do pedido ${order.id}`}
                    className="h-8 min-w-28 py-1 text-[10px]"
                    value={order.paymentStatus}
                    onChange={(event) =>
                      changePayment(order, event.target.value as PaymentStatus)
                    }
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="mt-1">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`flex items-center gap-1.5 text-[10px] ${order.paymentStatus === "Atrasado" ? "text-rose-300" : "text-zinc-500"}`}
                  >
                    <CalendarDays className="size-3" />
                    {dateShort(order.dueDate)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex">
                    <button
                      onClick={() => printOrderNote(order, notify)}
                      className="grid size-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.06] hover:text-zinc-200"
                      aria-label={`Gerar nota PDF do pedido ${order.id}`}
                      title="Gerar nota em PDF"
                    >
                      <FileText className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(order);
                        setError("");
                      }}
                      className="grid size-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.06] hover:text-zinc-200"
                      aria-label={`Editar pedido ${order.id}`}
                      title="Editar Pedido"
                    >
                      <Edit3 className="size-3.5" />
                    </button>

                    <button
                      onClick={() => requestDeleteOrder(order)}
                      className="grid size-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.06] hover:text-zinc-200"
                      aria-label={`Excluir pedido ${order.id}`}
                      title="Excluir pedido"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <div className="rounded-2xl border border-white/[.07] bg-[#17191a]">
          <EmptyState
            title="Nenhum pedido por enquanto"
            text="Os pedidos enviados pelo catálogo vão aparecer aqui."
          />
        </div>
      )}
      {orders.length > 0 && visibleOrders.length === 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-white/10">
          <EmptyState
            title="Nenhum resultado"
            text="Ajuste a busca ou o filtro para encontrar pedidos."
          />
        </div>
      )}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-300/[.12] bg-violet-300/[.04] p-3 text-[10px] leading-4 text-zinc-500">
        <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-violet-200" />
        Pedidos e status são gravados no PostgreSQL local. Marcar um pagamento
        altera apenas o registro; não movimenta dinheiro.
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <Badge className="mb-1">CADASTRO</Badge>
            <DialogTitle>Novo pedido</DialogTitle>
            <DialogDescription>
              Registre um pedido manual no backend local.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <Field label="Cliente">
              <Select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <option value="">Selecione um cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} · {customer.phone}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Produto">
                <Select
                  value={productId}
                  onChange={(event) => {
                    setProductId(event.target.value);
                    setFlavor("");
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {products
                    .filter((product) => product.active && product.stock > 0)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {currency(product.price)}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Sabor">
                <Select
                  value={flavor}
                  onChange={(event) => setFlavor(event.target.value)}
                >
                  <option value="">Selecione um sabor</option>
                  {selectedProduct?.flavors.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Quantidade">
                <Input
                  type="number"
                  min={1}
                  max={selectedProduct?.stock ?? 1}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(event.target.value)))
                  }
                />
              </Field>
              <Field label="Vencimento do pagamento">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </Field>
            </div>
            <Field label="Observação de entrega">
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ex.: combinar período da tarde"
              />
            </Field>
            {selectedProduct && (
              <div className="flex justify-between rounded-xl border border-white/[.07] bg-[#111314] px-3 py-2.5 text-xs">
                <span className="text-zinc-500">Subtotal do pedido</span>
                <span className="font-medium text-white">
                  {currency(selectedProduct.price * quantity)}
                </span>
              </div>
            )}
            {error && (
              <p role="alert" className="text-xs text-rose-300">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
            <Button onClick={createOrder}>
              Criar pedido <Check />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setError("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Badge variant="muted" className="mb-1">
              #{editing?.id}
            </Badge>
            <DialogTitle>Editar pedido</DialogTitle>
            <DialogDescription>
              {editing?.customerName} · atualize os dados, itens e andamento.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="mt-5 grid gap-4">
              <Field label="Cliente">
                <Select
                  value={editing.customerId}
                  onChange={(event) => {
                    const customer = customers.find(
                      (item) => item.id === event.target.value,
                    );
                    if (customer)
                      setEditing({
                        ...editing,
                        customerId: customer.id,
                        customerName: customer.name,
                        customerPhone: customer.phone,
                      });
                  }}
                >
                  {!customers.some(
                    (customer) => customer.id === editing.customerId,
                  ) && (
                    <option value={editing.customerId}>
                      {editing.customerName} · histórico
                    </option>
                  )}
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} · {customer.phone}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Status do pedido">
                  <Select
                    value={editing.status}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        status: event.target.value as OrderStatus,
                      })
                    }
                  >
                    {orderStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status do pagamento">
                  <Select
                    value={editing.paymentStatus}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        paymentStatus: event.target.value as PaymentStatus,
                      })
                    }
                  >
                    {paymentStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Data prevista de pagamento">
                <Input
                  type="date"
                  value={editing.dueDate}
                  onChange={(event) =>
                    setEditing({ ...editing, dueDate: event.target.value })
                  }
                />
              </Field>
              <div className="rounded-xl border border-white/[.07] bg-[#111314] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold tracking-[.12em] text-zinc-600">
                    ITENS DO PEDIDO
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addEditingItem}
                  >
                    <Plus /> Adicionar item
                  </Button>
                </div>
                <div className="space-y-3">
                  {editing.items.map((item, index) => {
                    const product = products.find(
                      (candidate) => candidate.id === item.productId,
                    );
                    return (
                      <div
                        key={`${item.productId}-${index}`}
                        className="grid gap-2 rounded-xl border border-white/[.05] bg-[#17191a] p-3 sm:grid-cols-[1.25fr_1fr_.55fr_auto] sm:items-end"
                      >
                        <Field label="Produto">
                          <Select
                            value={item.productId}
                            onChange={(event) =>
                              changeEditingProduct(index, event.target.value)
                            }
                          >
                            <option value={item.productId}>
                              {product?.name ?? item.productName}
                            </option>
                            {products
                              .filter(
                                (candidate) =>
                                  candidate.active &&
                                  candidate.stock > 0 &&
                                  candidate.id !== item.productId,
                              )
                              .map((candidate) => (
                                <option key={candidate.id} value={candidate.id}>
                                  {candidate.name}
                                </option>
                              ))}
                          </Select>
                        </Field>
                        <Field label="Sabor">
                          <Select
                            value={item.flavor}
                            disabled={!product}
                            onChange={(event) =>
                              updateEditingItem(index, {
                                flavor: event.target.value,
                              })
                            }
                          >
                            {product?.flavors.map((flavor) => (
                              <option key={flavor}>{flavor}</option>
                            ))}
                            {!product && <option>{item.flavor}</option>}
                          </Select>
                        </Field>
                        <Field label="Qtd.">
                          <Input
                            type="number"
                            min={1}
                            max={Math.max(1, product?.stock ?? 99)}
                            value={item.quantity}
                            onChange={(event) =>
                              updateEditingItem(index, {
                                quantity: Math.min(
                                  Math.max(1, product?.stock ?? 99),
                                  Math.max(1, Number(event.target.value)),
                                ),
                              })
                            }
                          />
                        </Field>
                        <button
                          type="button"
                          disabled={editing.items.length <= 1}
                          onClick={() =>
                            setEditing({
                              ...editing,
                              items: editing.items.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            })
                          }
                          aria-label="Remover item"
                          className="mb-0.5 grid size-9 place-items-center rounded-lg text-zinc-600 hover:bg-rose-300/[.08] hover:text-rose-300 disabled:opacity-30"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <p className="text-[10px] text-zinc-600 sm:col-span-4">
                          {currency(item.unitPrice)} por unidade
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 border-t border-white/[.06] pt-2 text-right text-sm font-semibold text-white">
                  Total · {currency(orderTotal(editing))}
                </p>
              </div>
              <Field label="Observação">
                <Input
                  value={editing.note ?? ""}
                  onChange={(event) =>
                    setEditing({ ...editing, note: event.target.value })
                  }
                  placeholder="Informação útil sobre este pedido"
                />
              </Field>
              {error && (
                <p role="alert" className="text-xs text-rose-300">
                  {error}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdited}>
              Salvar alterações <Check />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!orderToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingOrder) {
            setOrderToDelete(null);
            setDeleteError("");
            setDeleteAttemped(false);
          }
        }}
      >
        <DialogContent className="max-w-md border-rose-300/15 bg-[#17191a] shadow-[0_24px_100px_rgba(0,0,0,.65)] [&>button:last-child]:hidden">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl border border-rose-300/15 bg-rose-300/[.08] text-rose-300">
            <Trash2 className="size-6" />
          </div>

          <DialogHeader className="items-center text-center">
            <Badge variant="danger">Ação permanente</Badge>
            <DialogTitle className="mt-2 text-xl">
              Excluir este pedido?
            </DialogTitle>
            <DialogDescription className="max-w-sm leading-6">
              O pedido será removido do banco de dados..
            </DialogDescription>
          </DialogHeader>

          {orderToDelete && (
            <div className="mt-5 rounded-xl border border-white/[.08] bg-[#111314] p-4 text-center">
              <p className="text-sm font-semibold text-zinc-100">
                #{orderToDelete.id}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {orderToDelete.customerName}
              </p>
            </div>
          )}

          {deleteError && (
            <div role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-200">
              <p>{deleteError}</p>
            </div>
          )}

          <DialogFooter className="mt-6 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingOrder}
              onClick={() => setOrderToDelete(null)}
            >
              Manter pedido
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingOrder}
              onClick={confirmDeleteOrder}
            >
              {isDeletingOrder ? "Excluindo…" : "Sim, excluir pedido"}
              {!isDeletingOrder && <Trash2 />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>



  );
}
