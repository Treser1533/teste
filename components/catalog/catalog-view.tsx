"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleCheck,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Webhook,
  MessageCircle,
} from "lucide-react";
import { useAppData } from "@/components/app-provider";
import { PodArtwork } from "@/components/catalog/pod-artwork";
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
import type { Customer, Order, Product } from "@/lib/types";
import { currency } from "@/lib/utils";

export function CatalogView() {
  const {
    brands,
    products,
    customers,
    saveCustomer,
    saveOrder,
    backendStatus,
    ready,
  } = useAppData();
  const [activeBrand, setActiveBrand] = useState("Todas");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [flavor, setFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const listed = useMemo(
    () =>
      products.filter(
        (product) =>
          product.active &&
          (activeBrand === "Todas" || product.brandId === activeBrand) &&
          `${product.name} ${brands.find((brand) => brand.id === product.brandId)?.name ?? ""} ${product.flavors.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, brands, activeBrand, query],
  );

  function openProduct(product: Product) {
    setSelected(product);
    setFlavor(product.flavors[0] ?? "");
    setQuantity(1);
    setError("");
  }

  async function submitOrder() {
    if (!selected) return;
    if (customerName.trim().length < 3) {
      setError("Informe seu nome para identificar o pedido.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Confira o telefone informado.");
      return;
    }
    if (!flavor) {
      setError("Escolha um sabor disponível.");
      return;
    }
    const normalizedPhone = phone.replace(/\D/g, "");
    const existing = customers.find(
      (customer) => customer.phone.replace(/\D/g, "") === normalizedPhone,
    );
    const customer: Customer = existing ?? {
      id: `cust-${Date.now()}`,
      name: customerName.trim(),
      phone: phone.trim(),
      email: "",
      city: "Não informado",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setSubmitting(true);
    if (!existing && !(await saveCustomer(customer))) {
      setSubmitting(false);
      setError(
        "Não foi possível salvar o cliente. Confira se o backend está conectado.",
      );
      return;
    }
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 3);
    const order: Order = {
      id: `RN-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: [
        {
          productId: selected.id,
          productName: selected.name,
          flavor,
          quantity,
          unitPrice: selected.price,
        },
      ],
      status: "Novo",
      paymentStatus: "Pendente",
      createdAt: now.toISOString(),
      dueDate: due.toISOString().slice(0, 10),
    };
    const saved = await saveOrder(order);
    setSubmitting(false);
    if (!saved) {
      setError(
        "O pedido não foi gravado. Confira a conexão com a API e tente novamente.",
      );
      return;
    }
    setSelected(null);
    setConfirmed(order);
  }

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101213] text-sm text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="size-2 animate-pulse rounded-full bg-lime-300" />
          Carregando catálogo…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#101213]">
      <div className="relative isolate overflow-hidden border-b border-white/[.07]">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-70" />
        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-[#11140e]">
              <Sparkles className="size-4" />
            </span>
            <span className="text-xs font-bold tracking-[.2em] text-white">
              RNPODS <span className="text-lime-300">STUDIO</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="muted" className="hidden sm:inline-flex">
              Vitrine independente
            </Badge>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin">
                Administração <ArrowRight />
              </Link>
            </Button>
          </div>
        </header>
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-11 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              <ArrowLeft className="size-3.5" /> Início
            </Link>
            <p className="mb-3 text-[10px] font-semibold tracking-[.22em] text-lime-300">
              COLEÇÃO OUTONO · 2026
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-.045em] text-white sm:text-6xl">
              Encontre seu
              <br className="sm:hidden" /> próximo favorito.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-400 sm:text-base">
              Explore os produtos, escolha um sabor e envie seu pedido em poucos
              passos.
            </p>
          </div>
          <div className="rounded-2xl border border-white/[.08] bg-[#17191a]/80 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-lime-300/10 text-lime-200">
                <Shield className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-zinc-200">
                  Catálogo conectado
                </p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                  Pedidos são registrados no PostgreSQL local.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-white/[.07] pt-3 text-[10px] text-zinc-500">
              <CircleCheck className="size-3.5 shrink-0 text-lime-300" />{" "}
              {backendStatus === "online"
                ? "Backend pronto para gravar pedidos."
                : backendStatus === "connecting"
                  ? "Conectando com o servidor local…"
                  : "Backend desconectado; envio indisponível."}
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[.2em] text-zinc-600">
              VITRINE
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Produtos selecionados
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar produto ou sabor"
                className="pl-9"
              />
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[{ id: "Todas", name: "Todas" }, ...brands].map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand.id)}
                  className={`whitespace-nowrap rounded-full border px-3 py-2 text-[11px] font-medium transition ${activeBrand === brand.id ? "border-lime-300/25 bg-lime-300/10 text-lime-200" : "border-white/[.08] bg-white/[.025] text-zinc-500 hover:text-zinc-300"}`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {listed.length ? (
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {listed.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                brand={
                  brands.find((item) => item.id === product.brandId)?.name ??
                  "Marca"
                }
                onChoose={() => openProduct(product)}
                delay={index * 60}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-3xl border border-dashed border-white/10 py-16 text-center">
            <Search className="mx-auto size-6 text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">
              Nenhum produto encontrado
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Tente outra busca ou selecione uma marca diferente.
            </p>
          </div>
        )}
        <div className="mt-12 rounded-2xl border border-white/[.07] bg-[#17191a] p-5 sm:flex sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-11 place-items-center rounded-2xl bg-violet-300/10 text-violet-200">
              <ShoppingBag className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">
                Seu pedido será confirmado aqui
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Acompanhe a simulação no painel administrativo.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4 sm:mt-0">
            <Link href="/admin">
              Abrir painel administrativo <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/[.06] px-5 py-6 text-center text-[10px] text-zinc-600">
        Névoa Studio · Catálogo local de exemplo · Não processa pagamentos
      </footer>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl p-0 sm:overflow-hidden">
          {selected && (
            <div className="grid sm:grid-cols-[.85fr_1.15fr]">
              <div className="relative flex min-h-[240px] items-center justify-center border-b border-white/[.06] bg-[#121415] p-6 sm:border-b-0 sm:border-r">
                <PodArtwork
                  accent={selected.accent}
                  name={selected.name}
                  brand={
                    brands.find((brand) => brand.id === selected.brandId)?.name
                  }
                />
                <span className="absolute left-5 top-5">
                  <Badge variant={selected.stock > 0 ? "success" : "muted"}>
                    {selected.stock > 0 ? "Em estoque" : "Sem estoque"}
                  </Badge>
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <DialogHeader>
                  <p className="text-[10px] font-semibold tracking-[.18em] text-lime-300">
                    {
                      brands.find((brand) => brand.id === selected.brandId)
                        ?.name
                    }
                  </p>
                  <DialogTitle className="pr-5 text-2xl">
                    {selected.name}
                  </DialogTitle>
                  <DialogDescription className="leading-6">
                    {selected.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-5">
                  <label className="mb-2 block text-xs font-medium text-zinc-300">
                    Escolha um sabor
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.flavors.map((item) => (
                      <button
                        key={item}
                        onClick={() => setFlavor(item)}
                        className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${flavor === item ? "border-lime-300/40 bg-lime-300/[.08] text-lime-100" : "border-white/[.08] bg-white/[.02] text-zinc-400 hover:border-white/20"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="catalog-name"
                      className="mb-2 block text-xs font-medium text-zinc-300"
                    >
                      Seu nome
                    </label>
                    <Input
                      id="catalog-name"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      placeholder="Como podemos chamar você?"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="catalog-phone"
                      className="mb-2 block text-xs font-medium text-zinc-300"
                    >
                      Telefone
                    </label>
                    <Input
                      id="catalog-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-600">QUANTIDADE</p>
                    <div className="mt-1 flex items-center gap-3">
                      <button
                        aria-label="Diminuir quantidade"
                        disabled={quantity <= 1}
                        onClick={() =>
                          setQuantity((value) => Math.max(1, value - 1))
                        }
                        className="grid size-7 place-items-center rounded-lg border border-white/10 text-zinc-300 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm">
                        {quantity}
                      </span>
                      <button
                        aria-label="Aumentar quantidade"
                        disabled={
                          quantity >= selected.stock || selected.stock < 1
                        }
                        onClick={() =>
                          setQuantity((value) =>
                            Math.min(selected.stock, value + 1),
                          )
                        }
                        className="grid size-7 place-items-center rounded-lg border border-white/10 text-zinc-300 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-white">
                    {currency(selected.price * quantity)}
                  </p>
                </div>
                {error && (
                  <p role="alert" className="mt-3 text-xs text-rose-300">
                    {error}
                  </p>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Voltar
                  </Button>
                  <Button
                    disabled={
                      selected.stock < 1 ||
                      submitting ||
                      backendStatus !== "online"
                    }
                    onClick={submitOrder}
                  >
                    {submitting
                      ? "Gravando…"
                      : backendStatus !== "online"
                        ? "Backend indisponível"
                        : selected.stock < 1
                          ? "Indisponível"
                          : "Enviar pedido"}{" "}
                    <ArrowRight />
                  </Button>
                </DialogFooter>
                <p className="mt-3 flex items-center gap-1.5 text-[10px] leading-4 text-zinc-600">
                  <Shield className="size-3 shrink-0" /> O pedido será gravado
                  no backend. Pagamentos, WhatsApp e webhooks continuam
                  desativados.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmed}
        onOpenChange={(open) => {
          if (!open) setConfirmed(null);
        }}
      >
        <DialogContent className="max-w-md">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-lime-300/10 text-lime-200">
            <CircleCheck className="size-6" />
          </div>
          <DialogHeader className="items-center text-center">
            <Badge>Pedido registrado</Badge>
            <DialogTitle className="mt-2 text-2xl">
              Tudo certo por aqui.
            </DialogTitle>
            <DialogDescription>
              Seu pedido{" "}
              <span className="font-semibold text-zinc-300">
                {confirmed?.id}
              </span>{" "}
              foi gravado no PostgreSQL local.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-2.5">
            <div className="rounded-2xl border border-white/[.08] bg-[#111314] p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] text-zinc-500">
                <Webhook className="size-3.5 text-violet-300" /> WEBHOOK ·
                SIMULAÇÃO
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                Evento{" "}
                <span className="font-mono text-violet-200">order.created</span>{" "}
                preparado. Nenhum endpoint foi chamado.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[.08] bg-[#111314] p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] text-zinc-500">
                <MessageCircle className="size-3.5 text-emerald-300" /> WHATSAPP
                · SIMULAÇÃO
              </div>
              <div className="mt-2 rounded-xl bg-emerald-400/[.08] p-3 text-xs leading-5 text-zinc-300">
                Olá, {confirmed?.customerName.split(" ")[0]}! Recebemos seu
                pedido {confirmed?.id}. A equipe entrará em contato para
                combinar os próximos passos.{" "}
                <span className="mt-1 block text-[9px] text-emerald-300/70">
                  Prévia demonstrativa — não enviada
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmed(null)}>
              Continuar no catálogo
            </Button>
            <Button
              onClick={() => {
                setConfirmed(null);
                window.location.href = "/admin";
              }}
            >
              Ver no painel <ArrowRight />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ProductCard({
  product,
  brand,
  onChoose,
  delay,
}: {
  product: Product;
  brand: string;
  onChoose: () => void;
  delay: number;
}) {
  return (
    <article
      style={{ animationDelay: `${delay}ms` }}
      className="rise-in group overflow-hidden rounded-2xl border border-white/[.08] bg-[#17191a] transition-all duration-300 hover:-translate-y-1 hover:border-white/[.16] hover:shadow-xl hover:shadow-black/20"
    >
      <div className="relative bg-[#131516]">
        <PodArtwork accent={product.accent} name={product.name} brand={brand} />
        <span className="absolute left-4 top-4">
          {product.stock > 0 ? (
            <Badge variant={product.tag === "Novidade" ? "violet" : "muted"}>
              {product.tag ?? "Disponível"}
            </Badge>
          ) : (
            <Badge variant="muted">Esgotado</Badge>
          )}
        </span>
        <span className="absolute right-4 top-4 rounded-full border border-white/[.08] bg-black/20 px-2.5 py-1 text-[9px] text-zinc-400">
          {brand}
        </span>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-medium tracking-wide text-zinc-500">
          {brand.toUpperCase()}
        </p>
        <h3 className="mt-1 text-base font-semibold tracking-tight text-white">
          {product.name}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-9 text-xs leading-5 text-zinc-500">
          {product.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.flavors.slice(0, 2).map((flavor) => (
            <span
              key={flavor}
              className="rounded-md border border-white/[.07] px-2 py-1 text-[9px] text-zinc-500"
            >
              {flavor}
            </span>
          ))}
          {product.flavors.length > 2 && (
            <span className="px-1 py-1 text-[9px] text-zinc-600">
              +{product.flavors.length - 2}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/[.07] pt-4">
          <span className="text-lg font-semibold text-white">
            {currency(product.price)}
          </span>
          <Button size="sm" disabled={product.stock < 1} onClick={onChoose}>
            {product.stock > 0 ? (
              <>
                Ver produto <ChevronDown />
              </>
            ) : (
              "Indisponível"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
