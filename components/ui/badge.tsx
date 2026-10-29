import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-lime-300/20 bg-lime-300/10 text-lime-200",
        success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-300",
        warning: "border-amber-300/20 bg-amber-400/10 text-amber-200",
        danger: "border-rose-300/20 bg-rose-400/10 text-rose-300",
        muted: "border-white/10 bg-white/[.045] text-zinc-400",
        violet: "border-violet-300/20 bg-violet-400/10 text-violet-200",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
export { Badge, badgeVariants };
