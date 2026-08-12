import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { ordersService } from "../../services/ordersService";
import { ImportResult, Order, OrderStatus } from "../../types/orders";
import { ImportResultBanner } from "../Common/ImportResultBanner";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente",
  CONSOLIDATED: "Consolidée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  CONSOLIDATED: "bg-blue-50 text-blue-700",
  SHIPPED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

// Liste des commandes avec export Excel, import Excel (saisie de masse) et
// téléchargement du modèle attendu.
export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    setIsLoading(true);
    const data = await ordersService.list();
    setOrders(data);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await ordersService.importExcel(file);
      setImportResult(result);
      await reload();
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Commandes</h1>
          <p className="text-sm text-slate-500">
            {orders.length} commande(s) — import/export au format Excel disponible ci-dessous.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => ordersService.downloadTemplate()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <FileSpreadsheet size={16} /> Modèle Excel
          </button>
          <button
            onClick={() => ordersService.exportExcel()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <Download size={16} /> Exporter Excel
          </button>
          <label className="flex items-center gap-2 rounded-lg bg-kitea-blue text-white px-3 py-2 text-sm cursor-pointer">
            <Upload size={16} /> {isImporting ? "Import en cours..." : "Importer Excel"}
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

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Référence</th>
              <th className="text-left px-4 py-3">Trajet</th>
              <th className="text-right px-4 py-3">Volume</th>
              <th className="text-right px-4 py-3">Poids</th>
              <th className="text-left px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Chargement...
                </td>
              </tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aucune commande. Importez un fichier Excel ou synchronisez depuis l'ERP.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{order.reference}</td>
                <td className="px-4 py-3 text-slate-500">
                  {order.origin.city} → {order.destination.city}
                </td>
                <td className="px-4 py-3 text-right">{order.volumeM3.toFixed(2)} m³</td>
                <td className="px-4 py-3 text-right">{order.weightKg.toFixed(0)} kg</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
