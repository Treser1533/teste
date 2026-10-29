import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppDataProvider } from "@/components/app-provider";

export const metadata: Metadata = {
  title: "Rn Pod'S — catálogo e pedidos",
  description:
    "Gestão de catálogo e pedidos...",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppDataProvider>{children}</AppDataProvider>
      </body>
    </html>
  );
}
