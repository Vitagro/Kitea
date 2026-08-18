"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Sidebar } from "./Sidebar";

// Le layout racine passe toujours par ici : sur /login on affiche la page
// seule (pas de sidebar), sinon on attend la vérification de session avant
// de rendre quoi que ce soit (évite un flash d'écrans protégés / d'appels
// API qui partiraient sans token).
export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login") return <>{children}</>;

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Chargement...</div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-slate-50">{children}</main>
    </div>
  );
}
