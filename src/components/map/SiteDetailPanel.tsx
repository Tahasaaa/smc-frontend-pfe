import type { CartographySelectedSiteState } from "@/types/cartography";

type SiteDetailPanelProps = {
  selectedSite: CartographySelectedSiteState;
  onClose?: () => void;
};

export default function SiteDetailPanel({
  selectedSite,
  onClose,
}: SiteDetailPanelProps) {
  if (!selectedSite) {
    return (
      <section className="premium-panel rounded-[1.35rem] overflow-hidden">
        <header className="premium-panel-header">
          <div className="min-w-0">
            <h3 className="panel-title">Inspection Panel</h3>
            <p className="panel-subtitle">
              Click a marker to inspect site KPIs and incident context.
            </p>
          </div>
        </header>

        <div className="premium-panel-body flex min-h-[520px] items-center justify-center px-6 text-center">
          <div>
            <p className="text-base font-medium text-white">No site selected</p>
            <p className="mt-2 text-sm text-white/45">
              Hover a marker for quick context or click one to open the full site panel.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { marker, detail, loading, error } = selectedSite;

  const site = {
    ...marker,
    ...(detail ?? {}),
    nodeb_name: detail?.nodeb_name || marker.nodeb_name,
    nodeb_name_norm: detail?.nodeb_name_norm || marker.nodeb_name_norm,
    rnc_name: detail?.rnc_name || marker.rnc_name,
    status: detail?.status || marker.status,
    main_kpi_issue: detail?.main_kpi_issue || marker.main_kpi_issue,
    last_incident_title: detail?.last_incident_title || marker.last_incident_title,
    health_score:
      typeof detail?.health_score === "number" ? detail.health_score : marker.health_score,
    avg_cssr_ps:
      typeof detail?.avg_cssr_ps === "number" ? detail.avg_cssr_ps : marker.avg_cssr_ps,
    avg_ps_rab_sr:
      typeof detail?.avg_ps_rab_sr === "number" ? detail.avg_ps_rab_sr : marker.avg_ps_rab_sr,
    avg_throughput_3g:
      typeof detail?.avg_throughput_3g === "number"
        ? detail.avg_throughput_3g
        : marker.avg_throughput_3g,
    avg_iub_congestion:
      typeof detail?.avg_iub_congestion === "number"
        ? detail.avg_iub_congestion
        : marker.avg_iub_congestion,
    avg_drop_rate:
      typeof detail?.avg_drop_rate === "number"
        ? detail.avg_drop_rate
        : marker.avg_drop_rate,
    avg_availability_3g:
      typeof detail?.avg_availability_3g === "number"
        ? detail.avg_availability_3g
        : marker.avg_availability_3g,
    active_incident_count:
      typeof detail?.active_incident_count === "number"
        ? detail.active_incident_count
        : marker.active_incident_count,
    critical_incident_count:
      typeof detail?.critical_incident_count === "number"
        ? detail.critical_incident_count
        : marker.critical_incident_count,
    latitude: typeof detail?.latitude === "number" ? detail.latitude : marker.latitude,
    longitude: typeof detail?.longitude === "number" ? detail.longitude : marker.longitude,
    date: detail?.date || marker.date,
  };

  return (
    <section className="premium-panel rounded-[1.35rem] overflow-hidden">
      <header className="premium-panel-header">
        <div className="min-w-0">
          <h3 className="panel-title">Inspection Panel</h3>
          <p className="panel-subtitle">
            KPI inspection and incident-aware operational detail.
          </p>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="premium-button-ghost orange-ring-focus text-white/72 hover:text-white"
          >
            Close
          </button>
        ) : null}
      </header>

      <div className="premium-panel-body space-y-3">
        <div className="rounded-[1rem] border border-white/[0.06] bg-[#101925] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
                NodeB
              </p>
              <h4 className="mt-2 truncate text-[1.25rem] font-semibold tracking-[-0.03em] text-white">
                {site.nodeb_name || "Unknown NodeB"}
              </h4>
              <p className="mt-1 text-sm text-white/42">
                {site.rnc_name || "Unknown RNC"}
              </p>
            </div>

            <StatusBadge status={site.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMeta label="Health Score" value={formatNumber(site.health_score, 1)} />
            <MiniMeta label="Main Issue" value={site.main_kpi_issue || "none"} />
            <MiniMeta
              label="Active Incidents"
              value={String(site.active_incident_count ?? 0)}
            />
            <MiniMeta
              label="Critical Incidents"
              value={String(site.critical_incident_count ?? 0)}
            />
          </div>
        </div>

        {loading ? (
          <div className="rounded-[1rem] border border-white/[0.06] bg-[#101925] px-4 py-10">
            <div className="mx-auto flex max-w-[220px] flex-col items-center gap-3 text-center">
              <div className="h-10 w-10 animate-pulse rounded-xl border border-[#ff7900]/30 bg-[#ff7900]/10" />
              <div>
                <p className="text-sm font-medium text-white">Loading site details...</p>
                <p className="mt-1 text-xs text-white/45">
                  Fetching KPI and incident context.
                </p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[1rem] border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-300">
            Detail API incomplete: showing marker data fallback. {error}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="CSSR-PS" value={formatPercent(site.avg_cssr_ps, 1)} />
          <MetricCard label="PS RAB SR" value={formatPercent(site.avg_ps_rab_sr, 1)} />
          <MetricCard label="Throughput 3G" value={formatThroughput(site.avg_throughput_3g)} />
          <MetricCard label="IUB Congestion" value={formatPercent(site.avg_iub_congestion, 1)} />
          <MetricCard label="Drop Rate" value={formatPercent(site.avg_drop_rate, 2)} />
          <MetricCard label="Availability 3G" value={formatPercent(site.avg_availability_3g, 1)} />
        </div>

        <div className="rounded-[1rem] border border-white/[0.06] bg-[#101925] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/38">
            Last Incident
          </p>
          <p className="mt-2 text-sm font-medium text-white">
            {site.last_incident_title || "No recent incident title available"}
          </p>
        </div>

        <div className="rounded-[1rem] border border-white/[0.06] bg-[#101925] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/38">
            Site Identity
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniMeta label="Normalized Name" value={site.nodeb_name_norm || "—"} />
            <MiniMeta label="Date" value={formatDate(site.date)} />
            <MiniMeta label="Latitude" value={formatNumber(site.latitude ?? null, 5)} />
            <MiniMeta label="Longitude" value={formatNumber(site.longitude ?? null, 5)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[0.95rem] border border-white/[0.06] bg-[#101925] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/38">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[0.8rem] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-medium text-white/82">{value}</p>
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

function formatNumber(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatThroughput(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)} kbps`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}