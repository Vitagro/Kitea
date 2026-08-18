import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppShell } from "@/components/Layout/AppShell";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "KITEA Logistics Control Tower",
  description: "Pilotage logistique et pré-facturation intragroupe pour l'écosystème KITEA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
