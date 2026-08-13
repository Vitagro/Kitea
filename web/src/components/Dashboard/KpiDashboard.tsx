"use client";

import { useEffect, useState } from "react";
import { Clock, DollarSign, PackageCheck, TrendingDown, TrendingUp } from "lucide-react";
import { kpiService } from "../../services/kpiService";
import { DriverRanking, KpiOverview, StoreRanking, TransportCostBreakdown, WarehouseManagerRanking } from "../../types/kpi";
import { StatTile } from "./StatTile";
import { RankingCard } from "./RankingCard";
import { TransportCostPanel } from "./TransportCostPanel";

const numberFmt = (n: number) => n.toLocaleString("fr-FR");

export function KpiDashboard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [overview, setOverview] = useState<KpiOverview | null>(null);
  const [drivers, setDrivers] = useState<DriverRanking[]>([]);
  const [stores, setStores] = useState<StoreRanking[]>([]);
  const [warehouseManagers, setWarehouseManagers] = useState<WarehouseManagerRanking[]>([]);
  const [transportCosts, setTransportCosts] = useState<TransportCostBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function reload() {
    setIsLoading(true);
    const period = { from: from || undefined, to: to || undefined };
    const [overviewData, driversData, storesData, warehouseData, costsData] = await Promise.all([
      kpiService.getOverview(period),
      kpiService.getDriverRankings(period),
      kpiService.getStoreRankings(period),
      kpiService.getWarehouseManagerRankings(period),
      kpiService.getTransportCosts(period),
    ]);
    setOverview(overviewData);
    setDrivers(driversData);
    setStores(storesData);
    setWarehouseManagers(warehouseData);
    setTransportCosts(costsData);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard & KPIs</h1>
          <p className="text-sm text-slate-500">
            Ponctualité, coûts de transport et classements du réseau KITEA.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={reload} className="rounded-lg bg-kitea-blue text-white text-sm px-4 py-2">
            Appliquer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Taux de ponctualité"
          value={overview?.onTimeRatePercent != null ? `${overview.onTimeRatePercent.toFixed(0)}%` : "—"}
          icon={overview && overview.onTimeRatePercent != null && overview.onTimeRatePercent >= 90 ? TrendingUp : TrendingDown}
          tone={overview?.onTimeRatePercent != null && overview.onTimeRatePercent >= 90 ? "positive" : "warning"}
          hint={overview ? `${numberFmt(overview.onTimeCount)} à l'heure / ${numberFmt(overview.lateCount)} en retard` : undefined}
        />
        <StatTile
          label="Livraisons"
          value={overview ? numberFmt(overview.deliveredCount) : "—"}
          icon={PackageCheck}
          hint={overview ? `sur ${numberFmt(overview.totalShipments)} expéditions` : undefined}
        />
        <StatTile
          label="Coût transport théorique"
          value={overview ? `${numberFmt(overview.totalTheoreticalCost)} ${overview.currency}` : "—"}
          icon={DollarSign}
        />
        <StatTile
          label="Écart moyen vs facturé"
          value={overview?.avgGapPercent != null ? `${overview.avgGapPercent > 0 ? "+" : ""}${overview.avgGapPercent.toFixed(1)}%` : "—"}
          icon={Clock}
          tone={overview?.avgGapPercent != null && Math.abs(overview.avgGapPercent) > 5 ? "negative" : "positive"}
        />
      </div>

      <TransportCostPanel data={transportCosts} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankingCard
          title="Meilleurs magasins"
          subtitle="Taux de ponctualité des livraisons reçues"
          rows={stores}
          rowKey={(r) => r.locationId}
          emptyLabel="Aucune donnée de livraison sur la période."
          columns={[
            { header: "Magasin", render: (r) => <><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.city}</p></> },
            { header: "Ponctualité", align: "right", render: (r) => <span className="font-medium">{r.onTimeRatePercent.toFixed(0)}%</span> },
          ]}
        />
        <RankingCard
          title="Meilleurs livreurs"
          subtitle="Taux de ponctualité des livraisons effectuées"
          rows={drivers}
          rowKey={(r) => r.employeeId}
          emptyLabel="Aucun livreur affecté à une expédition livrée."
          columns={[
            { header: "Livreur", render: (r) => <><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.totalDeliveries} livraison(s)</p></> },
            { header: "Ponctualité", align: "right", render: (r) => <span className="font-medium">{r.onTimeRatePercent.toFixed(0)}%</span> },
          ]}
        />
        <RankingCard
          title="Meilleurs responsables de dépôt"
          subtitle="Ponctualité des expéditions au départ de leur site"
          rows={warehouseManagers}
          rowKey={(r) => r.employeeId}
          emptyLabel="Aucun responsable de dépôt renseigné."
          columns={[
            { header: "Responsable", render: (r) => <><p className="font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400">{r.locationName}</p></> },
            { header: "Ponctualité", align: "right", render: (r) => <span className="font-medium">{r.onTimeRatePercent.toFixed(0)}%</span> },
          ]}
        />
      </div>
    </div>
  );
}
