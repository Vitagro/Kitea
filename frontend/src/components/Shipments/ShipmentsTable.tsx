import { useEffect, useState } from "react";
import { FileStack, RefreshCw } from "lucide-react";
import { shipmentsService } from "../../services/shipmentsService";
import { preInvoicingService } from "../../services/preInvoicingService";
import { Shipment, ShipmentStatus } from "../../types";

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PLANNED: "Planifiée",
  IN_TRANSIT: "En transit",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const STATUS_STYLES: Record<ShipmentStatus, string> = {
  PLANNED: "bg-slate-100 text-slate-600",
  IN_TRANSIT: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

// Liste des expéditions consolidées (résultat du module Consolidation) :
// coût théorique, taux de remplissage, et génération de la pré-facture
// associée (Module 4).
export function ShipmentsTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  async function reload() {
    setIsLoading(true);
    const data = await shipmentsService.list();
    setShipments(data);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleGenerate(shipmentId: string) {
    setGeneratingId(shipmentId);
    try {
      await preInvoicingService.generate(shipmentId);
      await reload();
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expéditions</h1>
          <p className="text-sm text-slate-500">
            {shipments.length} expédition(s) issue(s) de la consolidation des commandes.
          </p>
        </div>
        <button onClick={reload} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <RefreshCw size={16} /> Rafraîchir
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Référence</th>
              <th className="text-left px-4 py-3">Trajet</th>
              <th className="text-left px-4 py-3">Véhicule</th>
              <th className="text-right px-4 py-3">Remplissage</th>
              <th className="text-right px-4 py-3">Coût théorique</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Chargement...
                </td>
              </tr>
            )}
            {!isLoading && shipments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Aucune expédition. Lancez une consolidation depuis l'écran "Consolidation & Flotte".
                </td>
              </tr>
            )}
            {shipments.map((shipment) => (
              <tr key={shipment.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{shipment.reference}</td>
                <td className="px-4 py-3 text-slate-500">
                  {shipment.origin.city} → {shipment.destination.city}
                </td>
                <td className="px-4 py-3 text-slate-500">{shipment.vehicleType?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {shipment.fillRatePercent != null ? `${shipment.fillRatePercent.toFixed(0)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {shipment.theoreticalCost != null ? `${shipment.theoreticalCost.toLocaleString()} ${shipment.currency}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[shipment.status]}`}>
                    {STATUS_LABELS[shipment.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {shipment.preInvoice ? (
                    <span className="text-xs text-slate-400">Pré-facture générée</span>
                  ) : (
                    <button
                      onClick={() => handleGenerate(shipment.id)}
                      disabled={generatingId === shipment.id || shipment.theoreticalCost == null}
                      className="flex items-center gap-1 text-xs rounded-md bg-kitea-blue text-white px-2 py-1 disabled:opacity-50 ml-auto"
                    >
                      <FileStack size={14} />
                      {generatingId === shipment.id ? "..." : "Générer pré-facture"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
