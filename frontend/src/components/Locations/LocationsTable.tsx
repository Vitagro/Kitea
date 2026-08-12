import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Pencil, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { locationsService } from "../../services/locationsService";
import { Location, LocationType } from "../../types";
import { ImportResult } from "../../types/orders";
import { ImportResultBanner } from "../Common/ImportResultBanner";

const TYPE_LABELS: Record<LocationType, string> = {
  STORE: "Magasin",
  WAREHOUSE: "Entrepôt central",
  HUB_3PL: "Hub 3PL",
  CROSS_DOCK: "Cross-dock",
};

const EMPTY_FORM = {
  code: "",
  name: "",
  type: "STORE" as LocationType,
  city: "",
  region: "",
  country: "MA",
  address: "",
  latitude: "",
  longitude: "",
  storageAreaM2: "",
  storageVolumeM3: "",
  operatorName: "",
};

// Écran de gestion du réseau KITEA : liste de tous les sites (magasins,
// entrepôts, hubs 3PL), création/édition, désactivation, et import/export
// Excel (Module 1 : Cartographie & Géolocalisation).
export function LocationsTable() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [typeFilter, setTypeFilter] = useState<LocationType | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    setIsLoading(true);
    const data = await locationsService.list({ includeInactive: true });
    setLocations(data);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = locations.filter((loc) => {
    if (!includeInactive && !loc.isActive) return false;
    if (typeFilter !== "ALL" && loc.type !== typeFilter) return false;
    if (search && !`${loc.name} ${loc.code} ${loc.city}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function startEdit(location: Location) {
    setEditingId(location.id);
    setForm({
      code: location.code,
      name: location.name,
      type: location.type,
      city: location.city,
      region: location.region ?? "",
      country: location.country,
      address: location.address ?? "",
      latitude: String(location.latitude),
      longitude: String(location.longitude),
      storageAreaM2: location.storageAreaM2 != null ? String(location.storageAreaM2) : "",
      storageVolumeM3: location.storageVolumeM3 != null ? String(location.storageVolumeM3) : "",
      operatorName: location.operatorName ?? "",
    });
    setFormError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (!form.code.trim() || !form.name.trim() || !form.city.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setFormError("Code, nom, ville, latitude et longitude sont requis.");
      return;
    }

    const payload = {
      code: form.code,
      name: form.name,
      type: form.type,
      city: form.city,
      region: form.region || undefined,
      country: form.country || "MA",
      address: form.address || undefined,
      latitude,
      longitude,
      storageAreaM2: form.storageAreaM2 ? Number(form.storageAreaM2) : undefined,
      storageVolumeM3: form.storageVolumeM3 ? Number(form.storageVolumeM3) : undefined,
      operatorName: form.operatorName || undefined,
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await locationsService.update(editingId, payload);
      } else {
        await locationsService.create(payload as never);
      }
      resetForm();
      await reload();
    } catch {
      setFormError("Échec de l'enregistrement. Vérifiez que le code du site n'est pas déjà utilisé.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(location: Location) {
    if (location.isActive) await locationsService.deactivate(location.id);
    else await locationsService.reactivate(location.id);
    await reload();
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await locationsService.importExcel(file);
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
          <h1 className="text-xl font-semibold text-slate-900">Sites KITEA</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} site(s) — magasins, entrepôts et hubs 3PL du réseau.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => locationsService.downloadTemplate()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <FileSpreadsheet size={16} /> Modèle Excel
          </button>
          <button
            onClick={() => locationsService.exportExcel()}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <Download size={16} /> Exporter Excel
          </button>
          <label className="flex items-center gap-2 rounded-lg bg-kitea-blue text-white px-3 py-2 text-sm cursor-pointer">
            <Upload size={16} /> {isImporting ? "Import en cours..." : "Importer Excel"}
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" disabled={isImporting} onChange={handleImport} />
          </label>
        </div>
      </div>

      {importResult && <ImportResultBanner result={importResult} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 space-y-3 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">{editingId ? "Modifier le site" : "Nouveau site"}</h2>
            {editingId && (
              <button type="button" onClick={resetForm} className="text-xs text-slate-400 hover:text-slate-600">
                Annuler
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Code">
              <input
                className="input"
                value={form.code}
                disabled={!!editingId}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="KTA-STO-..."
              />
            </Field>
            <Field label="Type">
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LocationType })}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Nom">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville">
              <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="Région">
              <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </Field>
          </div>

          <Field label="Adresse">
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input className="input" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </Field>
            <Field label="Longitude">
              <input className="input" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Surface (m²)">
              <input className="input" value={form.storageAreaM2} onChange={(e) => setForm({ ...form, storageAreaM2: e.target.value })} />
            </Field>
            <Field label="Volume (m³)">
              <input className="input" value={form.storageVolumeM3} onChange={(e) => setForm({ ...form, storageVolumeM3: e.target.value })} />
            </Field>
          </div>

          {form.type === "HUB_3PL" && (
            <Field label="Opérateur">
              <input className="input" value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })} />
            </Field>
          )}

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-kitea-blue text-white text-sm font-medium py-2 disabled:opacity-50"
          >
            <Plus size={16} /> {editingId ? "Enregistrer" : "Ajouter le site"}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="input max-w-xs"
              placeholder="Rechercher (nom, code, ville)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input max-w-[160px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as LocationType | "ALL")}>
              <option value="ALL">Tous types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="accent-kitea-blue" />
              Afficher les sites désactivés
            </label>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Site</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Ville</th>
                  <th className="text-left px-4 py-3">Statut</th>
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
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      Aucun site trouvé pour ces filtres.
                    </td>
                  </tr>
                )}
                {filtered.map((location) => (
                  <tr key={location.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{location.name}</p>
                      <p className="text-xs text-slate-400">{location.code}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{TYPE_LABELS[location.type]}</td>
                    <td className="px-4 py-3 text-slate-500">{location.city}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs rounded-full px-2 py-0.5 ${location.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {location.isActive ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => startEdit(location)} className="text-slate-400 hover:text-kitea-blue" title="Modifier">
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(location)}
                        className="text-slate-400 hover:text-red-600"
                        title={location.isActive ? "Désactiver" : "Réactiver"}
                      >
                        {location.isActive ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
