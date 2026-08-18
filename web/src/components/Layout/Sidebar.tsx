"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Truck,
  Map,
  SlidersHorizontal,
  FileStack,
  PlugZap,
  PackageSearch,
  Building2,
  Boxes,
  Settings2,
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { UserRole } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard & KPIs", icon: LayoutDashboard },
  { href: "/map", label: "Cartographie du réseau", icon: Map },
  { href: "/locations", label: "Sites", icon: Building2 },
  { href: "/employees", label: "Collaborateurs", icon: Users },
  { href: "/orders", label: "Commandes", icon: PackageSearch },
  { href: "/consolidation", label: "Consolidation & Flotte", icon: Truck },
  { href: "/shipments", label: "Expéditions", icon: Boxes },
  { href: "/pricing", label: "Configurateur de tarifs", icon: SlidersHorizontal },
  { href: "/pre-invoicing", label: "Pré-Facturation", icon: FileStack },
  { href: "/erp", label: "Intégration ERP", icon: PlugZap },
  { href: "/references", label: "Référentiels", icon: Settings2 },
];

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Administrateur",
  HEAD_OF_LOGISTICS: "Direction logistique",
  DISPATCHER: "Planificateur transport",
  WAREHOUSE_MANAGER: "Responsable dépôt",
  STORE_MANAGER: "Responsable magasin",
  FINANCE_CONTROLLER: "Contrôle de gestion",
  DRIVER: "Livreur",
  VIEWER: "Lecture seule",
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = user?.role === "SUPER_ADMIN" ? [...NAV_ITEMS, { href: "/users", label: "Utilisateurs", icon: ShieldCheck }] : NAV_ITEMS;

  return (
    <aside className="w-64 shrink-0 bg-kitea-navy text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-bold leading-tight">KITEA</h1>
        <p className="text-xs text-slate-300">Logistics Control Tower</p>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-kitea-blue text-white" : "text-slate-200 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t border-white/10 pt-3 px-2 space-y-2">
          <div className="text-xs">
            <p className="font-medium text-white">{user.fullName}</p>
            <p className="text-slate-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      )}
    </aside>
  );
}
