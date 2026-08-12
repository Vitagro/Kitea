import { useEffect, useState } from "react";
import { PackageCheck, RefreshCw } from "lucide-react";
import { consolidationService } from "../../services/consolidationService";
import { ConsolidatedShipmentPreview } from "../../types";

// Vue de simulation de la consolidation : regroupement proposé + taux de
// remplissage visuel par shipment (Module 2).
export function ConsolidationBoard() {
  const [shipments, setShipments] = useState<ConsolidatedShipmentPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  async function loadPreview() {
    setIsLoading(true);
    const data = await consolidationService.preview();
    setShipments(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPreview();
  }, []);

  async function handleRun() {
    setIsRunning(true);
    await consolidationService.run();
    await loadPreview();
    setIsRunning(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Consolidation & sélection véhicule</h2>
          <p className="text-sm text-slate-500">
            Regroupement automatique des commandes en attente par trajet, fenêtre de livraison et
            compatibilité de charge.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPreview}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <RefreshCw size={16} /> Rafraîchir
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 rounded-lg bg-kitea-blue text-white px-3 py-2 text-sm disabled:opacity-50"
          >
            <PackageCheck size={16} /> Valider la consolidation
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Calcul du regroupement optimal...</p>}
      {!isLoading && shipments.length === 0 && (
        <p className="text-sm text-slate-400">Aucune commande en attente à consolider.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shipments.map((shipment, index) => (
          <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">
                {shipment.vehicleType ? shipment.vehicleType.name : "Aucun véhicule adapté"}
              </span>
              <span className="text-xs text-slate-400">{shipment.orders.length} commande(s)</span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Taux de remplissage</span>
                <span>{shipment.fillRatePercent.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-kitea-blue"
                  style={{ width: `${Math.min(shipment.fillRatePercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div>
                <span className="block text-slate-400">Volume</span>
                <span className="font-medium text-slate-700">{shipment.totalVolumeM3.toFixed(2)} m³</span>
              </div>
              <div>
                <span className="block text-slate-400">Poids</span>
                <span className="font-medium text-slate-700">{shipment.totalWeightKg.toFixed(0)} kg</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
