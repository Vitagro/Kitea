import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ImportResult } from "../../types/orders";

interface Props {
  result: ImportResult;
}

export function ImportResultBanner({ result }: Props) {
  const successCount = (result.created ?? 0) + (result.imported ?? 0) + (result.updated ?? 0);
  const hasErrors = result.errors.length > 0;

  return (
    <div className={`rounded-lg border p-4 text-sm space-y-2 ${hasErrors ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
      <div className="flex items-center gap-2 font-medium">
        {hasErrors ? <AlertCircle size={16} className="text-amber-600" /> : <CheckCircle2 size={16} className="text-emerald-600" />}
        <span>
          {successCount} ligne(s) traitée(s) sur {result.totalRows}
          {result.created ? ` · ${result.created} créée(s)` : ""}
          {result.updated ? ` · ${result.updated} mise(s) à jour` : ""}
          {result.skipped ? ` · ${result.skipped} ignorée(s)` : ""}
        </span>
      </div>

      {hasErrors && (
        <ul className="text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto">
          {result.errors.map((err, i) => (
            <li key={i}>
              Ligne {err.row} : {err.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
