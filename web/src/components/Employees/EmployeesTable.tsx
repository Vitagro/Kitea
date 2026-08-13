"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { employeesService } from "../../services/employeesService";
import { locationsService } from "../../services/locationsService";
import { Employee, EmployeeRole, Location } from "../../types";

const ROLE_LABELS: Record<EmployeeRole, string> = {
  STORE_MANAGER: "Responsable magasin",
  WAREHOUSE_MANAGER: "Responsable dépôt",
  DRIVER: "Livreur",
  DISPATCHER: "Planificateur transport",
  HEAD_OF_LOGISTICS: "Direction logistique",
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "DRIVER" as EmployeeRole,
  locationId: "",
};

// Gestion des collaborateurs (Module 6) : magasins, dépôts, livreurs — base
// du suivi de KPI par collaborateur (classements, ponctualité).
export function EmployeesTable() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setIsLoading(true);
    const [employeesData, locationsData] = await Promise.all([
      employeesService.list({ activeOnly: !includeInactive }),
      locationsService.list({ includeInactive: false }),
    ]);
    setEmployees(employeesData);
    setLocations(locationsData);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Prénom, nom et email sont requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      await employeesService.create({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        locationId: form.locationId || undefined,
      });
      setForm(EMPTY_FORM);
      await reload();
    } catch {
      setError("Échec de la création — l'email existe peut-être déjà.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(employee: Employee) {
    if (employee.isActive) await employeesService.deactivate(employee.id);
    else await employeesService.reactivate(employee.id);
    await reload();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 space-y-3 h-fit">
        <h2 className="font-semibold text-slate-900">Nouveau collaborateur</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Prénom</label>
            <input className="input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Nom</label>
            <input className="input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Téléphone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Rôle</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as EmployeeRole })}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Site de rattachement</label>
          <select className="input" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
            <option value="">— Aucun —</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.city})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-kitea-blue text-white text-sm font-medium py-2 disabled:opacity-50"
        >
          <Plus size={16} /> Ajouter
        </button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} className="accent-kitea-blue" />
          Afficher les collaborateurs désactivés
        </label>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Site</th>
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
              {!isLoading && employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Aucun collaborateur enregistré.
                  </td>
                </tr>
              )}
              {employees.map((employee) => (
                <tr key={employee.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{employee.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{ROLE_LABELS[employee.role]}</td>
                  <td className="px-4 py-3 text-slate-500">{employee.location?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${employee.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {employee.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleActive(employee)}
                      className="text-slate-400 hover:text-red-600"
                      title={employee.isActive ? "Désactiver" : "Réactiver"}
                    >
                      {employee.isActive ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
