"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  CirclePlus,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import {
  EmptyState,
  Field,
  PageHeading,
  Select,
  type Notify,
} from "@/components/admin/shared";
import type { Product } from "@/lib/types";
import { currency } from "@/lib/utils";

type ProductForm = Omit<Product, "id">;
const emptyProduct: ProductForm = {
  name: "",
  brandId: "",
  description: "",
  price: 0,
  stock: 0,
  flavors: [],
  accent: "lime",
  active: true,
  tag: "",
};
const colorNames: Record<string, string> = {
  lime: "Lima",
  orange: "Âmbar",
  violet: "Violeta",
  cyan: "Ciano",
};

export function ProductsView({ notify }: { notify: Notify }) {
  const { products, brands, saveProduct, deleteProduct, backendError} = useAppData();
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("Todas");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [flavorText, setFlavorText] = useState("");
  const [error, setError] = useState("");

  // Variaveis de Delete de Product com Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [productDeleteError, setProductDeleteError] = useState("");
  const [productDeleteAttempted, setProductDeleteAttempted] = useState(false);


  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (brandFilter === "Todas" || product.brandId === brandFilter) &&
          `${product.name} ${product.description} ${product.flavors.join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, brandFilter, query],
  );

  function create() {
    setEditing(null);
    setForm({ ...emptyProduct, brandId: brands[0]?.id ?? "" });
    setFlavorText("");
    setError("");
    setOpen(true);
  }

  function requestDeleteProduct(product: Product) {
    setProductToDelete(product)
    setProductDeleteError("");
    setProductDeleteAttempted(false);
  }

  async function confirmDeleteProduct() {
    if (!productToDelete || isDeletingProduct) return;

    setIsDeletingProduct(true);
    setProductDeleteError("");

    try {
      
      const deleted = await deleteProduct(productToDelete.id);

      if (!deleted) {
        setProductDeleteAttempted(true);
        setProductDeleteError("A API recusou ou não conseguiu concluir a exclusão");
        return;
      }

      notify(`Produto ${productToDelete.name} removido com sucesso!`);
      setProductToDelete(null);

    } catch (error) {
      setProductDeleteError("Falha ao chamar a API. Confira se o backend está ativo.")
    } finally {
      setIsDeletingProduct(false);
    }
  }

  function edit(product: Product) {
    setEditing(product);
    setForm({ ...product });
    setFlavorText(product.flavors.join(", "));
    setError("");
    setOpen(true);
  }

  async function submit() {
    const flavors = flavorText
      .split(",")
      .map((flavor) => flavor.trim())
      .filter(Boolean);
    if (form.name.trim().length < 2) {
      setError("Informe o nome do produto.");
      return;
    }
    if (!form.brandId) {
      setError("Cadastre e selecione uma marca.");
      return;
    }
    if (form.price <= 0) {
      setError("O preço deve ser maior que zero.");
      return;
    }
    if (form.stock < 0) {
      setError("O estoque não pode ser negativo.");
      return;
    }
    if (!flavors.length) {
      setError("Informe pelo menos um sabor.");
      return;
    }
    const saved = await saveProduct({
      ...form,
      id: editing?.id ?? `prod-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      flavors,
      price: Number(form.price),
      stock: Number(form.stock),
      tag: form.tag?.trim() || undefined,
    });
    if (!saved) {
      setError(
        "Não foi possível gravar no backend. Confira a conexão com a API.",
      );
      return;
    }
    setOpen(false);
    notify(
      editing
        ? "Produto atualizado no PostgreSQL."
        : "Produto salvo no PostgreSQL.",
    );
  }

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="VITRINE & ESTOQUE"
        title="Produtos"
        description="Edite preços, estoque, sabores e apresentação do catálogo."
        action={
          <Button onClick={create}>
            <Plus /> Novo produto
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar produto ou sabor"
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Filtrar por marca"
          className="w-full sm:w-48"
          value={brandFilter}
          onChange={(event) => setBrandFilter(event.target.value)}
        >
          <option value="Todas">Todas as marcas</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </div>
      {!brands.length && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3 text-[10px] text-amber-100/70">
          <Archive className="size-3.5" />
          Adicione uma marca antes de criar produtos.
        </div>
      )}
      {products.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => {
            const brand = brands.find((item) => item.id === product.brandId);
            return (
              <article
                key={product.id}
                className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#17191a] transition hover:border-white/[.14]"
              >
                <div className="relative bg-[#131516]">
                  <PodArtwork
                    accent={product.accent}
                    name={product.name}
                    brand={brand?.name}
                    compact
                  />
                  <span className="absolute left-3 top-3">
                    <Badge
                      variant={
                        product.active
                          ? product.stock > 0
                            ? "success"
                            : "danger"
                          : "muted"
                      }
                    >
                      {!product.active
                        ? "Oculto"
                        : product.stock > 0
                          ? `${product.stock} em estoque`
                          : "Esgotado"}
                    </Badge>
                  </span>
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button
                      onClick={() => edit(product)}
                      aria-label={`Editar ${product.name}`}
                      className="grid size-8 place-items-center rounded-lg border border-white/10 bg-black/30 text-zinc-400 hover:text-white"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      aria-label={`Excluir ${product.name}`}
                      onClick={() => {requestDeleteProduct(product)}}
                      className="grid size-8 place-items-center rounded-lg border border-white/10 bg-black/30 text-zinc-500 hover:text-rose-300"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-semibold tracking-[.16em] text-zinc-600">
                        {brand?.name ?? "Marca removida"}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-white">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {currency(product.price)}
                    </p>
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-8 text-[10px] leading-4 text-zinc-500">
                    {product.description || "Sem descrição."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.flavors.map((flavor) => (
                      <span
                        key={flavor}
                        className="rounded-md border border-white/[.07] px-2 py-1 text-[9px] text-zinc-500"
                      >
                        {flavor}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[.07] bg-[#17191a]">
          <EmptyState
            title="Nenhum produto cadastrado"
            text="Adicione produtos para construir seu catálogo independente."
          />
        </div>
      )}
      {products.length > 0 && !filtered.length && (
        <div className="rounded-2xl border border-dashed border-white/10">
          <EmptyState
            title="Nenhum produto encontrado"
            text="Tente outro termo ou marca."
          />
        </div>
      )}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-white/[.07] bg-[#17191a] p-3 text-[10px] leading-4 text-zinc-600">
        <CirclePlus className="mt-0.5 size-3.5 shrink-0 text-lime-300" />
        Produtos sem estoque aparecem no catálogo como indisponíveis. Alterações
        são enviadas à API e confirmadas pelo PostgreSQL local.
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <Badge variant="muted" className="mb-1">
              CATÁLOGO
            </Badge>
            <DialogTitle>
              {editing ? "Editar produto" : "Adicionar produto"}
            </DialogTitle>
            <DialogDescription>
              Defina os detalhes que serão gravados no catálogo local.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Ex.: Neblina Pro 18K"
                />
              </Field>
              <Field label="Marca">
                <Select
                  value={form.brandId}
                  onChange={(event) =>
                    setForm({ ...form, brandId: event.target.value })
                  }
                >
                  <option value="">Selecione a marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Descrição">
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Apresente o produto em poucas palavras"
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#101213] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/10"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Preço (R$)">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price || ""}
                  onChange={(event) =>
                    setForm({ ...form, price: Number(event.target.value) })
                  }
                  placeholder="119,90"
                />
              </Field>
              <Field label="Estoque">
                <Input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({ ...form, stock: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="Cor da arte">
                <Select
                  value={form.accent}
                  onChange={(event) =>
                    setForm({ ...form, accent: event.target.value })
                  }
                >
                  {Object.entries(colorNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Sabores" hint="Separe cada opção com uma vírgula.">
              <Input
                value={flavorText}
                onChange={(event) => setFlavorText(event.target.value)}
                placeholder="Uva Polar, Manga Solar, Menta"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Etiqueta (opcional)">
                <Input
                  value={form.tag ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, tag: event.target.value })
                  }
                  placeholder="Mais pedido, Novidade..."
                />
              </Field>
              <Field label="Visibilidade">
                <Select
                  value={form.active ? "ativo" : "inativo"}
                  onChange={(event) =>
                    setForm({ ...form, active: event.target.value === "ativo" })
                  }
                >
                  <option value="ativo">Visível no catálogo</option>
                  <option value="inativo">Oculto</option>
                </Select>
              </Field>
            </div>
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
            <Button disabled={!brands.length} onClick={submit}>
              {editing ? "Salvar alterações" : "Salvar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Delete Product */}
      <Dialog
        open={!!productToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingProduct) {
            setProductToDelete(null);
            setProductDeleteError("");
            setProductDeleteAttempted(false);
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
              Excluir este produto?
            </DialogTitle>
            <DialogDescription className="max-w-sm leading-6">
              O produto será removido do catálogo. Os itens de pedidos anteriores permanecem no histórico.
            </DialogDescription>
          </DialogHeader>

          {productToDelete && (
            <div className="mt-5 rounded-xl border border-white/[.08] bg-[#111314] p-4 text-center">
              <p className="text-sm font-semibold text-zinc-100">
                {productToDelete.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {currency(productToDelete.price)} · {productToDelete.flavors.length} sabores
              </p>
            </div>
          )}

          {productDeleteError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-200"
            >
              <p>{productDeleteError}</p>
              {productDeleteAttempted && backendError && (
                <p className="mt-1 break-words text-rose-200/70">
                  Detalhe da API: {backendError}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingProduct}
              onClick={() => {
                setProductToDelete(null);
                setProductDeleteError("");
                setProductDeleteAttempted(false);
              }}
            >
              Manter produto
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingProduct}
              onClick={confirmDeleteProduct}
            >
              {isDeletingProduct ? "Excluindo…" : "Sim, excluir produto"}
              {!isDeletingProduct && <Trash2 />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
