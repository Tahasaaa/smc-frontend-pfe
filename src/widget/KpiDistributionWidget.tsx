import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type KpiDistributionWidgetProps = {
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

type DistributionBucket = {
  label: string;
  count: number;
  tone: string;
};

export default function KpiDistributionWidget({
  filters,
  summary,
  validSummary,
}: KpiDistributionWidgetProps) {
  const rows = useMemo(() => normalizeSummary(validSummary.length ? validSummary : summary), [summary, validSummary]);

  const focusKey = filters.kpiFocus || "avg_cssr_ps";
  const focusLabel = formatFocusLabel(focusKey);

  const values = useMemo(() => {
    return rows
      .map((row) => extractFocusedValue(row, focusKey))
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  }, [rows, focusKey]);

  const distribution = useMemo(() => {
    return buildDistribution(values, focusKey);
  }, [values, focusKey]);

  const totalCount = distribution.reduce((sum, bucket) => sum + bucket.count, 0);
  const maxBucket = distribution.reduce<number>((max, bucket) => Math.max(max, bucket.count), 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <header className="border-b border-white/[0.06] bg-[#0f1722]/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              KPI Distribution
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Spread of site performance and degradation density across the active KPI focus.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta label="Scope" value={filters.rnc || filters.region_code || "National"} />
            <TopMeta label="Focused KPI" value={focusLabel} />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <StatTile
            label="Samples"
            value={String(totalCount)}
            helper="valid KPI values"
            accent="#38bdf8"
          />
          <StatTile
            label="Buckets"
            value={String(distribution.length)}
            helper="distribution bands"
            accent="#a78bfa"
          />
          <StatTile
            label="Peak Bucket"
            value={String(maxBucket)}
            helper="highest density"
            accent="#ff7900"
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#09111a] p-3">
          <div className="h-[220px] w-full">
            {distribution.every((bucket) => bucket.count === 0) ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-center">
                <div>
                  <p className="text-sm font-medium text-white/86">
                    No KPI distribution available
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Once the focused KPI has valid summary data, the spread will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.50)", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip content={<DistributionTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {distribution.map((entry) => (
                      <Cell key={entry.label} fill={entry.tone} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {distribution.map((bucket) => (
            <BucketTile
              key={bucket.label}
              label={bucket.label}
              count={bucket.count}
              tone={bucket.tone}
            />
          ))}
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

function extractFocusedValue(row: SummaryRow, focusKey: string): number | null {
  if (focusKey === "avg_cssr_ps") return row.avg_cssr_ps;
  if (focusKey === "avg_ps_rab_sr") return row.avg_ps_rab_sr;
  if (focusKey === "avg_throughput") {
    return typeof row.avg_throughput === "number"
      ? row.avg_throughput
      : row.avg_hsdpa_tput;
  }
  if (focusKey === "avg_iub_congestion") return row.avg_iub_congestion;
  if (focusKey === "avg_call_drop_dch") return row.avg_call_drop_dch;

  return row.avg_cssr_ps;
}

function buildDistribution(values: number[], focusKey: string): DistributionBucket[] {
  if (focusKey === "avg_cssr_ps" || focusKey === "avg_ps_rab_sr") {
    return buildPercentHighIsGoodDistribution(values);
  }

  if (focusKey === "avg_throughput") {
    return buildThroughputDistribution(values);
  }

  if (focusKey === "avg_iub_congestion" || focusKey === "avg_call_drop_dch") {
    return buildReverseDistribution(values, focusKey);
  }

  return buildPercentHighIsGoodDistribution(values);
}

function buildPercentHighIsGoodDistribution(values: number[]): DistributionBucket[] {
  const buckets: DistributionBucket[] = [
    { label: "Critical", count: 0, tone: "#ef4444" },
    { label: "Watch", count: 0, tone: "#f59e0b" },
    { label: "Stable", count: 0, tone: "#10b981" },
  ];

  values.forEach((value) => {
    if (value < 92) buckets[0].count += 1;
    else if (value < 95) buckets[1].count += 1;
    else buckets[2].count += 1;
  });

  return buckets;
}

function buildThroughputDistribution(values: number[]): DistributionBucket[] {
  const buckets: DistributionBucket[] = [
    { label: "Low", count: 0, tone: "#ef4444" },
    { label: "Medium", count: 0, tone: "#f59e0b" },
    { label: "Good", count: 0, tone: "#10b981" },
  ];

  values.forEach((value) => {
    if (value < 650) buckets[0].count += 1;
    else if (value < 900) buckets[1].count += 1;
    else buckets[2].count += 1;
  });

  return buckets;
}

function buildReverseDistribution(
  values: number[],
  focusKey: string
): DistributionBucket[] {
  const alert = focusKey === "avg_call_drop_dch" ? 2.5 : 7;
  const watch = focusKey === "avg_call_drop_dch" ? 1.5 : 4;

  const buckets: DistributionBucket[] = [
    { label: "Stable", count: 0, tone: "#10b981" },
    { label: "Watch", count: 0, tone: "#f59e0b" },
    { label: "Alert", count: 0, tone: "#ef4444" },
  ];

  values.forEach((value) => {
    if (value >= alert) buckets[2].count += 1;
    else if (value >= watch) buckets[1].count += 1;
    else buckets[0].count += 1;
  });

  return buckets;
}

function formatFocusLabel(value: string) {
  if (value === "avg_cssr_ps") return "CSSR-PS";
  if (value === "avg_ps_rab_sr") return "PS RAB SR";
  if (value === "avg_throughput") return "Throughput";
  if (value === "avg_iub_congestion") return "IUB Congestion";
  if (value === "avg_call_drop_dch") return "Drop Rate";
  return value;
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
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  accent: string;
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

function BucketTile({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <div
        className="mb-2 h-1 w-8 rounded-full"
        style={{ background: tone }}
      />
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white/82">{count}</p>
    </div>
  );
}

function DistributionTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as DistributionBucket | undefined;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1722]/96 px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/38">
        {point.label}
      </p>
      <p className="mt-2 text-sm font-medium text-white">
        {point.count} scopes
      </p>
    </div>
  );
}