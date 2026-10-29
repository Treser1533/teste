"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CirclePlus,
  Layers3,
  Pencil,
  Plus,
  Sparkles,
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
  Select,
  type Notify,
} from "@/components/admin/shared";
import type { Brand } from "@/lib/types";

type Mode = "brand" | "flavor";

type FlavorDeleteTarget = {
  brandId: string;
  brandName: string;
  name: string;
  productCount: number;
}

export function BrandsView({ notify }: { notify: Notify }) {
  const { brands, products, saveBrand, deleteBrand, saveProduct, backendError } =
    useAppData();
  const [mode, setMode] = useState<Mode>("brand");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [flavorName, setFlavorName] = useState("");
  const [flavorBrandId, setFlavorBrandId] = useState("");
  const [flavorProductId, setFlavorProductId] = useState("");
  const [error, setError] = useState("");
  const [editingFlavor, setEditingFlavor] = useState<{
    name: string;
    brandId: string;
  } | null>(null);

  // Variaveis Delete Modal Marcas/Sabores
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDeletingBrand, setIsDeletingBrand] = useState(false);
  const [brandDeleteError, setBrandDeleteError] = useState("");
  const [brandDeleteAttempted, setBrandDeleteAttempted] = useState(false);

  const [flavorToDelete, setFlavorToDelete] =
    useState<FlavorDeleteTarget | null>(null);
  const [isDeletingFlavor, setIsDeletingFlavor] = useState(false);
  const [flavorDeleteError, setFlavorDeleteError] = useState("");
  const [flavorDeleteAttempted, setFlavorDeleteAttempted] = useState(false);

  const flavorsByBrand = useMemo(
    () =>
      brands.map((brand) => {
        const grouped = new Map<string, string[]>();
        products
          .filter((product) => product.brandId === brand.id)
          .forEach((product) =>
            product.flavors.forEach((flavor) =>
              grouped.set(flavor, [...(grouped.get(flavor) ?? []), product.id]),
            ),
          );
        return {
          brand,
          flavors: [...grouped.entries()].map(([name, productIds]) => ({
            name,
            productIds: [...new Set(productIds)],
          })),
        };
      }),
    [brands, products],
  );

  function startBrand(brand?: Brand) {
    setMode("brand");
    setEditing(brand ?? null);
    setBrandName(brand?.name ?? "");
    setDescription(brand?.description ?? "");
    setError("");
    setOpen(true);
  }
  function startFlavor(brandId: string, flavor?: string) {
    setMode("flavor");
    const product =
      products.find((item) => item.brandId === brandId && item.active) ??
      products.find((item) => item.brandId === brandId);
    setEditingFlavor(flavor ? { name: flavor, brandId } : null);
    setFlavorName(flavor ?? "");
    setFlavorBrandId(brandId);
    setFlavorProductId(product?.id ?? "");
    setError("");
    setOpen(true);
  }

  async function submitBrand() {
    if (brandName.trim().length < 2) {
      setError("Informe um nome para a marca.");
      return;
    }
    if (
      brands.some(
        (brand) =>
          brand.name.toLowerCase() === brandName.trim().toLowerCase() &&
          brand.id !== editing?.id,
      )
    ) {
      setError("Já existe uma marca com esse nome.");
      return;
    }
    const saved = await saveBrand({
      id: editing?.id ?? `brand-${Date.now()}`,
      name: brandName.trim(),
      description: description.trim(),
      active: editing?.active ?? true,
    });
    if (!saved) {
      setError("A API não confirmou a gravação da marca.");
      return;
    }
    setOpen(false);
    notify(
      editing
        ? "Marca atualizada no PostgreSQL."
        : "Marca salva no PostgreSQL.",
    );
  }

  async function submitFlavor() {
    const destination = products.filter(
      (product) => product.brandId === flavorBrandId,
    );
    if (flavorName.trim().length < 2) {
      setError("Informe um nome de sabor.");
      return;
    }
    if (!destination.length) {
      setError("Adicione um produto a esta marca antes de cadastrar sabores.");
      return;
    }
    if (
      destination.some((product) =>
        product.flavors.some(
          (flavor) =>
            flavor.toLowerCase() === flavorName.trim().toLowerCase() &&
            flavor.toLowerCase() !== editingFlavor?.name.toLowerCase(),
        ),
      )
    ) {
      setError("Este sabor já está cadastrado para a marca.");
      return;
    }
    if (editingFlavor) {
      const results = await Promise.all(
        destination.map((product) =>
          saveProduct({
            ...product,
            flavors: product.flavors.map((flavor) =>
              flavor === editingFlavor.name ? flavorName.trim() : flavor,
            ),
          }),
        ),
      );
      if (results.some((saved) => !saved)) {
        setError("Nem todos os produtos foram atualizados no backend.");
        return;
      }
      notify("Sabor atualizado nos produtos desta marca.");
    } else {
      const target = products.find((product) => product.id === flavorProductId);
      if (!target) {
        setError("Selecione um produto disponível.");
        return;
      }
      if (
        !(await saveProduct({
          ...target,
          flavors: [...target.flavors, flavorName.trim()],
        }))
      ) {
        setError("A API não confirmou a gravação do sabor.");
        return;
      }
      notify(`Sabor adicionado a ${target.name}.`);
    }
    setOpen(false);
  }

  function requestDeleteBrand(brand: Brand) {
    setBrandToDelete(brand);
    setBrandDeleteError("");
    setBrandDeleteAttempted(false);
  }

  async function confirmDeleteBrand() {
    if (!brandToDelete || isDeletingBrand) return;

    const attachedProducts = products.filter((product) => product.brandId === brandToDelete.id);

    if (attachedProducts.length > 0) {
      setBrandDeleteError("Remova ou reassocie os produtos desta marca antes de excluí-la.")
      return;
    }

    setIsDeletingBrand(true);
    setBrandDeleteError("");

    try {
      
      const deleted = await deleteBrand(brandToDelete.id);

      if(!deleted) {
        setBrandDeleteAttempted(true);
        setBrandDeleteError("A API não confirmou a exclusão da marca.");
        return;
      }

      notify(`Marca ${brandToDelete.name} removida.`);
      setBrandToDelete(null);
    } catch (error) {
      setBrandDeleteError("Falha ao chamar a API. Confira se o backend está ativo.");
    } finally {
      setIsDeletingBrand(false);
    }
  }

function removeFlavor(
  brandId: string,
  name: string,
  brandName: string,
  productCount: number
) {
  setFlavorToDelete({ brandId, brandName, name, productCount });
  setFlavorDeleteError("");
  setFlavorDeleteAttempted(false);
}

async function confirmDeleteFlavor() {
  if (!flavorToDelete || isDeletingFlavor) return;
  setIsDeletingFlavor(true);
  setFlavorDeleteError("");
  try {
    const targets = products.filter((product) => product.brandId === flavorToDelete.brandId && product.flavors.includes(flavorToDelete.name));
    if (!targets.length) {
      setFlavorDeleteAttempted(true);
      setFlavorDeleteError("Esse sabor já não está vinculado aos produtos desta marca.");
      return;
    }

    const productsWithoutAnotherFlavor = targets.filter((product) => product.flavors.length === 1);
    if (productsWithoutAnotherFlavor.length) {
      const productNames = productsWithoutAnotherFlavor.map((product) => `“${product.name}”`).join(", ");
      setFlavorDeleteError(`Não é possível remover este sabor porque ele é o único em ${productNames}. Adicione outro sabor a esses produtos primeiro.`);
      return;
    }

    const results = await Promise.all(targets.map((product) => saveProduct({ ...product, flavors: product.flavors.filter((flavor) => flavor !== flavorToDelete.name) })));
    if (results.some((saved) => !saved)) {
      setFlavorDeleteAttempted(true);
      setFlavorDeleteError("A API não confirmou a remoção do sabor em todos os produtos.");
      return;
    }
    notify(`Sabor “${flavorToDelete.name}” removido dos produtos de ${flavorToDelete.brandName}.`);
    setFlavorToDelete(null);
  } catch {
    setFlavorDeleteError("Falha ao chamar a API. Confira se o backend está ativo.");
  } finally {
    setIsDeletingFlavor(false);
  }
}

  return (
    <div className="rise-in">
      <PageHeading
        eyebrow="IDENTIDADE DO CATÁLOGO"
        title="Marcas & sabores"
        description="Mantenha as marcas e opções de sabor da vitrine em ordem."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => startFlavor(brands[0]?.id ?? "")}
              disabled={!brands.length}
            >
              <Sparkles /> Novo sabor
            </Button>
            <Button onClick={() => startBrand()}>
              <Plus /> Nova marca
            </Button>
          </div>
        }
      />
      {!brands.length ? (
        <div className="rounded-2xl border border-white/[.07] bg-[#17191a]">
          <EmptyState
            title="Comece pelas marcas"
            text="Crie uma marca para adicionar produtos e sabores à vitrine."
          />
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {flavorsByBrand.map(({ brand, flavors }) => {
            const brandProducts = products.filter(
              (product) => product.brandId === brand.id,
            );
            return (
              <section
                key={brand.id}
                className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#17191a]"
              >
                <div className="flex items-start justify-between gap-3 border-b border-white/[.07] p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-lime-300/10 text-lime-200">
                      <Layers3 className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        {brand.name}
                      </h2>
                      <p className="mt-1 line-clamp-1 text-[10px] text-zinc-600">
                        {brand.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startBrand(brand)}
                      className="grid size-8 place-items-center rounded-lg text-zinc-600 hover:bg-white/[.06] hover:text-zinc-200"
                      aria-label={`Editar marca ${brand.name}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => requestDeleteBrand(brand)}
                      className="grid size-8 place-items-center rounded-lg text-zinc-700 hover:bg-rose-300/[.08] hover:text-rose-300"
                      aria-label={`Excluir marca ${brand.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex gap-2">
                    <Badge variant="muted">
                      {brandProducts.length} produtos
                    </Badge>
                    <Badge variant="muted">{flavors.length} sabores</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startFlavor(brand.id)}
                  >
                    <CirclePlus /> Adicionar sabor
                  </Button>
                </div>
                <div className="space-y-1 px-4 pb-4">
                  {flavors.length ? (
                    flavors.map((flavor) => (
                      <div
                        key={flavor.name}
                        className="flex items-center justify-between rounded-xl border border-white/[.045] bg-[#131516] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded-lg bg-violet-300/[.08] text-violet-200">
                            <Sparkles className="size-3" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs text-zinc-300">
                              {flavor.name}
                            </p>
                            <p className="mt-0.5 text-[9px] text-zinc-700">
                              Em {flavor.productIds.length}{" "}
                              {flavor.productIds.length === 1
                                ? "produto"
                                : "produtos"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startFlavor(brand.id, flavor.name)}
                            className="grid size-7 place-items-center rounded-lg text-zinc-600 hover:bg-white/[.06] hover:text-white"
                            aria-label={`Editar sabor ${flavor.name}`}
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            onClick={() =>
                              removeFlavor(
                                brand.id,
                                flavor.name,
                                brand.name,
                                flavor.productIds.length
                              )
                            }
                            className="grid size-7 place-items-center rounded-lg text-zinc-700 hover:bg-rose-300/[.08] hover:text-rose-300"
                            aria-label={`Excluir sabor ${flavor.name}`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/[.08]">
                      <EmptyState
                        title="Sem sabores cadastrados"
                        text="Adicione sabores para incluir opções nos produtos."
                      />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <div className="mt-4 rounded-xl border border-white/[.07] bg-[#17191a] p-3 text-[10px] leading-4 text-zinc-600">
        Sabores pertencem aos produtos. Ao adicionar um sabor, escolha em qual
        produto ele estará disponível; a lista reúne as opções de cada marca.
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <Badge variant="muted" className="mb-1">
              {mode === "brand" ? "IDENTIDADE" : "OPÇÕES DO CATÁLOGO"}
            </Badge>
            <DialogTitle>
              {mode === "brand"
                ? editing
                  ? "Editar marca"
                  : "Adicionar marca"
                : editingFlavor
                  ? "Editar sabor"
                  : "Adicionar sabor"}
            </DialogTitle>
            <DialogDescription>
              {mode === "brand"
                ? "Organize o nome e a apresentação desta marca."
                : "Sabores são adicionados aos produtos e aparecem na vitrine."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4">
            {mode === "brand" ? (
              <>
                <Field label="Nome da marca">
                  <Input
                    autoFocus
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                    placeholder="Ex.: Neblina"
                  />
                </Field>
                <Field label="Descrição">
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Uma breve apresentação da marca"
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#101213] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/10"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Marca">
                  <Select
                    disabled={!!editingFlavor}
                    value={flavorBrandId}
                    onChange={(event) => {
                      setFlavorBrandId(event.target.value);
                      setFlavorProductId(
                        products.find(
                          (product) => product.brandId === event.target.value,
                        )?.id ?? "",
                      );
                    }}
                  >
                    <option value="">Selecione a marca</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                {!editingFlavor && (
                  <Field label="Adicionar ao produto">
                    <Select
                      value={flavorProductId}
                      onChange={(event) =>
                        setFlavorProductId(event.target.value)
                      }
                    >
                      <option value="">Selecione o produto</option>
                      {products
                        .filter((product) => product.brandId === flavorBrandId)
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                    </Select>
                  </Field>
                )}
                <Field label="Nome do sabor">
                  <Input
                    autoFocus
                    value={flavorName}
                    onChange={(event) => setFlavorName(event.target.value)}
                    placeholder="Ex.: Cereja Ice"
                  />
                </Field>
              </>
            )}
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
            <Button onClick={mode === "brand" ? submitBrand : submitFlavor}>
              {mode === "brand"
                ? editing
                  ? "Salvar alterações"
                  : "Salvar marca"
                : editingFlavor
                  ? "Salvar sabor"
                  : "Adicionar sabor"}{" "}
              <Check />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modais Delete Marca/Sabores */}
      <Dialog
        open={!!brandToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingBrand) {
            setBrandToDelete(null);
            setBrandDeleteError("");
            setBrandDeleteAttempted(false);
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
              Excluir esta marca?
            </DialogTitle>
            <DialogDescription className="max-w-sm leading-6">
              Marcas com produtos vinculados não podem ser excluídas.
            </DialogDescription>
          </DialogHeader>

          {brandToDelete && (
            <div className="mt-5 rounded-xl border border-white/[.08] bg-[#111314] p-4 text-center">
              <p className="text-sm font-semibold text-zinc-100">
                {brandToDelete.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {products.filter((product) => product.brandId === brandToDelete.id).length}{" "}
                produtos vinculados
              </p>
            </div>
          )}

          {brandDeleteError && (
            <div role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-200">
              <p>{brandDeleteError}</p>
              {brandDeleteAttempted && backendError && (
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
              disabled={isDeletingBrand}
              onClick={() => setBrandToDelete(null)}
            >
              Manter marca
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={
                isDeletingBrand ||
                !!brandToDelete &&
                  products.some((product) => product.brandId === brandToDelete.id)
              }
              onClick={confirmDeleteBrand}
            >
              {isDeletingBrand ? "Excluindo…" : "Sim, excluir marca"}
              {!isDeletingBrand && <Trash2 />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!flavorToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeletingFlavor) {
            setFlavorToDelete(null);
            setFlavorDeleteError("");
            setFlavorDeleteAttempted(false);
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
              Excluir este sabor?
            </DialogTitle>
            <DialogDescription className="max-w-sm leading-6">
              O sabor será removido de todos os produtos desta marca.
            </DialogDescription>
          </DialogHeader>

          {flavorToDelete && (
            <div className="mt-5 rounded-xl border border-white/[.08] bg-[#111314] p-4 text-center">
              <p className="text-sm font-semibold text-zinc-100">
                {flavorToDelete.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {flavorToDelete.brandName} · {flavorToDelete.productCount}{" "}
                {flavorToDelete.productCount === 1 ? "produto" : "produtos"}
              </p>
            </div>
          )}

          {flavorDeleteError && (
            <div role="alert" className="mt-3 rounded-xl border border-rose-300/20 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-200">
              <p>{flavorDeleteError}</p>
              {flavorDeleteAttempted && backendError && (
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
              disabled={isDeletingFlavor}
              onClick={() => setFlavorToDelete(null)}
            >
              Manter sabor
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingFlavor}
              onClick={confirmDeleteFlavor}
            >
              {isDeletingFlavor ? "Excluindo…" : "Sim, excluir sabor"}
              {!isDeletingFlavor && <Trash2 />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
