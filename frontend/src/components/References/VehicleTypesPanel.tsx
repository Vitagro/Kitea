import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { vehicleTypesService } from "../../services/vehicleTypesService";
import { VehicleType } from "../../types";

const EMPTY_FORM = { code: "", name: "", maxVolumeM3: "", maxWeightKg: "" };

// Gestion de la typologie de flotte (Module 2) : utilitaire léger, camion
// moyen, porteur, semi-remorque... utilisée par l'algorithme de sélection
// de véhicule et le configurateur de tarifs.
export function VehicleTypesPanel() {
  const [items, setItems] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function reload() {
    setIsLoading(true);
    setItems(await vehicleTypesService.list());
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const maxVolumeM3 = Number(form.maxVolumeM3);
    const maxWeightKg = Number(form.maxWeightKg);
    if (!form.code.trim() || !form.name.trim() || maxVolumeM3 <= 0 || maxWeightKg <= 0) {
      setError("Tous les champs sont requis (volume et poids doivent être positifs).");
      return;
    }
    setIsSubmitting(true);
    try {
      await vehicleTypesService.create({ code: form.code, name: form.name, maxVolumeM3, maxWeightKg });
      setForm(EMPTY_FORM);
      await reload();
    } catch {
      setError("Échec de la création — le code existe peut-être déjà.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    await vehicleTypesService.deactivate(id);
    await reload();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 space-y-3 h-fit">
        <h2 className="font-semibold text-slate-900">Nouveau type de véhicule</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Code</label>
          <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ex: TRUCK_MEDIUM" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Nom</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: Camion Moyen" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Volume max (m³)</label>
            <input className="input" value={form.maxVolumeM3} onChange={(e) => setForm({ ...form, maxVolumeM3: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Poids max (kg)</label>
            <input className="input" value={form.maxWeightKg} onChange={(e) => setForm({ ...form, maxWeightKg: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-kitea-blue text-white text-sm font-medium py-2 disabled:opacity-50">
          <Plus size={16} /> Ajouter
        </button>
      </form>

      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Code</th>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-right px-4 py-3">Volume max</th>
              <th className="text-right px-4 py-3">Poids max</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Aucun type de véhicule configuré.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-4 py-3 text-right">{item.maxVolumeM3} m³</td>
                <td className="px-4 py-3 text-right">{item.maxWeightKg.toLocaleString()} kg</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDeactivate(item.id)} className="text-slate-400 hover:text-red-600" title="Désactiver">
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
