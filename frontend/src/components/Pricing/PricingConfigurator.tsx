import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { pricingService } from "../../services/pricingService";
import { PricingRule, PricingRuleType, PricingSource } from "../../types";

const RULE_TYPE_LABELS: Record<PricingRuleType, string> = {
  TRANSPORT_FLAT_ZONE: "Transport - Forfait par zone",
  TRANSPORT_PER_KM: "Transport - Prix au km",
  TRANSPORT_PER_VEHICLE: "Transport - Forfait par véhicule",
  STORAGE_PER_PALLET_DAY: "Stockage - Prix par palette/jour",
  STORAGE_PER_M2_MONTH: "Stockage - Prix par m²/mois",
  HANDLING_IN: "Manutention - Entrée",
  HANDLING_OUT: "Manutention - Sortie",
};

const EMPTY_FORM = {
  label: "",
  ruleType: "TRANSPORT_PER_KM" as PricingRuleType,
  source: "INTERNAL" as PricingSource,
  zoneName: "",
  unitPrice: "",
  currency: "MAD",
  validFrom: new Date().toISOString().slice(0, 10),
};

// Interface d'administration pour définir/modifier les grilles tarifaires
// (Module 3 : Dynamic Costing & Configurateur de Tarifs).
export function PricingConfigurator() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function reload() {
    setIsLoading(true);
    const data = await pricingService.list();
    setRules(data);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const unitPrice = Number(form.unitPrice);
    if (!form.label.trim() || Number.isNaN(unitPrice) || unitPrice <= 0) {
      setFormError("Merci de renseigner un libellé et un prix unitaire valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      await pricingService.create({
        label: form.label,
        ruleType: form.ruleType,
        source: form.source,
        zoneName: form.zoneName || undefined,
        unitPrice,
        currency: form.currency,
        validFrom: new Date(form.validFrom).toISOString(),
      } as never);
      setForm(EMPTY_FORM);
      await reload();
    } catch (err) {
      setFormError("La création de la règle a échoué. Vérifiez les champs requis pour ce type de règle.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    await pricingService.deactivate(id);
    await reload();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 space-y-4 h-fit"
      >
        <h2 className="font-semibold text-slate-900">Nouvelle règle tarifaire</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Libellé</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="ex: Tarif interne au km - Zone Nord"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Type de règle</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.ruleType}
            onChange={(e) => setForm({ ...form, ruleType: e.target.value as PricingRuleType })}
          >
            {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Source</label>
          <select
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value as PricingSource })}
          >
            <option value="INTERNAL">Grille interne KITEA</option>
            <option value="EXTERNAL_3PL">Grille prestataire externe (3PL)</option>
          </select>
        </div>

        {form.ruleType === "TRANSPORT_FLAT_ZONE" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Zone</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.zoneName}
              onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
              placeholder="ex: Zone Nord"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Prix unitaire</label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Devise</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Valide à partir du</label>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.validFrom}
            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
          />
        </div>

        {formError && <p className="text-xs text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-kitea-blue text-white text-sm font-medium py-2 disabled:opacity-50"
        >
          <Plus size={16} /> Ajouter la règle
        </button>
      </form>

      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Libellé</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-right px-4 py-3">Prix</th>
              <th className="px-4 py-3"></th>
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
            {!isLoading && rules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Aucune règle tarifaire configurée.
                </td>
              </tr>
            )}
            {rules.map((rule) => (
              <tr key={rule.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{rule.label}</td>
                <td className="px-4 py-3 text-slate-500">{RULE_TYPE_LABELS[rule.ruleType]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      rule.source === "INTERNAL" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {rule.source === "INTERNAL" ? "Interne" : "3PL externe"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {rule.unitPrice.toLocaleString()} {rule.currency}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeactivate(rule.id)}
                    className="text-slate-400 hover:text-red-600"
                    title="Désactiver"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
