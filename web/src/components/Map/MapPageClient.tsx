"use client";

import dynamic from "next/dynamic";

// Leaflet accède à `window` au chargement : le composant carte doit être
// exclu du rendu serveur (ssr: false), ce qui n'est permis que depuis un
// Client Component — d'où ce petit wrapper séparé de la page.
const KiteaNetworkMap = dynamic(() => import("./KiteaNetworkMap").then((mod) => mod.KiteaNetworkMap), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-2rem)] w-full rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 text-sm">
      Chargement de la carte...
    </div>
  ),
});

export function MapPageClient() {
  return <KiteaNetworkMap />;
}
