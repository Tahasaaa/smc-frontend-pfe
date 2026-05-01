import { useEffect, useMemo, useState } from "react";

type DegradationQueueWidgetProps = {
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

type QueueRow = {
  nodeb_name: string;
  rnc: string;
  region_code: string;
  health_score: number | null;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_iub: number | null;
  avg_drop: number | null;
  severityScore: number;
  degradationReason: string;
};

export default function DegradationQueueWidget({
  filters,
  worstCells,
  onOpenMap,
  onOpenIncidents,
}: DegradationQueueWidgetProps) {
  const activeKpi = filters.kpiFocus || "health_score";

  const rows = useMemo(() => {
    return normalizeQueueRows(worstCells).slice(0, 8);
  }, [worstCells]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [rows.length]);

  const selectedRow = rows[selectedIndex] || null;

  const criticalCount = rows.filter((row) => row.severityScore >= 80).length;
  const watchCount = rows.filter(
    (row) => row.severityScore >= 45 && row.severityScore < 80
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <header className="border-b border-white/[0.06] bg-[#0f1722]/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Degradation Queue
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Tactical queue of the worst degrading entities for the active monitoring scope.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta
              label="Scope"
              value={filters.rnc || filters.region_code || "National"}
            />
            <TopMeta
              label="Focused KPI"
              value={formatFocusLabel(activeKpi)}
            />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatTile
            label="Queued Entities"
            value={String(rows.length)}
            helper="highest current risk"
          />
          <StatTile
            label="Critical Now"
            value={String(criticalCount)}
            helper="highest urgency"
          />
          <StatTile
            label="Watch State"
            value={String(watchCount)}
            helper="needs attention"
          />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
            <p className="text-sm font-medium text-white/86">
              No degradation queue available
            </p>
            <p className="mt-2 text-xs text-white/45">
              Once worst-site data is available, the queue will highlight the most degraded entities first.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-white/[0.06] bg-[#09111a] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                  Select entity
                </p>
                <p className="text-[11px] text-white/45">
                  Click a cell to inspect it
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {rows.map((row, index) => {
                  const active = index === selectedIndex;
                  const tone = getSeverityTone(row.severityScore);

                  return (
                    <button
                      key={`${row.nodeb_name}-${row.rnc}-${row.region_code}-${index}`}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className={[
                        "min-w-[190px] shrink-0 rounded-xl border px-3 py-3 text-left transition",
                        active
                          ? "border-[#ff7900]/45 bg-[#121d2a]"
                          : "border-white/[0.06] bg-[#101925] hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {row.nodeb_name || "Unknown NodeB"}
                          </p>
                          <p className="mt-1 text-[11px] text-white/45">
                            {(row.rnc || "Unknown RNC") + " · " + (row.region_code || "Unknown Region")}
                          </p>
                        </div>

                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}
                        >
                          {row.severityScore >= 80
                            ? "Critical"
                            : row.severityScore >= 45
                            ? "Watch"
                            : "Stable"}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <MiniMetric
                          label="Health"
                          value={formatMetric(row.health_score, "number")}
                        />
                        <MiniMetric
                          label="Score"
                          value={String(row.severityScore)}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRow ? (
              <div className="rounded-xl border border-white/[0.06] bg-[#101925] px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-white">
                        {selectedRow.nodeb_name || "Unknown NodeB"}
                      </h4>
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase ${getSeverityTone(
                          selectedRow.severityScore
                        )}`}
                      >
                        {selectedRow.severityScore >= 80
                          ? "Critical"
                          : selectedRow.severityScore >= 45
                          ? "Watch"
                          : "Stable"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-white/45">
                      {(selectedRow.rnc || "Unknown RNC") +
                        " · " +
                        (selectedRow.region_code || "Unknown Region")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/78">
                    Score {selectedRow.severityScore}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <MetricCard
                    label="Health"
                    value={formatMetric(selectedRow.health_score, "number")}
                  />
                  <MetricCard
                    label="CSSR"
                    value={formatMetric(selectedRow.avg_cssr_ps, "percent1")}
                  />
                  <MetricCard
                    label="PS RAB"
                    value={formatMetric(selectedRow.avg_ps_rab_sr, "percent1")}
                  />
                  <MetricCard
                    label="TPUT"
                    value={formatMetric(selectedRow.avg_throughput, "kbps")}
                  />
                  <MetricCard
                    label="IUB"
                    value={formatMetric(selectedRow.avg_iub, "percent1")}
                  />
                  <MetricCard
                    label="Drop"
                    value={formatMetric(selectedRow.avg_drop, "percent1")}
                  />
                </div>

                <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
                    Primary reason
                  </p>
                  <p className="mt-2 text-sm text-white/82">
                    {selectedRow.degradationReason}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionChip
                    label="Open Map"
                    onClick={() =>
                      onOpenMap?.({
                        kpi: activeKpi,
                        nodeb_name: selectedRow.nodeb_name,
                        rnc: selectedRow.rnc,
                        region_code: selectedRow.region_code,
                      })
                    }
                  />
                  <ActionChip
                    label="Open Incidents"
                    onClick={() =>
                      onOpenIncidents?.({
                        kpi: activeKpi,
                        nodeb_name: selectedRow.nodeb_name,
                        rnc: selectedRow.rnc,
                        region_code: selectedRow.region_code,
                      })
                    }
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function normalizeQueueRows(input: unknown[]): QueueRow[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;

      const normalized = {
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

      return {
        ...normalized,
        severityScore: computeSeverityScore(normalized),
        degradationReason: buildReason(normalized),
      };
    })
    .sort((a, b) => b.severityScore - a.severityScore);
}

function computeSeverityScore(row: {
  health_score: number | null;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_iub: number | null;
  avg_drop: number | null;
}) {
  let score = 0;

  if (typeof row.health_score === "number") {
    if (row.health_score < 80) score += 40;
    else if (row.health_score < 90) score += 20;
  }

  if (typeof row.avg_cssr_ps === "number") {
    if (row.avg_cssr_ps < 92) score += 22;
    else if (row.avg_cssr_ps < 95) score += 12;
  }

  if (typeof row.avg_ps_rab_sr === "number") {
    if (row.avg_ps_rab_sr < 92) score += 18;
    else if (row.avg_ps_rab_sr < 95) score += 10;
  }

  if (typeof row.avg_throughput === "number") {
    if (row.avg_throughput < 650) score += 18;
    else if (row.avg_throughput < 900) score += 10;
  }

  if (typeof row.avg_iub === "number") {
    if (row.avg_iub > 7) score += 18;
    else if (row.avg_iub > 4) score += 10;
  }

  if (typeof row.avg_drop === "number") {
    if (row.avg_drop > 2.5) score += 22;
    else if (row.avg_drop > 1.5) score += 12;
  }

  return Math.min(score, 100);
}

function buildReason(row: {
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_iub: number | null;
  avg_drop: number | null;
}) {
  if (typeof row.avg_drop === "number" && row.avg_drop > 2.5) {
    return "High drop rate";
  }

  if (typeof row.avg_iub === "number" && row.avg_iub > 7) {
    return "IUB congestion";
  }

  if (typeof row.avg_cssr_ps === "number" && row.avg_cssr_ps < 92) {
    return "Low CSSR";
  }

  if (typeof row.avg_ps_rab_sr === "number" && row.avg_ps_rab_sr < 92) {
    return "Low PS RAB SR";
  }

  if (typeof row.avg_throughput === "number" && row.avg_throughput < 650) {
    return "Low throughput";
  }

  return "Health degradation";
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

function formatMetric(value: number | null, kind: "number" | "percent1" | "kbps") {
  if (value === null || Number.isNaN(value)) return "—";
  if (kind === "percent1") return `${value.toFixed(1)}%`;
  if (kind === "kbps") return `${value.toFixed(0)} kbps`;
  return value.toFixed(1);
}

function getSeverityTone(score: number) {
  if (score >= 80) {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  if (score >= 45) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
}

function TopMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
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
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#101925] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/45">{helper}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-[12px] font-medium text-white/82">{value}</p>
    </div>
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
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ActionChip({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/72 transition hover:bg-white/[0.08] hover:text-white"
    >
      {label}
    </button>
  );
}