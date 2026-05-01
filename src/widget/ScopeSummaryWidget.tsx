import { useMemo } from "react";

type ScopeSummaryWidgetProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    kpiFocus?: string;
  };
  summary: unknown[];
  validSummary: unknown[];
};

type SummaryRow = {
  region_code: string | null;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_hsdpa_tput: number | null;
  avg_iub_congestion: number | null;
  avg_ce_congestion: number | null;
  avg_call_drop_dch: number | null;
  record_count: number | null;
};

export default function ScopeSummaryWidget({
  filters,
  summary,
  validSummary,
}: ScopeSummaryWidgetProps) {
  const rows = useMemo(() => normalizeSummary(summary), [summary]);
  const validRows = useMemo(() => normalizeSummary(validSummary), [validSummary]);

  const aggregate = useMemo(() => {
    return {
      avgCssr: average(rows.map((row) => row.avg_cssr_ps)),
      avgPsRab: average(rows.map((row) => row.avg_ps_rab_sr)),
      avgThroughput: average(
        rows.map((row) =>
          typeof row.avg_throughput === "number"
            ? row.avg_throughput
            : row.avg_hsdpa_tput
        )
      ),
      avgIub: average(rows.map((row) => row.avg_iub_congestion)),
      avgDrop: average(rows.map((row) => row.avg_call_drop_dch)),
      totalRecords: sum(rows.map((row) => row.record_count)),
      scopeCount: rows.length,
      validCount: validRows.length,
    };
  }, [rows, validRows]);

  const qualityState = getQualityState(aggregate.avgCssr, aggregate.avgDrop);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <header className="border-b border-white/[0.06] bg-[#0f1722]/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Scope Summary
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Compact monitoring scope digest for the active selection and KPI
              focus.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta
              label="Scope"
              value={filters.rnc || filters.region_code || "National"}
            />
            <TopMeta label="Window" value={filters.dateRange || "24h"} />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatTile
            label="Summary Rows"
            value={String(aggregate.scopeCount)}
            helper="loaded scopes"
          />
          <StatTile
            label="Valid Rows"
            value={String(aggregate.validCount)}
            helper="usable scopes"
          />
          <StatTile
            label="State"
            value={qualityState.label}
            helper={qualityState.helper}
            accent={qualityState.accent}
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <ScopeMetricCard
            label="Avg CSSR-PS"
            value={formatPercent(aggregate.avgCssr, 1)}
            tone={getPositiveTone(aggregate.avgCssr, 95, 92)}
          />
          <ScopeMetricCard
            label="Avg PS RAB SR"
            value={formatPercent(aggregate.avgPsRab, 1)}
            tone={getPositiveTone(aggregate.avgPsRab, 95, 92)}
          />
          <ScopeMetricCard
            label="Avg Throughput"
            value={formatKbps(aggregate.avgThroughput)}
            tone={getPositiveTone(aggregate.avgThroughput, 900, 650)}
          />
          <ScopeMetricCard
            label="Avg IUB Congestion"
            value={formatPercent(aggregate.avgIub, 1)}
            tone={getReverseTone(aggregate.avgIub, 4, 7)}
          />
          <ScopeMetricCard
            label="Avg Drop Rate"
            value={formatPercent(aggregate.avgDrop, 2)}
            tone={getReverseTone(aggregate.avgDrop, 1.5, 2.5)}
          />
          <ScopeMetricCard
            label="Total Records"
            value={String(aggregate.totalRecords)}
            tone="default"
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#09111a] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Scope Health Snapshot
          </p>

          <div className="mt-3 space-y-3">
            <ProgressRow
              label="Quality"
              value={normalizePercent(aggregate.avgCssr, 100)}
              tone="good"
            />
            <ProgressRow
              label="Throughput"
              value={normalizePercent(aggregate.avgThroughput, 1500)}
              tone="info"
            />
            <ProgressRow
              label="Congestion Pressure"
              value={normalizeReversePercent(aggregate.avgIub, 10)}
              tone="warning"
            />
            <ProgressRow
              label="Drop Pressure"
              value={normalizeReversePercent(aggregate.avgDrop, 5)}
              tone="critical"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function normalizeSummary(input: unknown[]): SummaryRow[] {
  if (!Array.isArray(input)) return [];

  return input.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;

    return {
      region_code:
        typeof row.region_code === "string" ? row.region_code : null,
      avg_cssr_ps: asNumber(row.avg_cssr_ps),
      avg_ps_rab_sr: asNumber(row.avg_ps_rab_sr),
      avg_throughput: asNumber(row.avg_throughput),
      avg_hsdpa_tput: asNumber(row.avg_hsdpa_tput),
      avg_iub_congestion: asNumber(row.avg_iub_congestion),
      avg_ce_congestion: asNumber(row.avg_ce_congestion),
      avg_call_drop_dch: asNumber(row.avg_call_drop_dch),
      record_count: asNumber(row.record_count),
    };
  });
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function average(values: Array<number | null>) {
  const valid = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );

  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function sum(values: Array<number | null>): number {
  return values.reduce<number>((accumulator, value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return accumulator;
    }

    return accumulator + value;
  }, 0);
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatKbps(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)} kbps`;
}

function getPositiveTone(
  value: number | null,
  watch: number,
  alert: number
): "good" | "warning" | "critical" | "default" {
  if (value === null || Number.isNaN(value)) return "default";
  if (value <= alert) return "critical";
  if (value <= watch) return "warning";
  return "good";
}

function getReverseTone(
  value: number | null,
  watch: number,
  alert: number
): "good" | "warning" | "critical" | "default" {
  if (value === null || Number.isNaN(value)) return "default";
  if (value >= alert) return "critical";
  if (value >= watch) return "warning";
  return "good";
}

function getQualityState(avgCssr: number | null, avgDrop: number | null) {
  if (
    typeof avgCssr === "number" &&
    avgCssr >= 95 &&
    typeof avgDrop === "number" &&
    avgDrop <= 1.5
  ) {
    return {
      label: "Stable",
      helper: "healthy scope posture",
      accent: "#10b981",
    };
  }

  if (
    typeof avgCssr === "number" &&
    avgCssr >= 92 &&
    typeof avgDrop === "number" &&
    avgDrop <= 2.5
  ) {
    return {
      label: "Watch",
      helper: "monitoring attention needed",
      accent: "#f59e0b",
    };
  }

  return {
    label: "Alert",
    helper: "degraded scope posture",
    accent: "#ef4444",
  };
}

function normalizePercent(value: number | null, max: number) {
  if (value === null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min((value / max) * 100, 100));
}

function normalizeReversePercent(value: number | null, worst: number) {
  if (value === null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min((value / worst) * 100, 100));
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
  accent = "#a78bfa",
}: {
  label: string;
  value: string;
  helper: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#101925] px-3 py-3">
      <div
        className="mb-2 h-1 w-10 rounded-full"
        style={{ background: accent }}
      />
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/45">{helper}</p>
    </div>
  );
}

function ScopeMetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warning" | "critical" | "default";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : tone === "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-300"
      : "border-white/[0.06] bg-[#101925] text-white/82";

  return (
    <div className={`rounded-xl border px-3 py-3 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.1em] opacity-75">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "warning" | "critical" | "info";
}) {
  const barClass =
    tone === "good"
      ? "bg-emerald-400"
      : tone === "warning"
      ? "bg-amber-400"
      : tone === "critical"
      ? "bg-red-400"
      : "bg-sky-400";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs text-white/70">{label}</span>
        <span className="text-[11px] text-white/45">{value.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06]">
        <div
          className={`h-2 rounded-full ${barClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}