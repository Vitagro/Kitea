import { ChangeEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileSpreadsheet, Upload } from "lucide-react";
import { erpService, ErpSyncLog } from "../services/erpService";
import { ImportResult } from "../types/orders";
import { ImportResultBanner } from "../components/Common/ImportResultBanner";

const LOG_STATUS_ICON: Record<ErpSyncLog["status"], JSX.Element> = {
  SUCCESS: <CheckCircle2 size={14} className="text-emerald-600" />,
  FAILED: <AlertCircle size={14} className="text-red-600" />,
  PENDING: <Clock size={14} className="text-slate-400" />,
};

export function ErpIntegrationPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [logs, setLogs] = useState<ErpSyncLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reloadLogs() {
    setIsLoadingLogs(true);
    const data = await erpService.listSyncLogs();
    setLogs(data);
    setIsLoadingLogs(false);
  }

  useEffect(() => {
    reloadLogs();
  }, []);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await erpService.importOrdersFromExcel(file);
      setImportResult(result);
      await reloadLogs();
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Intégration ERP KITEA</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-600 space-y-3">
        <p>
          Cette couche expose des webhooks REST pour les flux <strong>inbound</strong> (commandes d'achat,
          réassorts magasins, transferts inter-dépôts) et journalise les flux <strong>outbound</strong>
          (statuts d'expédition, coûts logistiques imputés, pré-factures validées).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Webhook temps réel</p>
            <code className="text-xs">POST /api/erp/webhooks/orders</code>
          </div>
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Import en masse (lot JSON)</p>
            <code className="text-xs">POST /api/erp/import/orders</code>
          </div>
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Traçabilité</p>
            <code className="text-xs">GET /api/erp/sync-logs</code>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Importer des commandes depuis l'ERP</h2>
            <p className="text-sm text-slate-500">
              La plupart des ERP exportent leurs commandes en Excel — dépose ici le fichier reçu de
              l'ERP KITEA pour créer automatiquement les commandes correspondantes.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => erpService.downloadImportTemplate()}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <FileSpreadsheet size={16} /> Modèle Excel
            </button>
            <label className="flex items-center gap-2 rounded-lg bg-kitea-blue text-white px-3 py-2 text-sm cursor-pointer">
              <Upload size={16} /> {isImporting ? "Import en cours..." : "Importer le fichier ERP"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                disabled={isImporting}
                onChange={handleImport}
              />
            </label>
          </div>
        </div>

        {importResult && <ImportResultBanner result={importResult} />}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Journal de synchronisation</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Sens</th>
              <th className="text-left px-4 py-3">Événement</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingLogs && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Chargement...
                </td>
              </tr>
            )}
            {!isLoadingLogs && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Aucun échange ERP enregistré.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-full px-2 py-0.5 ${log.direction === "INBOUND" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {log.direction === "INBOUND" ? "Entrant" : "Sortant"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-700">{log.eventType}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs">
                    {LOG_STATUS_ICON[log.status]} {log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
