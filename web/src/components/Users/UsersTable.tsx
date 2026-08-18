"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { usersService } from "../../services/usersService";
import { employeesService } from "../../services/employeesService";
import { Employee, User, UserRole } from "../../types";

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Administrateur",
  HEAD_OF_LOGISTICS: "Direction logistique",
  DISPATCHER: "Planificateur transport",
  WAREHOUSE_MANAGER: "Responsable dépôt",
  STORE_MANAGER: "Responsable magasin",
  FINANCE_CONTROLLER: "Contrôle de gestion",
  DRIVER: "Livreur",
  VIEWER: "Lecture seule",
};

const EMPTY_FORM = {
  email: "",
  password: "",
  fullName: "",
  role: "VIEWER" as UserRole,
  employeeId: "",
};

// Panel d'administration des comptes applicatifs — réservé aux SUPER_ADMIN
// côté API (requireRole sur /api/users) ; l'accès UI est filtré dans la page.
export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setIsLoading(true);
    const [usersData, employeesData] = await Promise.all([
      usersService.list(),
      employeesService.list({ activeOnly: true }),
    ]);
    setUsers(usersData);
    setEmployees(employeesData);
    setIsLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.fullName.trim() || form.password.length < 8) {
      setError("Email, nom complet et mot de passe (8 caractères min.) sont requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      await usersService.create({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        employeeId: form.employeeId || undefined,
      });
      setForm(EMPTY_FORM);
      await reload();
    } catch {
      setError("Échec de la création — l'email existe peut-être déjà.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(user: User) {
    if (user.isActive) await usersService.deactivate(user.id);
    else await usersService.reactivate(user.id);
    await reload();
  }

  async function handleRoleChange(user: User, role: UserRole) {
    await usersService.update(user.id, { role });
    await reload();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 space-y-3 h-fit">
        <h2 className="font-semibold text-slate-900">Nouvel utilisateur</h2>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Nom complet</label>
          <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Email</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Mot de passe (8 caractères min.)</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Rôle</label>
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Collaborateur lié (optionnel)</label>
          <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            <option value="">— Aucun —</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
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
          <Plus size={16} /> Créer le compte
        </button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Dernière connexion</th>
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
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    Aucun utilisateur enregistré.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{user.fullName}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="input py-1 text-xs"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("fr-FR") : "Jamais"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs rounded-full px-2 py-0.5 ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {user.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleActive(user)}
                      className="text-slate-400 hover:text-red-600"
                      title={user.isActive ? "Désactiver" : "Réactiver"}
                    >
                      {user.isActive ? <Trash2 size={16} /> : <RotateCcw size={16} />}
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
