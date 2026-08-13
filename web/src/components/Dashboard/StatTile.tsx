import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "warning" | "negative";
  hint?: string;
}

const TONE_STYLES: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-blue-50 text-kitea-blue",
  positive: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  negative: "bg-red-50 text-red-600",
};

export function StatTile({ label, value, icon: Icon, tone = "default", hint }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 ${TONE_STYLES[tone]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
