import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Sparkles, TrendingUp } from "lucide-react";

type MainTrendWorkbenchWidgetProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    kpiFocus?: string;
  };
  selectedKpis: string[];
  trends: Record<string, unknown>;
  summary: unknown[];
  validSummary: unknown[];
};

type ChartPoint = {
  label: string;
  rawLabel: string;
  timestamp: number;
  [key: string]: string | number | null;
};

const KPI_META: Record<
  string,
  {
    label: string;
    tone: string;
    unit?: string;
    watch?: number;
    alert?: number;
    reverseBad?: boolean;
  }
> = {
  avg_cssr_ps: {
    label: "CSSR-PS",
    tone: "#FF7900",
    unit: "%",
    watch: 95,
    alert: 92,
  },
  avg_ps_rab_sr: {
    label: "PS RAB SR",
    tone: "#4BB4E6",
    unit: "%",
    watch: 95,
    alert: 92,
  },
  avg_throughput: {
    label: "Throughput",
    tone: "#A885D8",
    unit: "kbps",
    watch: 900,
    alert: 650,
  },
  avg_iub_congestion: {
    label: "IUB Congestion",
    tone: "#FFB612",
    unit: "%",
    watch: 4,
    alert: 7,
    reverseBad: true,
  },
  avg_call_drop_dch: {
    label: "Drop Rate",
    tone: "#FF5A5F",
    unit: "%",
    watch: 1.5,
    alert: 2.5,
    reverseBad: true,
  },
  radio_congestion: {
    label: "Radio Congestion",
    tone: "#FF8A3D",
    unit: "%",
    watch: 4,
    alert: 7,
    reverseBad: true,
  },
};

export default function MainTrendWorkbenchWidget({
  filters,
  selectedKpis,
  trends,
  summary,
  validSummary,
}: MainTrendWorkbenchWidgetProps) {
  const activeKeys = useMemo(() => {
    const base = selectedKpis?.length
      ? selectedKpis
      : filters.kpiFocus
      ? [filters.kpiFocus]
      : ["avg_cssr_ps"];

    return Array.from(new Set(base)).slice(0, 4);
  }, [filters.kpiFocus, selectedKpis]);

  const chartData = useMemo(() => {
    return normalizeTrendSeries(trends, activeKeys);
  }, [trends, activeKeys]);

  const primaryKpi = activeKeys[0];
  const primaryMeta = KPI_META[primaryKpi] || {
    label: primaryKpi,
    tone: "#FF7900",
  };

  const latestValue = useMemo(() => {
    if (!chartData.length) return null;
    const last = chartData[chartData.length - 1]?.[primaryKpi];
    return typeof last === "number" ? last : null;
  }, [chartData, primaryKpi]);

  const previousValue = useMemo(() => {
    if (chartData.length < 2) return null;
    const prev = chartData[chartData.length - 2]?.[primaryKpi];
    return typeof prev === "number" ? prev : null;
  }, [chartData, primaryKpi]);

  const delta = useMemo(() => {
    if (latestValue === null || previousValue === null) return null;
    return latestValue - previousValue;
  }, [latestValue, previousValue]);

  const posture = getKpiTone(primaryKpi, latestValue);

  return (
    <section className="overflow-hidden rounded-[1.22rem] border border-white/[0.06] bg-[linear-gradient(180deg,#0d141c_0%,#0b1219_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_36px_rgba(0,0,0,0.24)]">
      <header className="border-b border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-4 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
              <Activity className="h-3.5 w-3.5 text-[#ff7900]" />
              Primary analysis surface
            </div>
            <h3 className="mt-1.5 text-[1rem] font-semibold tracking-[-0.03em] text-white">
              Main KPI Trend Workbench
            </h3>
            <p className="mt-1 text-sm text-white/46">
              Dominant analysis surface for KPI trend monitoring, threshold watch,
              and scope degradation review.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta label="Range" value={formatRange(filters.dateRange)} />
            <TopMeta
              label="Scope"
              value={filters.rnc || filters.region_code || "National"}
            />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Primary KPI"
            value={primaryMeta.label}
            helper={primaryMeta.unit || "value"}
            accent={primaryMeta.tone}
            featured
          />
          <StatTile
            label="Latest Value"
            value={formatMetric(latestValue, primaryMeta.unit)}
            helper={buildDeltaLabel(delta, primaryMeta.unit)}
            accent={primaryMeta.tone}
          />
          <StatTile
            label="Valid Scope Rows"
            value={String(validSummary.length)}
            helper="healthy coverage"
            accent="#4BB4E6"
          />
          <StatTile
            label="Current Posture"
            value={posture.label}
            helper={formatThresholdHelper(primaryMeta.watch, primaryMeta.alert, primaryMeta.unit)}
            accent={posture.color}
          />
        </div>

        <div className="rounded-[1.08rem] border border-white/[0.06] bg-[#09111a] p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {activeKeys.map((key, index) => {
              const meta = KPI_META[key] || {
                label: key,
                tone: index === 0 ? "#FF7900" : "#D5DDE8",
              };

              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/78"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: meta.tone }}
                  />
                  {meta.label}
                </div>
              );
            })}

            <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-orange-500/16 bg-orange-500/10 px-3 py-1.5 text-[11px] text-orange-200">
              <Sparkles className="h-3.5 w-3.5" />
              Trend intelligence
            </span>
          </div>

          <div className="h-[340px] w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-[0.95rem] border border-dashed border-white/10 bg-white/[0.02] text-center">
                <div>
                  <p className="text-sm font-medium text-white/86">
                    No trend data available
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    This widget will render once trend series are available from
                    the monitoring data hook.
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.055)"
                    vertical={false}
                    strokeDasharray="4 4"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip content={<TrendTooltip unit={primaryMeta.unit} />} />

                  {primaryMeta.watch !== undefined ? (
                    <ReferenceLine
                      y={primaryMeta.watch}
                      stroke="rgba(255,182,18,0.72)"
                      strokeDasharray="4 4"
                    />
                  ) : null}

                  {primaryMeta.alert !== undefined ? (
                    <ReferenceLine
                      y={primaryMeta.alert}
                      stroke="rgba(255,90,95,0.82)"
                      strokeDasharray="4 4"
                    />
                  ) : null}

                  {activeKeys.map((key, index) => {
                    const meta = KPI_META[key] || {
                      label: key,
                      tone: index === 0 ? "#FF7900" : "#D5DDE8",
                    };

                    return (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={meta.label}
                        stroke={meta.tone}
                        strokeWidth={index === 0 ? 2.7 : 2.1}
                        strokeOpacity={index === 0 ? 1 : 0.82}
                        dot={false}
                        activeDot={{
                          r: index === 0 ? 4.5 : 4,
                          fill: meta.tone,
                          stroke: "#09111a",
                          strokeWidth: 2,
                        }}
                        connectNulls
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <InfoChip
            label="Threshold Watch"
            value={
              primaryMeta.watch !== undefined
                ? formatMetric(primaryMeta.watch, primaryMeta.unit)
                : "—"
            }
          />
          <InfoChip
            label="Threshold Alert"
            value={
              primaryMeta.alert !== undefined
                ? formatMetric(primaryMeta.alert, primaryMeta.unit)
                : "—"
            }
          />
          <InfoChip
            label="Selected KPI Count"
            value={String(activeKeys.length)}
          />
        </div>
      </div>
    </section>
  );
}

function normalizeTrendSeries(
  trends: Record<string, unknown>,
  selectedKeys: string[]
): ChartPoint[] {
  const bucket = new Map<string, ChartPoint>();

  selectedKeys.forEach((key) => {
    const rawSeries = trends?.[key];

    if (!Array.isArray(rawSeries)) return;

    rawSeries.forEach((point: any) => {
      const rawDate =
        point?.date || point?.timestamp || point?.time || point?.label;
      if (!rawDate) return;

      const parsed = new Date(String(rawDate));
      const timestamp = Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
      const label = formatTickLabel(String(rawDate));
      const value =
        typeof point?.value === "number" && Number.isFinite(point.value)
          ? point.value
          : null;

      if (!bucket.has(String(rawDate))) {
        bucket.set(String(rawDate), {
          label,
          rawLabel: String(rawDate),
          timestamp,
        });
      }

      bucket.get(String(rawDate))![key] = value;
    });
  });

  return Array.from(bucket.values()).sort((a, b) => a.timestamp - b.timestamp);
}

function formatTickLabel(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatMetric(value: number | null, unit?: string) {
  if (value === null || Number.isNaN(value)) return "—";

  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "kbps") return `${value.toFixed(0)} kbps`;

  return value.toFixed(1);
}

function buildDeltaLabel(delta: number | null, unit?: string) {
  if (delta === null || Number.isNaN(delta)) return "no delta";

  const sign = delta > 0 ? "+" : "";
  if (unit === "%") return `${sign}${delta.toFixed(1)}% vs prev`;
  if (unit === "kbps") return `${sign}${delta.toFixed(0)} kbps vs prev`;

  return `${sign}${delta.toFixed(1)} vs prev`;
}

function formatThresholdHelper(
  watch?: number,
  alert?: number,
  unit?: string
) {
  if (watch === undefined || alert === undefined) return "threshold not set";
  return `W ${formatMetric(watch, unit)} · A ${formatMetric(alert, unit)}`;
}

function getKpiTone(metricKey: string, value: number | null) {
  const meta = KPI_META[metricKey];

  if (!meta || value === null || Number.isNaN(value)) {
    return { label: "Unknown", color: "#94a3b8" };
  }

  if (!meta.reverseBad) {
    if (meta.alert !== undefined && value <= meta.alert) {
      return { label: "Alert", color: "#FF5A5F" };
    }
    if (meta.watch !== undefined && value <= meta.watch) {
      return { label: "Watch", color: "#FFB612" };
    }
    return { label: "Stable", color: "#50BE87" };
  }

  if (meta.alert !== undefined && value >= meta.alert) {
    return { label: "Alert", color: "#FF5A5F" };
  }
  if (meta.watch !== undefined && value >= meta.watch) {
    return { label: "Watch", color: "#FFB612" };
  }
  return { label: "Stable", color: "#50BE87" };
}

function formatRange(value?: string) {
  if (value === "24h") return "Last 24h";
  if (value === "7d") return "Last 7d";
  if (value === "30d") return "Last 30d";
  return value || "24h";
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

function InfoChip({
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

function TrendTooltip({
  active,
  payload,
  label,
}: any & { unit?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[1rem] border border-white/[0.08] bg-[#0f1722]/96 px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/38">
        {label}
      </p>

      <div className="mt-2 space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: entry.color }}
              />
              <span className="text-white/72">{entry.name}</span>
            </div>
            <span className="font-medium text-white">
              {typeof entry.value === "number" ? entry.value.toFixed(1) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}