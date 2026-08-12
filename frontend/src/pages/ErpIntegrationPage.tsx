export function ErpIntegrationPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Intégration ERP KITEA</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-5 text-sm text-slate-600 space-y-3">
        <p>
          Cette couche expose des webhooks REST pour les flux <strong>inbound</strong> (commandes d'achat,
          réassorts magasins, transferts inter-dépôts) et journalise les flux <strong>outbound</strong>
          (statuts d'expédition, coûts logistiques imputés, pré-factures validées).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Inbound</p>
            <code className="text-xs">POST /api/erp/webhooks/orders</code>
          </div>
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Traçabilité</p>
            <code className="text-xs">GET /api/erp/sync-logs</code>
          </div>
        </div>
      </div>
    </div>
  );
}
