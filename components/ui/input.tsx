import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => <input ref={ref} type={type} className={cn("flex h-10 w-full rounded-xl border border-white/10 bg-[#101213] px-3.5 py-2 text-sm text-white shadow-sm outline-none transition-colors placeholder:text-zinc-600 hover:border-white/15 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/10 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />);
Input.displayName = "Input";
export { Input };
