"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { LoaderCircle } from "lucide-react";

type AuthStatus = "checking" | "allowed" | "redirecting";

export function AdminGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    // A API só responde com sucesso se o cookie da sessão for válido.
    void apiRequest("/api/auth/me")
      .then(() => {
        if (!cancelled) {
          setStatus("allowed");
        }
      })
      .catch(() => {
        if (cancelled) return;

        setStatus("redirecting");
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Não renderiza o painel enquanto a API não confirmar a sessão.
  if (status !== "allowed") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#101213] text-sm text-zinc-400">
        <div className="flex items-center gap-3">
          <LoaderCircle className="animate-spin rounded-full text-lime-300" /> 
            {status === "checking"
            ? "Verificando sua sessão…"
            : "Sessão inválida. Redirecionando para o login…"}
        </div>
      </main>
    );
  }

  return <>{children}</>;
}