"use client";

import { useMemo, useState } from "react";
import {
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
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
  TableCell,
  TableHead,
  TableWrap,
  type Notify,
} from "@/components/admin/shared";
import type { Customer } from "@/lib/types";
import { dateShort } from "@/lib/utils";

type CustomerForm = Pick<Customer, "name" | "phone" | "email" | "city">;
const blankForm: CustomerForm = { name: "", phone: "", email: "", city: "" };

export function CustomersView({ notify }: { notify: Notify }) {
  const { customers, orders, saveCustomer, deleteCustomer } = useAppData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(blankForm);
  const [error, setError] = useState("");

  // Variais Deletar Cliente
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [customerDeleteError, setCustomerDeleteError] = useState("");

  const filtered = useMemo(
    () =>
      customers.filter((customer) =>
        `${customer.name} ${customer.phone} ${customer.email} ${customer.city}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [customers, query],
  );

  function startCreate() {
    setEditing(null);
    setForm(blankForm);
    setError("");
    setOpen(true);
  }
  function startEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
    });
    setError("");
    setOpen(true);
  }
  async function submit() {
    if (form.name.trim().length < 3) {
      setError("Informe o nome completo do cliente.");
      return;
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      setError("Confira o telefone informado.");
      return;
    }
    const customer: Customer = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim() || "Não informado",
      id: editing?.id ?? `cust-${Date.now()}`,
      createdAt: editing?.createdAt ?? new Date().toISOString().slice(0, 10),
    };
    if (!(await saveCustomer(customer))) {
      setError(
        "Não foi possível gravar no backend. Confira a conexão com a API.",
      );
      return;
    }
    setOpen(false);
    notify(
      editing
        ? "Cliente atualizado no PostgreSQL."
        : "Cliente salvo no PostgreSQL.",
    );
  }

  async function confirmDeleteCostumer() {
    if (!customerToDelete || isDeletingCustomer) return;

    setIsDeletingCustomer(true);
    setCustomerDeleteError("");

    try {
      const deleted = await deleteCustomer(customerToDelete.id);

      if (!deleted) {
        setCustomerDeleteError("O backend não confirmou a exclusão do cliente.");
        return;
      }

      notify(`Cliente ${customerToDelete.name} excluído`);
      setCustomerToDelete(null);
    } catch (error) {
      setCustomerDeleteError("Falha ao chamar a API. Confira se o backend está ativo.");
    } finally {
      setIsDeletingCustomer(false);
    }
  }

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="RELACIONAMENTO"
        title="Clientes"
        description="Acesse e mantenha os dados de contato organizados."
        action={
          <Button onClick={startCreate}>
            <Plus /> Adicionar cliente
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <Input
            placeholder="Buscar nome, e-mail ou cidade"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="muted">
          <Users className="size-3" /> {customers.length} cadastros
        </Badge>
      </div>
      {customers.length ? (
        <TableWrap>
          <thead className="border-b border-white/[.07] bg-[#141617]">
            <tr>
              <TableHead>CLIENTE</TableHead>
              <TableHead>CONTATO</TableHead>
              <TableHead>LOCALIZAÇÃO</TableHead>
              <TableHead>PEDIDOS</TableHead>
              <TableHead>CADASTRO</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[.045]">
            {filtered.map((customer, index) => {
              const orderCount = orders.filter(
                (order) => order.customerId === customer.id,
              ).length;
              return (
                <tr
                  key={customer.id}
                  className="transition hover:bg-white/[.02]"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-semibold ${["bg-violet-300/10 text-violet-200", "bg-orange-300/10 text-orange-200", "bg-cyan-300/10 text-cyan-200", "bg-lime-300/10 text-lime-200"][index % 4]}`}
                      >
                        {customer.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <div>
                        <p className="font-medium text-zinc-200">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-[9px] text-zinc-600">
                          ID · {customer.id.slice(-6).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Phone className="size-3 text-zinc-600" />
                      {customer.phone}
                    </span>
                    {customer.email && (
                      <span className="mt-1.5 flex items-center gap-1.5 text-[10px] text-zinc-600">
                        <Mail className="size-3" />
                        {customer.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-zinc-600" />
                      {customer.city || "Não informado"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={orderCount ? "default" : "muted"}>
                      {orderCount} {orderCount === 1 ? "pedido" : "pedidos"}
                    </Badge>
                  </TableCell>
                  <TableCell>{dateShort(customer.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <button
                        aria-label={`Editar ${customer.name}`}
                        onClick={() => startEdit(customer)}
                        className="grid size-8 place-items-center rounded-lg text-zinc-600 hover:bg-white/[.06] hover:text-zinc-200"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        aria-label={`Excluir ${customer.name}`}
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setCustomerDeleteError("");
                        }}
                        className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-rose-300/[.08] hover:text-rose-300"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      ) : (
        <div className="rounded-2xl border border-white/[.07] bg-[#17191a]">
          <EmptyState
            title="Nenhum cliente cadastrado"
            text="Adicione seu primeiro cliente para organizar os pedidos."
          />
        </div>
      )}
      {customers.length > 0 && !filtered.length && (
        <div className="mt-3 rounded-xl border border-dashed border-white/10">
          <EmptyState
            title="Nenhum resultado"
            text="Tente buscar pelo nome, telefone ou e-mail."
          />
        </div>
      )}
      <div className="mt-4 rounded-xl border border-white/[.07] bg-[#17191a] p-3 text-[10px] text-zinc-600">
        Os registros estão no PostgreSQL local. Contatos e comunicações externas
        não são verificados nem enviados automaticamente.
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <Badge variant="muted" className="mb-1">
              CADASTRO DE CLIENTES
            </Badge>
            <DialogTitle>
              {editing ? "Editar cliente" : "Adicionar cliente"}
            </DialogTitle>
            <DialogDescription>
              O cadastro será enviado à API e gravado na sua database .
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <Field label="Nome completo">
              <Input
                autoFocus
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder="Ex.: Marina Almeida"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Telefone">
                <Input
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </Field>
              <Field label="E-mail (opcional)">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="marina@email.com"
                />
              </Field>
            </div>
            <Field label="Cidade">
              <Input
                value={form.city}
                onChange={(event) =>
                  setForm({ ...form, city: event.target.value })
                }
                placeholder="São Paulo, SP"
              />
            </Field>
            {error && (
              <p role="alert" className="text-xs text-rose-300">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>
              {editing ? "Salvar alterações" : "Salvar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!customerToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingCustomer) {
            setCustomerToDelete(null);
            setCustomerDeleteError("");
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
              Excluir este cliente?
            </DialogTitle>
            <DialogDescription className="max-w-sm leading-6">
              O cadastro será removido. Os pedidos anteriores permanecem no histórico.
            </DialogDescription>
          </DialogHeader>

          {customerToDelete && (
            <div className="mt-5 rounded-xl border border-white/[.08] bg-[#111314] p-4 text-center">
              <p className="text-sm font-semibold text-zinc-100">
                {customerToDelete.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {customerToDelete.phone}
              </p>
            </div>
          )}

          {customerDeleteError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-200"
            >
              <p>{customerDeleteError}</p>
            </div>
          )}

          <DialogFooter className="mt-6 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingCustomer}
              onClick={() => {
                setCustomerToDelete(null);
                setCustomerDeleteError("");
              }}
            >
              Manter cliente
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingCustomer}
              onClick={confirmDeleteCostumer}
            >
              {isDeletingCustomer ? "Excluindo…" : "Sim, excluir cliente"}
              {!isDeletingCustomer && <Trash2 />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
