"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LucideChartNoAxesColumnDecreasing,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useAppData } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, apiRequest } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const { refreshData } = useAppData();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se já existir uma sessão, tenta levar o usuário diretamente ao painel.
  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        await apiRequest<{ user: { id: string; email: string } }>(
          "/api/auth/me",
        );

        const dataLoaded = await refreshData();

        if (cancelled) return;

        if (dataLoaded) {
          router.replace("/admin");
        } else {
          setError(
            "Sua sessão foi encontrada, mas não foi possível carregar o painel. Confira se a API está funcionando.",
          );
        }
      } catch {
        // Sem sessão: o formulário continua disponível para o login.
      }
    }

    void checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [refreshData, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim();

    // Valida o e-mail antes de fazer a requisição.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Digite um endereço de e-mail válido.");
      return;
    }

    // O backend também exige uma senha com pelo menos 12 caracteres.
    if (password.length < 5) {
      setError("A senha precisa ter pelo menos 5 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      // O backend valida as credenciais e cria o cookie HttpOnly da sessão.
      await apiRequest<{ user: { id: string; email: string } }>(
        "/api/auth/login",
        {
          method: "POST",
          body: {
            email: normalizedEmail,
            password,
          },
        },
      );

      // Confirma que a sessão funciona e carrega os dados do painel.
      const dataLoaded = await refreshData();

      if (!dataLoaded) {
        // Se os dados privados não carregarem, encerra a sessão recém-criada.
        await apiRequest("/api/auth/logout", {
          method: "POST",
        }).catch(() => undefined);

        setError(
          "O login foi aceito, mas os dados do painel não carregaram. Confira a API e tente novamente.",
        );
        return;
      }

      router.replace("/admin");
    } catch (loginError) {
      if (loginError instanceof ApiError) {
        setError(loginError.message);
      } else {
        setError(
          "Não foi possível conectar à API. Confira se o backend está iniciado.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#101213] text-white lg:grid-cols-[1.05fr_.95fr]">
      {/* Luzes decorativas sutis do tema escuro. */}
      <div className="pointer-events-none absolute -left-40 top-12 size-[420px] rounded-full bg-lime-300/[.07] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-180px] right-[-100px] size-[400px] rounded-full bg-violet-400/[.06] blur-[120px]" />

      {/* Apresentação do produto, visível em telas maiores. */}
      <section className="relative hidden min-h-screen flex-col justify-between border-r border-white/[.07] bg-[#131516] p-10 lg:flex xl:p-14">
        <Link
          href="/"
          className="flex w-fit items-center gap-3"
          aria-label="Voltar ao início do Névoa OS"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-lime-300 text-[#11140e]">
            <LucideChartNoAxesColumnDecreasing className="size-5" />
          </span>

          <span className="text-sm font-bold tracking-[.2em]">
            RN<span className="ml-1 text-lime-300">PODS</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl">
          <Badge className="border-lime-200/20 bg-lime-300/[.07] text-lime-200">
            <span className="size-1.5 rounded-full bg-lime-300" />
            PAINEL ADMINISTRATIVO
          </Badge>

          <h1 className="mt-7 text-5xl font-semibold leading-[1.04] tracking-[-.055em] xl:text-6xl">
            Sua operação,
            <br />
            <span className="text-zinc-500">em boas mãos.</span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">
            Acesse o espaço de gestão para organizar catálogo, clientes,
            pedidos e pagamentos.
          </p>

          <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
              <p className="text-[10px] tracking-wide text-zinc-600">
                CATÁLOGO
              </p>
              <p className="mt-2 text-xs font-medium text-zinc-200">
                Produtos e sabores
              </p>
            </div>

            <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
              <p className="text-[10px] tracking-wide text-zinc-600">
                GESTÃO
              </p>
              <p className="mt-2 text-xs font-medium text-zinc-200">
                Pedidos e clientes
              </p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-700">
          © 2026 RN PODS · Painel administrativo
        </p>
      </section>

      {/* Formulário de login. */}
      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-lime-300 text-[#11140e]">
                <LucideChartNoAxesColumnDecreasing className="size-4" />
              </span>

              <span className="text-xs font-bold tracking-[.18em]">
                RN<span className="ml-1 text-lime-300">PODS</span>
              </span>
            </Link>

            <Link
              href="/catalogo"
              className="text-xs text-zinc-500 transition hover:text-white"
            >
              Ver catálogo
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/[.08] bg-[#17191a]/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
            <div className="mb-7">
              <Badge variant="muted">
                <LockKeyhole className="size-3" />
                Acesso ao painel
              </Badge>

              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                Boas-vindas de volta
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Entre com o e-mail e a senha...
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              <label className="block space-y-2">
                <span className="text-xs font-medium text-zinc-300">
                  E-mail
                </span>

                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />

                  <Input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@seudominio.com"
                    className="h-11 pl-10"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-error" : undefined}
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-medium text-zinc-300">
                  Senha
                </span>

                <span className="relative block">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />

                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    minLength={12}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    className="h-11 pl-10 pr-11"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-error" : undefined}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-600 transition hover:bg-white/[.06] hover:text-zinc-200"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </span>
              </label>

              {error && (
                <p
                  id="login-error"
                  role="alert"
                  className="rounded-xl border border-rose-300/20 bg-rose-300/[.06] px-3.5 py-3 text-xs leading-5 text-rose-200"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="h-11 w-full"
                disabled={isSubmitting || !email || !password}
              >
                {isSubmitting ? "Verificando acesso…" : "Entrar no painel"}
                {!isSubmitting && <ArrowRight />}
              </Button>
            </form>

            <div className="mt-5 rounded-2xl border border-lime-300/[.13] bg-lime-300/[.035] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-lime-300" />

                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    Login conectado à API
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/[.07] pt-5">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-[10px] text-zinc-600 transition hover:text-zinc-300"
              >
                <ArrowLeft className="size-3" />
                Voltar ao início
              </Link>

              <span className="text-[9px] text-zinc-700">
                Sessão protegida por cookie
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}