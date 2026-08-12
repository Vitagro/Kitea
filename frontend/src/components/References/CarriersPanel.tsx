import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { carriersService } from "../../services/carriersService";
import { Carrier } from "../../types";

const EMPTY_FORM = { name: "", isInternal: false, contactEmail: "" };

// Gestion des transporteurs/prestataires (internes et 3PL externes),
// utilisés par le configurateur de tarifs et le rapprochement des
// factures (Modules 3 & 4).
export function CarriersPanel() {
  const [items, setItems] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function reload() {
    setIsLoading(true);
    setItems(await carriersService.list());
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Le nom du transporteur est requis.");
      return;
    }
    setIsSubmitting(true);
    try {
      await carriersService.create({
        name: form.name,
        isInternal: form.isInternal,
        contactEmail: form.contactEmail || undefined,
      });
      setForm(EMPTY_FORM);
      await reload();
    } catch {
      setError("Échec de la création du transporteur.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    await carriersService.deactivate(id);
    await reload();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 space-y-3 h-fit">
        <h2 className="font-semibold text-slate-900">Nouveau transporteur</h2>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Nom</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex: GéodisMaroc" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Email de contact</label>
          <input className="input" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={form.isInternal} onChange={(e) => setForm({ ...form, isInternal: e.target.checked })} className="accent-kitea-blue" />
          Transporteur interne au groupe KITEA
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 rounded-lg bg-kitea-blue text-white text-sm font-medium py-2 disabled:opacity-50">
          <Plus size={16} /> Ajouter
        </button>
      </form>

      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Nom</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Chargement...</td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucun transporteur configuré.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-full px-2 py-0.5 ${item.isInternal ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                    {item.isInternal ? "Interne" : "3PL externe"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{item.contactEmail ?? "—"}</td>
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
