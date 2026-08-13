"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TransportCostBreakdown } from "../../types/kpi";

interface Props {
  data: TransportCostBreakdown | null;
  isLoading: boolean;
}

// Ventilation des coûts de transport par type de véhicule et par
// transporteur — répond directement à la demande d'"indicateurs sur les
// coûts de transport".
export function TransportCostPanel({ data, isLoading }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartCard title="Coût théorique par type de véhicule" rows={data?.byVehicleType} isLoading={isLoading} />
      <ChartCard title="Coût théorique par transporteur" rows={data?.byCarrier} isLoading={isLoading} />
    </div>
  );
}

function ChartCard({
  title,
  rows,
  isLoading,
}: {
  title: string;
  rows?: { label: string; totalCost: number; shipmentCount: number }[];
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 text-sm mb-3">{title}</h3>
      {isLoading && <p className="text-xs text-slate-400 py-8 text-center">Chargement...</p>}
      {!isLoading && (!rows || rows.length === 0) && (
        <p className="text-xs text-slate-400 py-8 text-center">Aucune donnée sur la période.</p>
      )}
      {!isLoading && rows && rows.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} MAD`, "Coût théorique"]}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="totalCost" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
