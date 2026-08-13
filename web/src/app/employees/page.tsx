import { EmployeesTable } from "@/components/Employees/EmployeesTable";

export default function EmployeesPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Collaborateurs</h1>
      <EmployeesTable />
    </div>
  );
}
