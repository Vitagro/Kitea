"use client";

import { useAuth } from "@/lib/AuthContext";
import { UsersTable } from "@/components/Users/UsersTable";

export default function UsersPage() {
  const { user } = useAuth();

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">Accès réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Utilisateurs</h1>
      <UsersTable />
    </div>
  );
}
