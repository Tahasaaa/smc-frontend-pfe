import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  MapPinned,
  ShieldAlert,
} from "lucide-react";

type WorstSitesTableWidgetProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    kpiFocus?: string;
  };
  worstCells: unknown[];
  onOpenMap?: (payload?: unknown) => void;
  onOpenIncidents?: (payload?: unknown) => void;
};

type WorstSiteRow = {
  nodeb_name: string;
  rnc: string;
  region_code: string;
  health_score: number | null;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_iub: number | null;
  avg_drop: number | null;
};

export default function WorstSitesTableWidget({
  filters,
  worstCells,
  onOpenMap,
  onOpenIncidents,
}: WorstSitesTableWidgetProps) {
  const rows = useMemo(() => normalizeWorstCells(worstCells), [worstCells]);

  const focusKey = filters.kpiFocus || "health_score";
  const focusLabel = formatFocusLabel(focusKey);

  const criticalHealth = rows.filter(
    (row) => typeof row.health_score === "number" && row.health_score < 80
  ).length;

  const lowCssr = rows.filter(
    (row) => typeof row.avg_cssr_ps === "number" && row.avg_cssr_ps < 95
  ).length;

  const highDrop = rows.filter(
    (row) => typeof row.avg_drop === "number" && row.avg_drop > 2.5
  ).length;

  return (
    <section className="overflow-hidden rounded-[1.22rem] border border-white/[0.06] bg-[linear-gradient(180deg,#0d141c_0%,#0b1219_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.24)]">
      <header className="border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
              <AlertTriangle className="h-3.5 w-3.5 text-[#ff7900]" />
              Weakest scope ranking
            </div>
            <h3 className="mt-1.5 text-[1rem] font-semibold tracking-[-0.03em] text-white">
              Worst Sites Table
            </h3>
            <p className="mt-1 text-sm text-white/46">
              Dense operator ranking for degraded NodeB entities, KPI risk, and
              drill-ready investigation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta
              label="Scope"
              value={filters.rnc || filters.region_code || "National"}
            />
            <TopMeta label="Focused KPI" value={focusLabel} />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Rows Loaded"
            value={String(rows.length)}
            helper="worst entities"
            accent="#FF7900"
          />
          <StatTile
            label="Critical Health"
            value={String(criticalHealth)}
            helper="health < 80"
            accent="#FF5A5F"
          />
          <StatTile
            label="Low CSSR"
            value={String(lowCssr)}
            helper="cssr < 95%"
            accent="#FFB612"
          />
          <StatTile
            label="High Drop"
            value={String(highDrop)}
            helper="drop > 2.5%"
            accent="#A885D8"
          />
        </div>

        <div className="overflow-hidden rounded-[1.08rem] border border-white/[0.06] bg-[#09111a]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#111a24] text-left text-[10px] uppercase tracking-[0.12em] text-white/38">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">NodeB</th>
                  <th className="px-4 py-3 font-medium">RNC</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">CSSR</th>
                  <th className="px-4 py-3 font-medium">PS RAB</th>
                  <th className="px-4 py-3 font-medium">Tput</th>
                  <th className="px-4 py-3 font-medium">IUB</th>
                  <th className="px-4 py-3 font-medium">Drop</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-sm text-white/45"
                    >
                      No worst-site rows available for the current scope.
                    </td>
                  </tr>
                ) : (
                  rows.slice(0, 16).map((row, index) => {
                    const posture = getRowPosture(row);

                    return (
                      <tr
                        key={`${row.nodeb_name}-${row.rnc}-${row.region_code}-${index}`}
                        className={[
                          "border-t border-white/[0.06] text-white/80 transition hover:bg-[#101925]",
                          posture === "critical"
                            ? "hover:shadow-[inset_3px_0_0_rgba(255,90,95,0.88)]"
                            : posture === "warning"
                            ? "hover:shadow-[inset_3px_0_0_rgba(255,182,18,0.88)]"
                            : "hover:shadow-[inset_3px_0_0_rgba(80,190,135,0.88)]",
                        ].join(" ")}
                      >
                        <td className="px-4 py-3 align-middle">
                          <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] px-2 text-[11px] font-semibold text-white/82">
                            {index + 1}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 align-middle">
                          <div className="flex min-w-0 flex-col">
                            <span className="text-[13px] font-semibold text-white">
                              {row.nodeb_name || "—"}
                            </span>
                            <span className="mt-0.5 text-[11px] text-white/32">
                              degraded entity
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 align-middle text-[12px] text-white/68">
                          {row.rnc || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 align-middle text-[12px] text-white/68">
                          {row.region_code || "—"}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <MetricBadge
                            value={row.health_score}
                            format="number"
                            reverseBad={false}
                            watch={90}
                            alert={80}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <MetricBadge
                            value={row.avg_cssr_ps}
                            format="percent1"
                            reverseBad={false}
                            watch={95}
                            alert={92}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <MetricBadge
                            value={row.avg_ps_rab_sr}
                            format="percent1"
                            reverseBad={false}
                            watch={95}
                            alert={92}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <MetricBadge
                            value={row.avg_throughput}
                            format="kbps"
                            reverseBad={false}
                            watch={900}
                            alert={650}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <MetricBadge
                            value={row.avg_iub}
                            format="percent1"
                            reverseBad
                            watch={4}
                            alert={7}
                          />
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <MetricBadge
                            value={row.avg_drop}
                            format="percent2"
                            reverseBad
                            watch={1.5}
                            alert={2.5}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionChip
            label="Open Map"
            icon={<MapPinned className="h-3.5 w-3.5" />}
            onClick={() => onOpenMap?.({ kpi: focusKey })}
          />
          <ActionChip
            label="Open Incidents"
            icon={<ShieldAlert className="h-3.5 w-3.5" />}
            onClick={() => onOpenIncidents?.({ kpi: focusKey })}
          />
        </div>
      </div>
    </section>
  );
}

function normalizeWorstCells(input: unknown[]): WorstSiteRow[] {
  if (!Array.isArray(input)) return [];

  return input.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;

    return {
      nodeb_name: asString(row.nodeb_name),
      rnc: asString(row.rnc),
      region_code: asString(row.region_code),
      health_score: asNumber(row.health_score),
      avg_cssr_ps: asNumber(row.avg_cssr_ps),
      avg_ps_rab_sr: asNumber(row.avg_ps_rab_sr),
      avg_throughput: asNumber(row.avg_throughput),
      avg_iub: asNumber(row.avg_iub),
      avg_drop: asNumber(row.avg_drop),
    };
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatFocusLabel(value: string) {
  if (value === "avg_cssr_ps") return "CSSR-PS";
  if (value === "avg_ps_rab_sr") return "PS RAB SR";
  if (value === "avg_throughput") return "Throughput";
  if (value === "avg_iub_congestion") return "IUB Congestion";
  if (value === "avg_call_drop_dch") return "Drop Rate";
  return value;
}

function formatMetric(
  value: number | null,
  format: "number" | "percent1" | "percent2" | "kbps"
) {
  if (value === null || Number.isNaN(value)) return "—";
  if (format === "percent1") return `${value.toFixed(1)}%`;
  if (format === "percent2") return `${value.toFixed(2)}%`;
  if (format === "kbps") return `${value.toFixed(0)} kbps`;
  return value.toFixed(1);
}

function getTone({
  value,
  reverseBad,
  watch,
  alert,
}: {
  value: number | null;
  reverseBad: boolean;
  watch: number;
  alert: number;
}) {
  if (value === null || Number.isNaN(value)) {
    return "border-slate-500/20 bg-slate-500/10 text-slate-300";
  }

  if (!reverseBad) {
    if (value <= alert) return "border-red-500/20 bg-red-500/10 text-red-300";
    if (value <= watch)
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (value >= alert) return "border-red-500/20 bg-red-500/10 text-red-300";
  if (value >= watch)
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

function getRowPosture(row: WorstSiteRow) {
  if (typeof row.health_score === "number" && row.health_score < 80) {
    return "critical";
  }
  if (
    (typeof row.avg_drop === "number" && row.avg_drop > 2.5) ||
    (typeof row.avg_iub === "number" && row.avg_iub > 7)
  ) {
    return "critical";
  }
  if (
    (typeof row.health_score === "number" && row.health_score < 90) ||
    (typeof row.avg_cssr_ps === "number" && row.avg_cssr_ps < 95)
  ) {
    return "warning";
  }
  return "good";
}

function MetricBadge({
  value,
  format,
  reverseBad,
  watch,
  alert,
}: {
  value: number | null;
  format: "number" | "percent1" | "percent2" | "kbps";
  reverseBad: boolean;
  watch: number;
  alert: number;
}) {
  const tone = getTone({ value, reverseBad, watch, alert });

  return (
    <span
      className={`inline-flex rounded-[0.8rem] border px-2.5 py-1 text-[11px] font-medium ${tone}`}
    >
      {formatMetric(value, format)}
    </span>
  );
}

function TopMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[0.9rem] border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-white/82">{value}</p>
    </div>
  );
}

function StatTile({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/[0.06] bg-[#101925] px-3.5 py-3">
      <div
        className="mb-2 h-1 w-10 rounded-full"
        style={{ background: accent }}
      />
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-[1.05rem] font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/45">{helper}</p>
    </div>
  );
}

function ActionChip({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="orange-ring-focus inline-flex items-center gap-2 rounded-[0.9rem] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/72 transition hover:bg-white/[0.08] hover:text-white"
    >
      {icon}
      {label}
      <ArrowUpRight className="h-3.5 w-3.5" />
    </button>
  );
}