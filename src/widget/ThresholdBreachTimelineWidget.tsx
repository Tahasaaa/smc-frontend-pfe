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

type ThresholdBreachTimelineWidgetProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    kpiFocus?: string;
  };
  trends: Record<string, unknown>;
};

type ThresholdMeta = {
  label: string;
  watch: number;
  alert: number;
  reverseBad?: boolean;
  unit?: string;
  color: string;
};

type TrendPoint = {
  rawLabel: string;
  label: string;
  value: number | null;
  state: "stable" | "watch" | "alert" | "unknown";
};

const KPI_THRESHOLDS: Record<string, ThresholdMeta> = {
  avg_cssr_ps: {
    label: "CSSR-PS",
    watch: 95,
    alert: 92,
    unit: "%",
    color: "#10b981",
  },
  avg_ps_rab_sr: {
    label: "PS RAB SR",
    watch: 95,
    alert: 92,
    unit: "%",
    color: "#22c55e",
  },
  avg_throughput: {
    label: "Throughput",
    watch: 900,
    alert: 650,
    unit: "kbps",
    color: "#38bdf8",
  },
  avg_iub_congestion: {
    label: "IUB Congestion",
    watch: 4,
    alert: 7,
    reverseBad: true,
    unit: "%",
    color: "#f59e0b",
  },
  avg_call_drop_dch: {
    label: "Drop Rate",
    watch: 1.5,
    alert: 2.5,
    reverseBad: true,
    unit: "%",
    color: "#ef4444",
  },
  avg_ce_congestion: {
    label: "CE Congestion",
    watch: 4,
    alert: 7,
    reverseBad: true,
    unit: "%",
    color: "#fb923c",
  },
};

export default function ThresholdBreachTimelineWidget({
  filters,
  trends,
}: ThresholdBreachTimelineWidgetProps) {
  const focusKey = filters.kpiFocus || "avg_cssr_ps";
  const meta = KPI_THRESHOLDS[focusKey] || {
    label: focusKey,
    watch: 95,
    alert: 92,
    unit: "",
    color: "#ff7900",
  };

  const series = useMemo(() => {
    return normalizeTrendSeries(trends?.[focusKey], meta);
  }, [trends, focusKey, meta]);

  const breachStats = useMemo(() => {
    const stable = series.filter((point) => point.state === "stable").length;
    const watch = series.filter((point) => point.state === "watch").length;
    const alert = series.filter((point) => point.state === "alert").length;
    const unknown = series.filter((point) => point.state === "unknown").length;

    return {
      stable,
      watch,
      alert,
      unknown,
      total: series.length,
    };
  }, [series]);

  const breachWindows = useMemo(() => {
    return extractBreachWindows(series).slice(0, 5);
  }, [series]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <header className="border-b border-white/[0.06] bg-[#0f1722]/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Threshold Breach Timeline
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Timeline of watch and alert crossings for the active KPI focus.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta
              label="Scope"
              value={filters.rnc || filters.region_code || "National"}
            />
            <TopMeta label="Focused KPI" value={meta.label} />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-4">
          <StatTile
            label="Stable Points"
            value={String(breachStats.stable)}
            helper="within healthy band"
            accent="#10b981"
          />
          <StatTile
            label="Watch Points"
            value={String(breachStats.watch)}
            helper="threshold watch"
            accent="#f59e0b"
          />
          <StatTile
            label="Alert Points"
            value={String(breachStats.alert)}
            helper="critical breach"
            accent="#ef4444"
          />
          <StatTile
            label="Samples"
            value={String(breachStats.total)}
            helper="timeline points"
            accent="#38bdf8"
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#09111a] p-3">
          <div className="h-[280px] w-full">
            {series.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-center">
                <div>
                  <p className="text-sm font-medium text-white/86">
                    No threshold timeline available
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    Once the focused KPI has trend series data, watch and alert
                    crossings will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip content={<TimelineTooltip meta={meta} />} />

                  <ReferenceLine
                    y={meta.watch}
                    stroke="rgba(245,158,11,0.75)"
                    strokeDasharray="4 4"
                  />
                  <ReferenceLine
                    y={meta.alert}
                    stroke="rgba(239,68,68,0.85)"
                    strokeDasharray="4 4"
                  />

                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={meta.color}
                    strokeWidth={2.2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (payload?.value === null || cx == null || cy == null) {
                        return null;
                      }

                      const dotColor =
                        payload.state === "alert"
                          ? "#ef4444"
                          : payload.state === "watch"
                          ? "#f59e0b"
                          : "#10b981";

                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill={dotColor}
                          stroke="rgba(255,255,255,0.9)"
                          strokeWidth={1}
                        />
                      );
                    }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <InfoChip
            label="Watch Threshold"
            value={formatMetric(meta.watch, meta.unit)}
          />
          <InfoChip
            label="Alert Threshold"
            value={formatMetric(meta.alert, meta.unit)}
          />
          <InfoChip
            label="Unknown Points"
            value={String(breachStats.unknown)}
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#101925] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Recent breach windows
          </p>

          <div className="mt-3 space-y-2">
            {breachWindows.length === 0 ? (
              <p className="text-xs text-white/45">
                No active watch or alert windows detected in the current trend sample.
              </p>
            ) : (
              breachWindows.map((window) => (
                <div
                  key={`${window.start}-${window.end}-${window.state}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/82">
                      {window.state === "alert" ? "Alert window" : "Watch window"}
                    </p>
                    <p className="mt-1 text-[11px] text-white/45">
                      {window.start} → {window.end}
                    </p>
                  </div>

                  <span
                    className={`rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase ${
                      window.state === "alert"
                        ? "border-red-500/20 bg-red-500/10 text-red-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {window.points} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function normalizeTrendSeries(
  rawSeries: unknown,
  meta: ThresholdMeta
): TrendPoint[] {
  if (!Array.isArray(rawSeries)) return [];

  return rawSeries.map((point) => {
    const row = (point ?? {}) as Record<string, unknown>;
    const rawLabel =
      typeof row.date === "string"
        ? row.date
        : typeof row.timestamp === "string"
        ? row.timestamp
        : typeof row.time === "string"
        ? row.time
        : "";

    const value =
      typeof row.value === "number" && Number.isFinite(row.value)
        ? row.value
        : null;

    return {
      rawLabel,
      label: formatTickLabel(rawLabel),
      value,
      state: classifyPoint(value, meta),
    };
  });
}

function classifyPoint(
  value: number | null,
  meta: ThresholdMeta
): TrendPoint["state"] {
  if (value === null || Number.isNaN(value)) return "unknown";

  if (!meta.reverseBad) {
    if (value <= meta.alert) return "alert";
    if (value <= meta.watch) return "watch";
    return "stable";
  }

  if (value >= meta.alert) return "alert";
  if (value >= meta.watch) return "watch";
  return "stable";
}

function extractBreachWindows(series: TrendPoint[]) {
  const windows: Array<{
    state: "watch" | "alert";
    start: string;
    end: string;
    points: number;
  }> = [];

  let current:
    | {
        state: "watch" | "alert";
        start: string;
        end: string;
        points: number;
      }
    | null = null;

  for (const point of series) {
    if (point.state === "watch" || point.state === "alert") {
      if (!current || current.state !== point.state) {
        if (current) windows.unshift(current);

        current = {
          state: point.state,
          start: point.label,
          end: point.label,
          points: 1,
        };
      } else {
        current.end = point.label;
        current.points += 1;
      }
    } else if (current) {
      windows.unshift(current);
      current = null;
    }
  }

  if (current) {
    windows.unshift(current);
  }

  return windows;
}

function formatTickLabel(value: string) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatMetric(value: number, unit?: string) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "kbps") return `${value.toFixed(0)} kbps`;
  return value.toFixed(1);
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

function InfoChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white/82">{value}</p>
    </div>
  );
}

function TimelineTooltip({
  active,
  payload,
  label,
  meta,
}: any) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as TrendPoint | undefined;
  if (!point) return null;

  const stateTone =
    point.state === "alert"
      ? "text-red-300"
      : point.state === "watch"
      ? "text-amber-300"
      : point.state === "stable"
      ? "text-emerald-300"
      : "text-slate-300";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1722]/96 px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/38">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-white">
        {point.value === null ? "—" : formatMetric(point.value, meta.unit)}
      </p>

      <p className={`mt-1 text-xs font-medium ${stateTone}`}>
        {point.state}
      </p>
    </div>
  );
}