import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { preInvoicingService } from "../../services/preInvoicingService";
import { MatchingStatus, PreInvoice } from "../../types";

const STATUS_STYLES: Record<MatchingStatus, { label: string; className: string; icon: JSX.Element }> = {
  PENDING_INVOICE: {
    label: "En attente facture prestataire",
    className: "bg-slate-100 text-slate-600",
    icon: <Clock size={14} />,
  },
  MATCHED: {
    label: "Rapproché (dans tolérance)",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  DISCREPANCY: {
    label: "Écart hors tolérance",
    className: "bg-red-50 text-red-700",
    icon: <AlertTriangle size={14} />,
  },
  APPROVED: { label: "Approuvé", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={14} /> },
  REJECTED: { label: "Rejeté", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={14} /> },
  CREDIT_NOTE_REQUESTED: {
    label: "Avoir demandé",
    className: "bg-amber-50 text-amber-700",
    icon: <AlertTriangle size={14} />,
  },
};

// Control Desk du rapprochement 3-way matching (Module 4) :
// Ordre de Transport / Prestation Réalisée / Pré-facture générée.
export function PreInvoiceControlDesk() {
  const [preInvoices, setPreInvoices] = useState<PreInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function reload() {
    setIsLoading(true);
    const data = await preInvoicingService.list();
    setPreInvoices(data);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function decide(id: string, decision: "APPROVED" | "REJECTED" | "CREDIT_NOTE_REQUESTED") {
    await preInvoicingService.resolve(id, { decision, validatedBy: "head.logistics@kitea.com" });
    await reload();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Contrôle des pré-factures</h2>
        <p className="text-sm text-slate-500">
          Comparaison du coût théorique calculé vs le montant facturé par le prestataire.
        </p>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Référence</th>
            <th className="text-right px-4 py-3">Coût théorique</th>
            <th className="text-right px-4 py-3">Facturé</th>
            <th className="text-right px-4 py-3">Écart</th>
            <th className="text-left px-4 py-3">Statut</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                Chargement...
              </td>
            </tr>
          )}
          {!isLoading && preInvoices.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                Aucune pré-facture générée.
              </td>
            </tr>
          )}
          {preInvoices.map((pi) => {
            const status = STATUS_STYLES[pi.matchingStatus];
            return (
              <tr key={pi.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{pi.reference}</td>
                <td className="px-4 py-3 text-right">
                  {pi.theoreticalAmount.toLocaleString()} {pi.currency}
                </td>
                <td className="px-4 py-3 text-right">
                  {pi.carrierAmount != null ? `${pi.carrierAmount.toLocaleString()} ${pi.currency}` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {pi.gapPercent != null ? (
                    <span className={pi.gapPercent > pi.toleranceThresholdPercent ? "text-red-600 font-medium" : ""}>
                      {pi.gapPercent > 0 ? "+" : ""}
                      {pi.gapPercent.toFixed(1)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${status.className}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {pi.matchingStatus === "DISCREPANCY" && (
                    <>
                      <button
                        onClick={() => decide(pi.id, "APPROVED")}
                        className="text-xs rounded-md bg-emerald-600 text-white px-2 py-1"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => decide(pi.id, "CREDIT_NOTE_REQUESTED")}
                        className="text-xs rounded-md bg-amber-500 text-white px-2 py-1"
                      >
                        Demander avoir
                      </button>
                      <button
                        onClick={() => decide(pi.id, "REJECTED")}
                        className="text-xs rounded-md bg-red-600 text-white px-2 py-1"
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
