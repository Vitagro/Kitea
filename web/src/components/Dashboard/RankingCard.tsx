import { Trophy } from "lucide-react";

interface Column<T> {
  header: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

interface Props<T> {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: Column<T>[];
  emptyLabel: string;
  rowKey: (row: T) => string;
}

const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700"];

// Tableau de classement générique (magasins, livreurs, responsables de
// dépôt...) — les 3 premières lignes sont mises en avant avec une icône
// trophée, cohérent avec la demande de "classement pour identifier les
// meilleurs magasins, livreurs et responsables de dépôts".
export function RankingCard<T>({ title, subtitle, rows, columns, emptyLabel, rowKey }: Props<T>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2 w-8"></th>
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-2 ${col.align === "right" ? "text-right" : "text-left"}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-400 text-xs">
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={rowKey(row)} className="border-t border-slate-100">
              <td className="px-4 py-2">
                {index < 3 ? <Trophy size={14} className={MEDAL_COLORS[index]} /> : <span className="text-xs text-slate-300">{index + 1}</span>}
              </td>
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-2 ${col.align === "right" ? "text-right" : "text-left"}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
