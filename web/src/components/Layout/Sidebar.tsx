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
} from "lucide-react";

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-kitea-navy text-white min-h-screen p-4">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-bold leading-tight">KITEA</h1>
        <p className="text-xs text-slate-300">Logistics Control Tower</p>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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
    </aside>
  );
}
