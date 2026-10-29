"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Check,
  LogOut,
  Server,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppData, type BackendStatus } from "@/components/app-provider";
import type { Notify } from "@/components/admin/shared";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

type SettingsSection = "profile" | "preferences" | "system";

// Esta lista alimenta os botões da mini sidebar e identifica cada conteúdo.
const settingsItems: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    id: "profile",
    label: "Perfil local",
    description: "Nome e identificação",
    icon: UserRound,
  },
  {
    id: "preferences",
    label: "Preferências",
    description: "Aparência e movimento",
    icon: SlidersHorizontal,
  },
  {
    id: "system",
    label: "Sistema",
    description: "Conexão com o backend",
    icon: Server,
  },
];

export function SettingsDialog({
  open,
  onOpenChange,
  displayName,
  onSaveDisplayName,
  reduceMotion,
  onReduceMotionChange,
  backendStatus,
  backendError,
  notify,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  onSaveDisplayName: (name: string) => void;
  reduceMotion: boolean;
  onReduceMotionChange: (enabled: boolean) => void;
  backendStatus: BackendStatus;
  backendError: string;
  notify: Notify;
}) {
   const { refreshData } = useAppData();
  const [section, setSection] = useState<SettingsSection>("profile");
  const [nameDraft, setNameDraft] = useState(displayName);

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  // Ao abrir o modal, volta para Perfil e sincroniza o campo com o nome salvo.
  useEffect(() => {
    if (open) {
      setSection("profile");
      setNameDraft(displayName);
    }
  }, [open, displayName]);

  const initials = (nameDraft.trim() || displayName)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const currentItem = settingsItems.find((item) => item.id === section)!;

  // Logout
  async function handleLogout() {
    setError("");
    setIsLoggingOut(true);

    try {
      // A API encerra a sessão e remove o cookie de autenticação.
      await apiRequest<void>("/api/auth/logout", {
        method: "POST",
      });

      router.replace("/login");
      refreshData();
    } catch (error) {
      // Se a API não confirmar, não informa que a sessão foi encerrada.
      setError("Não foi possível sair. Confira se o backend está funcionando.");
      setIsLoggingOut(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:h-[min(90vh,620px)] sm:max-h-[min(90vh,620px)] sm:overflow-hidden">
        <div className="grid min-h-[420px] sm:h-full sm:grid-cols-[205px_minmax(0,1fr)]">
          {/* Navegação interna: horizontal em telas pequenas e vertical no desktop. */}
          <aside className="border-b border-white/[.07] bg-[#131516] p-4 sm:border-b-0 sm:border-r sm:p-5">
            <Badge variant="muted">CONFIGURAÇÕES</Badge>
            <p className="mb-4 mt-2 text-[10px] leading-4 text-zinc-600">
              Preferências deste navegador.
            </p>
            <nav
              aria-label="Seções de configurações"
              className="flex gap-2 overflow-x-auto sm:flex-col"
            >
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setSection(item.id)}
                    className={`flex min-w-max items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition sm:w-full ${active ? "bg-lime-300/[.09] text-lime-200" : "text-zinc-500 hover:bg-white/[.04] hover:text-zinc-200"}`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>
                      <span className="block text-xs font-medium">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 hidden text-[9px] sm:block ${active ? "text-lime-200/60" : "text-zinc-700"}`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-h-0 min-w-0 overflow-y-auto p-5 sm:p-7">
            <DialogHeader className="mb-6">
              <p className="text-[9px] font-semibold tracking-[.18em] text-lime-300">
                {currentItem.description.toUpperCase()}
              </p>
              <DialogTitle className="text-xl">{currentItem.label}</DialogTitle>
              <DialogDescription>
                Configurações locais do RNPODS.
              </DialogDescription>
            </DialogHeader>

            {/* Perfil: atualiza nome e iniciais, armazenados no localStorage. */}
            {section === "profile" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-2xl border border-white/[.07] bg-[#111314] p-4">
                  <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-lime-200 to-lime-500 text-xs font-bold text-[#1b2013]">
                    {initials || "NL"}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-zinc-200">
                      {nameDraft.trim() || "Acesso local"}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      Perfil salvo somente neste navegador
                    </p>
                  </div>
                </div>
                <label className="block space-y-2">
                  <span className="text-xs font-medium text-zinc-300">
                    Nome exibido no painel
                  </span>
                  <Input
                    value={nameDraft}
                    maxLength={40}
                    onChange={(event) => setNameDraft(event.target.value)}
                    placeholder="Ex.: Névoa Local"
                  />
                </label>
                <p className="text-[10px] leading-5 text-zinc-600">
                  Este perfil é apenas uma identificação visual. O sistema
                  continua sem login ou autenticação.
                </p>
                <Button
                  onClick={() => {
                    const name = nameDraft.trim() || "Acesso Local";
                    setNameDraft(name);
                    onSaveDisplayName(name);
                    notify("Nome do perfil atualizado neste navegador.");
                  }}
                >
                  <Check /> Salvar perfil
                </Button>
              </div>
            )}

            {/* Preferências: aplica animações reduzidas ou mantém o tema dark. */}
            {section === "preferences" && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/[.07] bg-[#111314] p-4">
                  <p className="text-xs font-medium text-zinc-200">Tema</p>
                  <p className="mt-1 text-[10px] leading-4 text-zinc-600">
                    O tema escuro está ativo.
                  </p>
                  <Badge variant="muted" className="mt-3">
                    Dark
                  </Badge>
                </div>
              </div>
            )}

            {/* Sistema: mostra o estado que o AppDataProvider reporta da API. */}
            {section === "system" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[.07] bg-[#111314] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-lime-300" />
                      <p className="text-xs font-medium text-zinc-200">
                        API local
                      </p>
                    </div>
                    <Badge
                      variant={
                        backendStatus === "online" ? "success" : "warning"
                      }
                    >
                      {backendStatus === "online"
                        ? "Conectada"
                        : backendStatus === "connecting"
                          ? "Conectando"
                          : "Desconectada"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-zinc-500">
                    O painel usa Fastify e PostgreSQL locais. Pagamentos,
                    WhatsApp e autenticação não estão conectados.
                  </p>
                  {backendError && (
                    <p
                      role="status"
                      className="mt-3 break-words rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3 text-[10px] leading-5 text-amber-100/80"
                    >
                      {backendError}
                    </p>
                  )}
                </div>

                

                <div className="flex flex-row justify-center space-x-72">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Recarregar painel
                  </Button>
                  <Button
                    className="cursor-pointer"
                    variant="secondary"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    aria-busy={isLoggingOut}
                  >
                    <LogOut className="size-2" />
                  </Button>
                </div>


              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
