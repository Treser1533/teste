"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Bell,
  Boxes,
  ChartArea,
  ChartAreaIcon,
  ChartScatterIcon,
  ChevronDown,
  CircleDollarSign,
  Command,
  Cylinder,
  LayoutDashboard,
  LoaderCircle,
  LucideChartNoAxesColumnDecreasing,
  Menu,
  Package,
  Settings2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OverviewView } from "@/components/admin/overview-view";
import { OrdersView } from "@/components/admin/orders-view";
import { CustomersView } from "@/components/admin/customers-view";
import { ProductsView } from "@/components/admin/products-view";
import { BrandsView } from "@/components/admin/brands-view";
import { FinanceView } from "@/components/admin/finance-view";
import type { Notify } from "@/components/admin/shared";
import { SettingsDialog } from "./settings-dialog";
import { useAppData } from "@/components/app-provider";
import { apiRequest } from "@/lib/api";

const navItems = [
  {
    id: "overview",
    label: "Visão geral",
    icon: LayoutDashboard,
    group: "WORKSPACE",
  },
  { id: "orders", label: "Pedidos", icon: Boxes, count: true },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "products", label: "Produtos", icon: Package },
  {
    id: "brands",
    label: "Marcas & sabores",
    icon: Sparkles,
    group: "CATÁLOGO",
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: CircleDollarSign,
    group: "GESTÃO",
  },
];
const titles: Record<string, string> = {
  overview: "Visão geral",
  orders: "Pedidos",
  customers: "Clientes",
  products: "Produtos",
  brands: "Marcas & sabores",
  finance: "Financeiro",
};

export function AdminShell() {
  const { backendStatus, backendError, ready } = useAppData();
  const [active, setActive] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

  // Controla a abertura do modal e as preferências visuais do perfil local. / Modal Configs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("Acesso Local");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState("");

  const notify: Notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };
  

  // Lê as preferências salvas neste navegador depois que o componente monta.
  useEffect(() => {
    const savedName = window.localStorage.getItem("nevoa-os-profile-name");
    const savedMotion = window.localStorage.getItem("nevoa-os-reduce-motion");
    if (savedName) setDisplayName(savedName);
    if (savedMotion) setReduceMotion(savedMotion === "true");
  }, []);

  function changeReduceMotion(enabled: boolean) {
    // Persiste a preferência e aplica a classe CSS no painel.
    setReduceMotion(enabled);
    window.localStorage.setItem("nevoa-os-reduce-motion", String(enabled));
  }

  function saveDisplayName(name: string) {
    // O nome é uma identificação visual; não cria usuário ou sessão de login.
    setDisplayName(name);
    window.localStorage.setItem("nevoa-os-profile-name", name);
  }


  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get("section");
    if (section && navItems.some((item) => item.id === section)) {
      setActive(section);
    }
  }, []);

  useEffect(() => {

    let canceled = false;

    void apiRequest<{user: {email: string } }>("/api/auth/me")
      .then(({user}) => {
        if(!canceled) setAuthenticatedEmail(user.email);
      }).catch(() => {
        if(!canceled) setAuthenticatedEmail("");
      });
    return () => {
      canceled = true;
    }
  }, []);

  const accountName = authenticatedEmail ? authenticatedEmail.split("@")[0]
  : "Carregando conta";

  const accountInitials = accountName.slice(0,2).toUpperCase();

  function openSection(id: string) {
    setActive(id);

    const url = new URL(window.location.href);
    url.searchParams.set("section", id);
    window.history.replaceState(window.history.state, "", url);

    setMobileOpen(false);
  }   

  const content =
    active === "overview" ? (
      <OverviewView notify={notify} goTo={openSection} />
    ) : active === "orders" ? (
      <OrdersView notify={notify} />
    ) : active === "customers" ? (
      <CustomersView notify={notify} />
    ) : active === "products" ? (
      <ProductsView notify={notify} />
    ) : active === "brands" ? (
      <BrandsView notify={notify} />
    ) : (
      <FinanceView notify={notify} />
    );

  const menu = (
    <>
      {navItems.map((item) => (
        <div key={item.id}>
          {item.group && (
            <p className="mb-2 mt-5 px-3 text-[9px] font-semibold tracking-[.18em] text-zinc-700">
              {item.group}
            </p>
          )}
          <button
            onClick={() => openSection(item.id)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${active === item.id ? "bg-lime-300/[.09] text-lime-200" : "text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200"}`}
          >
            <item.icon
              className={`size-4 ${active === item.id ? "text-lime-300" : "text-zinc-600 group-hover:text-zinc-300"}`}
            />
            <span className="flex-1">{item.label}</span>
          </button>
        </div>
      ))}
    </>
  );

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101213] text-sm text-zinc-400">
        <div className="flex items-center gap-3">
          <LoaderCircle className="animate-spin rounded-full text-lime-300" /> Carregando dados do Painel Admin...
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#101213] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-white/[.07] bg-[#131516] lg:flex">
        <Link
          href="/"
          className="flex h-[72px] items-center gap-3 border-b border-white/[.07] px-5"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-[#11140e]">
            <LucideChartNoAxesColumnDecreasing className="size-4"/>
          </span>
          <span>
           <span className="text-sm font-bold tracking-[.2em]">
            RN<span className="ml-1 text-lime-300">PODS</span>
          </span>
            <span className="mt-0.5 block text-[9px] tracking-wide text-zinc-500 font-sans">
              ADMIN STUDIO
            </span>
          </span>
        </Link>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {menu}
        </nav>
        <div className="border-t border-white/[.07] p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-lime-200 to-lime-500 text-[10px] font-bold text-[#1b2013]">
              {accountInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-zinc-200">
                {accountName}
              </p>
              <p className="truncate text-[9px] text-zinc-600">
                {authenticatedEmail || "Verificando sessão…"}
              </p>
            </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Abrir configurações"
            className="p-2 hover:bg-zinc-800 rounded-xl cursor-pointer transition duration-500 ease-in-out "
          >
            <Settings2 className="size-4" />
          </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[238px]">
        <header className="sticky top-0 z-20 flex h-[66px] items-center justify-between border-b border-white/[.07] bg-[#101213]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button
              className="grid size-9 place-items-center rounded-lg border border-white/[.08] text-zinc-400 lg:hidden"
              aria-label="Abrir navegação"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="size-4" />
              ) : (
                <Menu className="size-4" />
              )}
            </button>
            <div className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-zinc-300">{titles[active]}</span>
            </div>
            <p className="text-sm font-medium text-zinc-200 sm:hidden">
              {titles[active]}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Avisos"
            >
            </Button>
            <span className="hidden h-6 w-px bg-white/10 sm:block" />
            <Link
              href="/catalogo"
              className="hidden items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white sm:flex"
            >
              <ArrowLeft className="size-3.5 rotate-180" /> Ver catálogo
            </Link>
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-lime-200 to-lime-500 text-[10px] font-bold text-[#1b2013] lg:hidden">
              NL
            </span>
          </div>
        </header>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="h-full w-[285px] border-r border-white/10 bg-[#131516] p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-lime-300 text-black">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="text-xs font-bold tracking-[.15em]">
                    RN PODS
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X className="size-4 text-zinc-500" />
                </button>
              </div>
              {menu}
              <div className="mt-6 border-t border-white/[.07] pt-4">
                <Link
                  href="/catalogo"
                  className="flex items-center gap-2 text-xs text-zinc-400"
                >
                  <ArrowLeft className="size-3.5 rotate-180" /> Ver catálogo
                  independente
                </Link>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8">
          <div
            className={`mb-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[10px] leading-4 ${backendStatus === "online" ? "border-emerald-300/[.14] bg-emerald-300/[.04] text-emerald-50/75" : "border-amber-300/[.14] bg-amber-300/[.04] text-amber-50/75"}`}
          >
            <Activity className="mt-0.5 size-3.5 shrink-0" />
            <span>
              <strong className="font-semibold">
                {backendStatus === "online"
                  ? "Backend conectado."
                  : backendStatus === "connecting"
                    ? "Conectando ao backend…"
                    : "Backend desconectado."}
              </strong>{" "}
              {backendStatus === "online"
                ? "Cadastros e pedidos são enviados ao PostgreSQL local. Login, pagamentos e mensagens externas ainda não estão conectados."
                : backendStatus === "connecting"
                  ? "Carregando os dados do PostgreSQL."
                  : "Os dados não estão disponíveis e não serão salvos neste navegador. Inicie a API Fastify e confira a conexão com PostgreSQL."}
              {backendError && (
                <span className="ml-1 text-amber-200">{backendError}</span>
              )}
            </span>
          </div>
          {content}
        </main>
        <footer className="flex flex-col gap-1 border-t border-white/[.06] px-5 py-5 text-[9px] text-zinc-700 sm:flex-row sm:justify-between sm:px-8">
          <span>© 2026 RN PODS · Catálogo e gestão</span>
        </footer>
      </div>
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-lime-300/20 bg-[#1b2013] px-4 py-3 text-xs text-lime-100 shadow-2xl rise-in"
        >
          <span className="grid size-5 place-items-center rounded-full bg-lime-300/15 text-lime-300">
            ✓
          </span>
          {toast}
        </div>
      )}

           <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} displayName={displayName} onSaveDisplayName={saveDisplayName} reduceMotion={reduceMotion} onReduceMotionChange={changeReduceMotion} backendStatus={backendStatus} backendError={backendError} notify={notify} />
    </div>
  );
}
