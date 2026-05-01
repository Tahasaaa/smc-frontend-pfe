import type { CartographyTooltipState } from "@/types/cartography";

type MapTooltipProps = {
  tooltip: CartographyTooltipState;
};

export default function MapTooltip({ tooltip }: MapTooltipProps) {
  if (!tooltip) return null;

  const { x, y, site } = tooltip;

  return (
    <div
      className="pointer-events-none absolute z-30 min-w-[260px] max-w-[300px] rounded-[1rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(15,23,34,0.98),rgba(10,16,24,0.98))] px-4 py-3.5 shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-md"
      style={{
        left: `${x + 14}px`,
        top: `${y - 14}px`,
        transform: "translateY(-100%)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/38">
            Site
          </p>
          <h4 className="mt-1 truncate text-sm font-semibold text-white">
            {site.nodeb_name}
          </h4>
          <p className="mt-1 text-[11px] text-white/42">{site.rnc_name}</p>
        </div>

        <StatusBadge status={site.status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px]">
        <TooltipMetric label="Health" value={formatNumber(site.health_score, 1)} />
        <TooltipMetric label="KPI Issue" value={site.main_kpi_issue || "none"} />
        <TooltipMetric
          label="Active Incidents"
          value={String(site.active_incident_count ?? 0)}
        />
        <TooltipMetric
          label="Critical Incidents"
          value={String(site.critical_incident_count ?? 0)}
        />
      </div>

      {site.last_incident_title ? (
        <div className="mt-3 rounded-[0.85rem] border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/38">
            Last Incident
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] text-white/72">
            {site.last_incident_title}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TooltipMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-medium text-white/84">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "good" | "warning" | "critical" | "unknown";
}) {
  const toneClass =
    status === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : status === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : status === "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-300"
      : "border-slate-500/20 bg-slate-500/10 text-slate-300";

  const label =
    status === "good"
      ? "Stable"
      : status === "warning"
      ? "Watch"
      : status === "critical"
      ? "Alert"
      : "Unknown";

  return (
    <span
      className={`inline-flex rounded-[0.75rem] border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${toneClass}`}
    >
      {label}
    </span>
  );
}

function formatNumber(value: number | null, digits = 1) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}