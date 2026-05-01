import { useMemo } from "react";
import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";
import { Gauge, ShieldCheck } from "lucide-react";

type ScopeGaugeWidgetProps = {
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
};

export default function ScopeGaugeWidget({
  filters,
  summary,
  validSummary,
}: ScopeGaugeWidgetProps) {
  const rows = useMemo(() => normalizeSummary(summary), [summary]);
  const validRows = useMemo(() => normalizeSummary(validSummary), [validSummary]);

  const sourceRows = validRows.length ? validRows : rows;

  const aggregate = useMemo(() => {
    const avgCssr = average(sourceRows.map((row) => row.avg_cssr_ps));
    const avgPsRab = average(sourceRows.map((row) => row.avg_ps_rab_sr));
    const avgThroughput = average(
      sourceRows.map((row) =>
        typeof row.avg_throughput === "number"
          ? row.avg_throughput
          : row.avg_hsdpa_tput
      )
    );
    const avgIub = average(sourceRows.map((row) => row.avg_iub_congestion));
    const avgDrop = average(sourceRows.map((row) => row.avg_call_drop_dch));

    const cssrScore = normalizeHigherIsBetter(avgCssr, 100);
    const psRabScore = normalizeHigherIsBetter(avgPsRab, 100);
    const throughputScore = normalizeHigherIsBetter(avgThroughput, 1500);
    const iubScore = normalizeLowerIsBetter(avgIub, 10);
    const dropScore = normalizeLowerIsBetter(avgDrop, 5);

    const scopeHealth = weightedAverage([
      { value: cssrScore, weight: 0.25 },
      { value: psRabScore, weight: 0.2 },
      { value: throughputScore, weight: 0.2 },
      { value: iubScore, weight: 0.15 },
      { value: dropScore, weight: 0.2 },
    ]);

    return {
      avgCssr,
      avgPsRab,
      avgThroughput,
      avgIub,
      avgDrop,
      scopeHealth,
    };
  }, [sourceRows]);

  const stateBreakdown = useMemo(() => {
    let stable = 0;
    let watch = 0;
    let alert = 0;

    sourceRows.forEach((row) => {
      const score = computeRowHealthScore(row);

      if (score >= 85) stable += 1;
      else if (score >= 65) watch += 1;
      else alert += 1;
    });

    return { stable, watch, alert };
  }, [sourceRows]);

  const gaugeTone = getGaugeTone(aggregate.scopeHealth);

  const gaugeData = [
    {
      name: "Scope Health",
      value: aggregate.scopeHealth,
      fill: gaugeTone.color,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[1.22rem] border border-white/[0.06] bg-[linear-gradient(180deg,#0d141c_0%,#0b1219_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.24)]">
      <header className="border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
              <Gauge className="h-3.5 w-3.5 text-[#ff7900]" />
              Scope posture
            </div>
            <h3 className="mt-1.5 text-[1rem] font-semibold tracking-[-0.03em] text-white">
              Scope Gauge
            </h3>
            <p className="mt-1 text-sm text-white/46">
              High-level health posture for the active monitoring scope.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta
              label="Scope"
              value={filters.rnc || filters.region_code || "National"}
            />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatTile
            label="Scope Health"
            value={`${aggregate.scopeHealth.toFixed(0)}%`}
            helper={gaugeTone.label}
            accent={gaugeTone.color}
            featured
          />
          <StatTile
            label="Loaded Rows"
            value={String(rows.length)}
            helper="scope rows"
            accent="#4BB4E6"
          />
          <StatTile
            label="Valid Rows"
            value={String(validRows.length)}
            helper="usable rows"
            accent="#A885D8"
          />
        </div>

        <div className="rounded-[1.08rem] border border-white/[0.06] bg-[#09111a] p-3">
          <div className="relative h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={gaugeData}
                innerRadius="72%"
                outerRadius="100%"
                startAngle={210}
                endAngle={-30}
                barSize={18}
              >
                <RadialBar
                  background={{ fill: "rgba(255,255,255,0.08)" }}
                  cornerRadius={10}
                  dataKey="value"
                />
              </RadialBarChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-[0.12em] text-white/35">
                  Scope Health
                </p>
                <p className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-white">
                  {aggregate.scopeHealth.toFixed(0)}%
                </p>
                <p
                  className="mt-1 text-xs font-medium"
                  style={{ color: gaugeTone.color }}
                >
                  {gaugeTone.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <StateTile
            label="Stable"
            value={String(stateBreakdown.stable)}
            tone="good"
          />
          <StateTile
            label="Watch"
            value={String(stateBreakdown.watch)}
            tone="warning"
          />
          <StateTile
            label="Alert"
            value={String(stateBreakdown.alert)}
            tone="critical"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <MiniMetric label="Avg CSSR" value={formatPercent(aggregate.avgCssr, 1)} />
          <MiniMetric
            label="Avg Throughput"
            value={formatKbps(aggregate.avgThroughput)}
          />
          <MiniMetric label="Avg IUB" value={formatPercent(aggregate.avgIub, 1)} />
          <MiniMetric
            label="Avg Drop"
            value={formatPercent(aggregate.avgDrop, 2)}
          />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] text-white/68">
          <ShieldCheck className="h-3.5 w-3.5 text-[#ff7900]" />
          Gauge blends CSSR, PS RAB, throughput, IUB, and drop quality into one posture score.
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

function weightedAverage(
  items: Array<{ value: number; weight: number }>
): number {
  const weightSum = items.reduce((sum, item) => sum + item.weight, 0);
  if (weightSum === 0) return 0;

  const total = items.reduce((sum, item) => sum + item.value * item.weight, 0);
  return Math.max(0, Math.min(total / weightSum, 100));
}

function normalizeHigherIsBetter(value: number | null, max: number) {
  if (value === null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min((value / max) * 100, 100));
}

function normalizeLowerIsBetter(value: number | null, worst: number) {
  if (value === null || Number.isNaN(value)) return 0;
  const normalized = 100 - (value / worst) * 100;
  return Math.max(0, Math.min(normalized, 100));
}

function computeRowHealthScore(row: SummaryRow) {
  const cssr = normalizeHigherIsBetter(row.avg_cssr_ps, 100);
  const psRab = normalizeHigherIsBetter(row.avg_ps_rab_sr, 100);
  const throughput = normalizeHigherIsBetter(
    typeof row.avg_throughput === "number" ? row.avg_throughput : row.avg_hsdpa_tput,
    1500
  );
  const iub = normalizeLowerIsBetter(row.avg_iub_congestion, 10);
  const drop = normalizeLowerIsBetter(row.avg_call_drop_dch, 5);

  return weightedAverage([
    { value: cssr, weight: 0.25 },
    { value: psRab, weight: 0.2 },
    { value: throughput, weight: 0.2 },
    { value: iub, weight: 0.15 },
    { value: drop, weight: 0.2 },
  ]);
}

function getGaugeTone(score: number) {
  if (score >= 85) {
    return { label: "Stable posture", color: "#50BE87" };
  }

  if (score >= 65) {
    return { label: "Watch posture", color: "#FFB612" };
  }

  return { label: "Alert posture", color: "#FF5A5F" };
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatKbps(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(0)} kbps`;
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
  featured = false,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1rem] border px-3.5 py-3",
        featured
          ? "border-orange-400/14 bg-[linear-gradient(180deg,rgba(255,121,0,0.08),rgba(255,255,255,0.02))]"
          : "border-white/[0.06] bg-[#101925]",
      ].join(" ")}
    >
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

function StateTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warning" | "critical";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-red-500/20 bg-red-500/10 text-red-300";

  return (
    <div className={`rounded-[1rem] border px-3.5 py-3 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.1em] opacity-75">
        {label}
      </p>
      <p className="mt-2 text-[1.05rem] font-semibold">{value}</p>
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
    <div className="rounded-[0.95rem] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white/82">{value}</p>
    </div>
  );
}