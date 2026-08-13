"use client";

import { Fragment, FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Clock, FileStack, RefreshCw, Truck, XCircle } from "lucide-react";
import { shipmentsService } from "../../services/shipmentsService";
import { preInvoicingService } from "../../services/preInvoicingService";
import { employeesService } from "../../services/employeesService";
import { Employee, Shipment, ShipmentStatus } from "../../types";

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

const PERFORMANCE_BADGE = {
  ON_TIME: { label: "À l'heure", className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  LATE: { label: "En retard", className: "bg-red-50 text-red-700", icon: Clock },
  CANCELLED: { label: "Annulée", className: "bg-slate-100 text-slate-500", icon: XCircle },
} as const;

const EMPTY_DELIVERY_FORM = { driverId: "", actualDeparture: "", actualArrival: "" };

// Liste des expéditions consolidées : coût théorique, taux de remplissage,
// génération de pré-facture (Module 4), et saisie du suivi de livraison
// réel (chauffeur + horodatage) qui alimente le module KPI.
export function ShipmentsTable() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [deliveryFormId, setDeliveryFormId] = useState<string | null>(null);
  const [deliveryForm, setDeliveryForm] = useState(EMPTY_DELIVERY_FORM);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);

  async function reload() {
    setIsLoading(true);
    const [shipmentsData, driversData] = await Promise.all([
      shipmentsService.list(),
      employeesService.list({ role: "DRIVER", activeOnly: true }),
    ]);
    setShipments(shipmentsData);
    setDrivers(driversData);
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

  function startDeliveryForm(shipment: Shipment) {
    setDeliveryFormId(shipment.id);
    setDeliveryForm({
      driverId: shipment.driver?.id ?? "",
      actualDeparture: shipment.actualDeparture?.slice(0, 16) ?? "",
      actualArrival: shipment.actualArrival?.slice(0, 16) ?? "",
    });
    setDeliveryError(null);
  }

  async function handleDeliverySubmit(event: FormEvent, shipmentId: string) {
    event.preventDefault();
    setDeliveryError(null);
    try {
      await shipmentsService.recordDelivery(shipmentId, {
        driverId: deliveryForm.driverId || undefined,
        actualDeparture: deliveryForm.actualDeparture ? new Date(deliveryForm.actualDeparture).toISOString() : undefined,
        actualArrival: deliveryForm.actualArrival ? new Date(deliveryForm.actualArrival).toISOString() : undefined,
      });
      setDeliveryFormId(null);
      await reload();
    } catch {
      setDeliveryError("Échec de l'enregistrement du suivi de livraison.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expéditions</h1>
          <p className="text-sm text-slate-500">
            {shipments.length} expédition(s) — coût théorique, ponctualité et affectation chauffeur.
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
              <th className="text-left px-4 py-3">Chauffeur</th>
              <th className="text-right px-4 py-3">Coût théorique</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Ponctualité</th>
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
                  Aucune expédition. Lancez une consolidation depuis l&apos;écran &quot;Consolidation & Flotte&quot;.
                </td>
              </tr>
            )}
            {shipments.map((shipment) => {
              const performance = shipment.deliveryPerformance ? PERFORMANCE_BADGE[shipment.deliveryPerformance] : null;
              return (
                <Fragment key={shipment.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{shipment.reference}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {shipment.origin.city} → {shipment.destination.city}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {shipment.driver ? `${shipment.driver.firstName} ${shipment.driver.lastName}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {shipment.theoreticalCost != null ? `${shipment.theoreticalCost.toLocaleString()} ${shipment.currency}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[shipment.status]}`}>
                        {STATUS_LABELS[shipment.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {performance ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${performance.className}`}>
                          <performance.icon size={12} /> {performance.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startDeliveryForm(shipment)}
                        className="inline-flex items-center gap-1 text-xs rounded-md border border-slate-300 px-2 py-1"
                      >
                        <Truck size={14} /> Suivi livraison
                      </button>
                      {shipment.preInvoice ? (
                        <span className="text-xs text-slate-400">Pré-facture générée</span>
                      ) : (
                        <button
                          onClick={() => handleGenerate(shipment.id)}
                          disabled={generatingId === shipment.id || shipment.theoreticalCost == null}
                          className="inline-flex items-center gap-1 text-xs rounded-md bg-kitea-blue text-white px-2 py-1 disabled:opacity-50"
                        >
                          <FileStack size={14} />
                          {generatingId === shipment.id ? "..." : "Générer pré-facture"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {deliveryFormId === shipment.id && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-4">
                        <form onSubmit={(e) => handleDeliverySubmit(e, shipment.id)} className="flex flex-wrap items-end gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Chauffeur</label>
                            <select
                              className="input"
                              value={deliveryForm.driverId}
                              onChange={(e) => setDeliveryForm({ ...deliveryForm, driverId: e.target.value })}
                            >
                              <option value="">— Non affecté —</option>
                              {drivers.map((driver) => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.firstName} {driver.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Départ réel</label>
                            <input
                              type="datetime-local"
                              className="input"
                              value={deliveryForm.actualDeparture}
                              onChange={(e) => setDeliveryForm({ ...deliveryForm, actualDeparture: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Arrivée réelle</label>
                            <input
                              type="datetime-local"
                              className="input"
                              value={deliveryForm.actualArrival}
                              onChange={(e) => setDeliveryForm({ ...deliveryForm, actualArrival: e.target.value })}
                            />
                          </div>
                          <button type="submit" className="rounded-lg bg-kitea-blue text-white text-sm px-3 py-2">
                            Enregistrer
                          </button>
                          <button type="button" onClick={() => setDeliveryFormId(null)} className="text-sm text-slate-500 px-2">
                            Annuler
                          </button>
                          {deliveryError && <p className="w-full text-xs text-red-600">{deliveryError}</p>}
                          <p className="w-full text-xs text-slate-400">
                            La ponctualité (à l&apos;heure / en retard) est calculée automatiquement dès que l&apos;arrivée
                            réelle est renseignée, par comparaison avec l&apos;heure planifiée (tolérance 15 min).
                          </p>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
