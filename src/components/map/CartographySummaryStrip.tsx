import type { CartographySummary } from "@/types/cartography";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Radar,
  ShieldAlert,
} from "lucide-react";

type CartographySummaryStripProps = {
  summary: CartographySummary | null;
  loading?: boolean;
};

export default function CartographySummaryStrip({
  summary,
  loading = false,
}: CartographySummaryStripProps) {
  const items = [
    {
      label: "Total Sites",
      value: summary?.total_sites ?? 0,
      tone: "default" as const,
      icon: <Radar className="h-3.5 w-3.5" />,
    },
    {
      label: "Stable",
      value: summary?.good_sites ?? 0,
      tone: "good" as const,
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    {
      label: "Watch",
      value: summary?.warning_sites ?? 0,
      tone: "warning" as const,
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    {
      label: "Alert",
      value: summary?.critical_sites ?? 0,
      tone: "critical" as const,
      icon: <ShieldAlert className="h-3.5 w-3.5" />,
    },
    {
      label: "Unknown",
      value: summary?.unknown_sites ?? 0,
      tone: "unknown" as const,
      icon: <HelpCircle className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <SummaryCard
          key={item.label}
          label={item.label}
          value={item.value}
          tone={item.tone}
          icon={item.icon}
          loading={loading}
        />
      ))}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
  loading,
}: {
  label: string;
  value: number;
  tone: "default" | "good" | "warning" | "critical" | "unknown";
  icon: React.ReactNode;
  loading: boolean;
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/18 bg-[linear-gradient(180deg,rgba(80,190,135,0.07),rgba(16,24,33,0.98))] text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/18 bg-[linear-gradient(180deg,rgba(255,182,18,0.07),rgba(16,24,33,0.98))] text-amber-300"
      : tone === "critical"
      ? "border-red-500/18 bg-[linear-gradient(180deg,rgba(255,90,95,0.07),rgba(16,24,33,0.98))] text-red-300"
      : tone === "unknown"
      ? "border-slate-500/18 bg-[linear-gradient(180deg,rgba(148,163,184,0.07),rgba(16,24,33,0.98))] text-slate-300"
      : "border-white/[0.06] bg-[#101925] text-white/85";

  return (
    <div className={`rounded-[1rem] border px-4 py-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">
          {label}
        </p>
        <span className="opacity-80">{icon}</span>
      </div>

      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-white/10" />
      ) : (
        <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em]">
          {value}
        </p>
      )}
    </div>
  );
}