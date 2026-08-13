import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Sidebar } from "@/components/Layout/Sidebar";

export const metadata: Metadata = {
  title: "KITEA Logistics Control Tower",
  description: "Pilotage logistique et pré-facturation intragroupe pour l'écosystème KITEA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-screen bg-slate-50">{children}</main>
        </div>
      </body>
    </html>
  );
}
