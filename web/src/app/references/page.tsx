"use client";

import { useState } from "react";
import { VehicleTypesPanel } from "@/components/References/VehicleTypesPanel";
import { CarriersPanel } from "@/components/References/CarriersPanel";

const TABS = [
  { id: "vehicles", label: "Types de véhicules" },
  { id: "carriers", label: "Transporteurs" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ReferencesPage() {
  const [tab, setTab] = useState<TabId>("vehicles");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Référentiels</h1>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id ? "border-kitea-blue text-kitea-blue" : "border-transparent text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "vehicles" ? <VehicleTypesPanel /> : <CarriersPanel />}
    </div>
  );
}
