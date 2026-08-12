import { Truck, Map, SlidersHorizontal, FileStack, PlugZap, PackageSearch, Building2, Boxes, Settings2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Cartographie du réseau", icon: Map },
  { to: "/locations", label: "Sites", icon: Building2 },
  { to: "/orders", label: "Commandes", icon: PackageSearch },
  { to: "/consolidation", label: "Consolidation & Flotte", icon: Truck },
  { to: "/shipments", label: "Expéditions", icon: Boxes },
  { to: "/pricing", label: "Configurateur de tarifs", icon: SlidersHorizontal },
  { to: "/pre-invoicing", label: "Pré-Facturation", icon: FileStack },
  { to: "/erp", label: "Intégration ERP", icon: PlugZap },
  { to: "/references", label: "Référentiels", icon: Settings2 },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-kitea-navy text-white min-h-screen p-4">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-bold leading-tight">KITEA</h1>
        <p className="text-xs text-slate-300">Logistics Control Tower</p>
      </div>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-kitea-blue text-white" : "text-slate-200 hover:bg-white/10"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
