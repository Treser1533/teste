import type { ReactNode, SelectHTMLAttributes } from "react";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export type Notify = (message: string) => void;

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-[10px] font-semibold tracking-[.2em] text-lime-300">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-zinc-300">
        {label}
        <span className="mt-2 block">{children}</span>
      </label>
      {hint && <p className="mt-1.5 text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full rounded-xl border border-white/10 bg-[#101213] px-3.5 text-sm text-zinc-200 outline-none transition focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/10 ${className}`}
      {...props}
    />
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-thin overflow-x-auto rounded-2xl border border-white/[.07] bg-[#17191a]">
      <table className="w-full min-w-[720px] border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] font-semibold tracking-[.12em] text-zinc-600">
      {children}
    </th>
  );
}
export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3.5 text-xs text-zinc-400 ${className}`}>
      {children}
    </td>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "Entregue"
      ? "success"
      : status === "Pronto"
        ? "violet"
        : status === "Em separação"
          ? "warning"
          : status === "Cancelado"
            ? "danger"
            : "muted";
  return <Badge variant={variant}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const variant =
    status === "Pago"
      ? "success"
      : status === "Atrasado"
        ? "danger"
        : "warning";
  return (
    <Badge variant={variant}>
      <span
        className={`size-1.5 rounded-full ${status === "Pago" ? "bg-emerald-300" : status === "Atrasado" ? "bg-rose-300" : "bg-amber-200"}`}
      />
      {status}
    </Badge>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 py-14 text-center">
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-1 text-xs text-zinc-600">{text}</p>
    </div>
  );
}
