"use client";

import { Fragment, FormEvent, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Receipt } from "lucide-react";
import { preInvoicingService } from "../../services/preInvoicingService";
import { carriersService } from "../../services/carriersService";
import { Carrier, MatchingStatus, PreInvoice } from "../../types";

const STATUS_STYLES: Record<MatchingStatus, { label: string; className: string; icon: JSX.Element }> = {
  PENDING_INVOICE: { label: "En attente facture prestataire", className: "bg-slate-100 text-slate-600", icon: <Clock size={14} /> },
  MATCHED: { label: "Rapproché (dans tolérance)", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={14} /> },
  DISCREPANCY: { label: "Écart hors tolérance", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={14} /> },
  APPROVED: { label: "Approuvé", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 size={14} /> },
  REJECTED: { label: "Rejeté", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={14} /> },
  CREDIT_NOTE_REQUESTED: { label: "Avoir demandé", className: "bg-amber-50 text-amber-700", icon: <AlertTriangle size={14} /> },
};

const EMPTY_INVOICE_FORM = { carrierId: "", invoiceNumber: "", amount: "", invoiceDate: new Date().toISOString().slice(0, 10) };

export function PreInvoiceControlDesk() {
  const [preInvoices, setPreInvoices] = useState<PreInvoice[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState(EMPTY_INVOICE_FORM);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  async function reload() {
    setIsLoading(true);
    const [preInvoicesData, carriersData] = await Promise.all([preInvoicingService.list(), carriersService.list()]);
    setPreInvoices(preInvoicesData);
    setCarriers(carriersData);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function decide(id: string, decision: "APPROVED" | "REJECTED" | "CREDIT_NOTE_REQUESTED") {
    await preInvoicingService.resolve(id, { decision, validatedBy: "head.logistics@kitea.com" });
    await reload();
  }

  function startAttach(id: string) {
    setAttachingId(id);
    setInvoiceForm(EMPTY_INVOICE_FORM);
    setInvoiceError(null);
  }

  async function handleAttachSubmit(event: FormEvent, preInvoiceId: string) {
    event.preventDefault();
    setInvoiceError(null);

    const amount = Number(invoiceForm.amount);
    if (!invoiceForm.carrierId || !invoiceForm.invoiceNumber.trim() || Number.isNaN(amount) || amount <= 0) {
      setInvoiceError("Transporteur, numéro de facture et montant sont requis.");
      return;
    }

    try {
      await preInvoicingService.attachCarrierInvoice(preInvoiceId, {
        carrierId: invoiceForm.carrierId,
        invoiceNumber: invoiceForm.invoiceNumber,
        amount,
        invoiceDate: new Date(invoiceForm.invoiceDate).toISOString(),
      });
      setAttachingId(null);
      await reload();
    } catch {
      setInvoiceError("Échec de l'enregistrement de la facture.");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Contrôle des pré-factures</h2>
        <p className="text-sm text-slate-500">
          Comparaison du coût théorique calculé vs le montant facturé par le prestataire. Les pré-factures se
          génèrent depuis l&apos;écran &quot;Expéditions&quot;.
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
              <Fragment key={pi.id}>
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{pi.reference}</td>
                  <td className="px-4 py-3 text-right">
                    {pi.theoreticalAmount.toLocaleString()} {pi.currency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pi.carrierAmount != null ? `${pi.carrierAmount.toLocaleString()} ${pi.currency}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pi.gapPercent != null ? (
                      <span className={Math.abs(pi.gapPercent) > pi.toleranceThresholdPercent ? "text-red-600 font-medium" : ""}>
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
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {pi.matchingStatus === "PENDING_INVOICE" && (
                      <button onClick={() => startAttach(pi.id)} className="inline-flex items-center gap-1 text-xs rounded-md bg-kitea-blue text-white px-2 py-1">
                        <Receipt size={14} /> Saisir facture
                      </button>
                    )}
                    {pi.matchingStatus === "DISCREPANCY" && (
                      <>
                        <button onClick={() => decide(pi.id, "APPROVED")} className="text-xs rounded-md bg-emerald-600 text-white px-2 py-1">
                          Approuver
                        </button>
                        <button onClick={() => decide(pi.id, "CREDIT_NOTE_REQUESTED")} className="text-xs rounded-md bg-amber-500 text-white px-2 py-1">
                          Demander avoir
                        </button>
                        <button onClick={() => decide(pi.id, "REJECTED")} className="text-xs rounded-md bg-red-600 text-white px-2 py-1">
                          Rejeter
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                {attachingId === pi.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-4">
                      <form onSubmit={(e) => handleAttachSubmit(e, pi.id)} className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Transporteur</label>
                          <select className="input" value={invoiceForm.carrierId} onChange={(e) => setInvoiceForm({ ...invoiceForm, carrierId: e.target.value })}>
                            <option value="">— Sélectionner —</option>
                            {carriers.map((carrier) => (
                              <option key={carrier.id} value={carrier.id}>
                                {carrier.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">N° facture</label>
                          <input className="input" value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Montant ({pi.currency})</label>
                          <input type="number" step="0.01" className="input" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Date facture</label>
                          <input type="date" className="input" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })} />
                        </div>
                        <button type="submit" className="rounded-lg bg-kitea-blue text-white text-sm px-3 py-2">
                          Enregistrer
                        </button>
                        <button type="button" onClick={() => setAttachingId(null)} className="text-sm text-slate-500 px-2">
                          Annuler
                        </button>
                        {invoiceError && <p className="w-full text-xs text-red-600">{invoiceError}</p>}
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
  );
}
