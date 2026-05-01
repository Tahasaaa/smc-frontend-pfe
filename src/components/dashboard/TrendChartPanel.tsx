import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  date: string;
  value: number;
};

type PeriodKey = "24h" | "7d" | "30d";

type TrendSeries = {
  key: string;
  label: string;
  unit: string;
  values: TrendPoint[];
};

type Props = {
  data: TrendSeries[];
  period?: PeriodKey;
  normalized?: boolean;
};

const SERIES_COLORS = [
  "#FF7900", // Orange brand accent
  "#4BB4E6", // Supporting blue
  "#A885D8", // Supporting purple
  "#D5DDE8", // Soft neutral silver
  "#FFB4E6", // Supporting pink
  "#50BE87", // Supporting green
];

export default function TrendChartPanel({
  data,
  period = "24h",
  normalized = false,
}: Props) {
  const activeSeries = useMemo(
    () => data.filter((series) => series.values.length > 0),
    [data]
  );

  const merged = useMemo(() => {
    const bucket = new Map<string, Record<string, number | string>>();

    activeSeries.forEach((series) => {
      const prepared = normalized
        ? normalizeSeries(series.values)
        : series.values.map((point) => ({
            date: point.date,
            value: point.value,
          }));

      prepared.forEach((point) => {
        if (!bucket.has(point.date)) {
          bucket.set(point.date, { date: point.date });
        }

        const row = bucket.get(point.date)!;
        row[series.key] = point.value;
      });
    });

    return Array.from(bucket.values()).sort((a, b) => {
      const left = new Date(String(a.date)).getTime();
      const right = new Date(String(b.date)).getTime();
      return left - right;
    });
  }, [activeSeries, normalized]);

  const statCards = useMemo(() => {
    return activeSeries.map((series) => {
      const values = normalized
        ? normalizeSeries(series.values).map((item) => item.value)
        : series.values.map((item) => item.value);

      const current = values.length ? values[values.length - 1] : 0;
      const previous = values.length > 1 ? values[values.length - 2] : current;
      const peak = values.length ? Math.max(...values) : 0;
      const delta = current - previous;

      return {
        key: series.key,
        label: series.label,
        current,
        peak,
        delta,
        unit: normalized ? "" : series.unit,
      };
    });
  }, [activeSeries, normalized]);

  if (!activeSeries.length || !merged.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-[1.1rem] border border-white/[0.06] bg-[#0a1016] text-sm text-white/42">
        No performance trend data available for the current selection.
      </div>
    );
  }

  const domain = normalized ? [0, 100] : ["auto", "auto"];

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item, index) => (
          <SeriesStatCard
            key={item.key}
            label={item.label}
            current={formatMetric(item.current, item.unit, normalized)}
            peak={formatMetric(item.peak, item.unit, normalized)}
            delta={formatSignedMetric(item.delta, item.unit, normalized)}
            color={SERIES_COLORS[index % SERIES_COLORS.length]}
            primary={index === 0}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-white/45">
        {activeSeries.map((series, index) => (
          <LegendItem
            key={series.key}
            color={SERIES_COLORS[index % SERIES_COLORS.length]}
            label={series.label}
            primary={index === 0}
          />
        ))}

        <span className="ml-auto inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/56">
          {normalized ? "Normalized relation mode" : "Raw value mode"}
        </span>
      </div>

      <div className="h-[328px] w-full overflow-hidden rounded-[1.15rem] border border-white/[0.05] bg-[linear-gradient(180deg,#0b1117_0%,#0a0f15_100%)] px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={merged}
            margin={{ top: 8, right: 10, left: -12, bottom: 2 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.055)"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              minTickGap={24}
              tickMargin={10}
              stroke="#8ea0b4"
              tick={{ fontSize: 11, fill: "#7f8fa3" }}
              tickFormatter={(value) => formatAxisLabel(String(value), period)}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={52}
              stroke="#8ea0b4"
              tick={{ fontSize: 11, fill: "#7f8fa3" }}
              domain={domain as any}
              tickFormatter={(value) =>
                normalized
                  ? `${Number(value).toFixed(0)}`
                  : formatYAxisValue(Number(value))
              }
            />

            <Tooltip
              cursor={{
                stroke: "rgba(255,121,0,0.22)",
                strokeWidth: 1,
              }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;

                return (
                  <div className="min-w-[230px] rounded-[1rem] border border-white/[0.08] bg-[rgba(12,17,24,0.96)] px-3.5 py-3 shadow-[0_18px_38px_rgba(0,0,0,0.42)] backdrop-blur-xl">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
                      {formatTooltipLabel(String(label))}
                    </p>

                    <div className="mt-2.5 space-y-2">
                      {payload.map((entry: any, index: number) => {
                        const series = activeSeries.find(
                          (item) => item.key === entry.dataKey
                        );
                        if (!series) return null;

                        const color =
                          SERIES_COLORS[index % SERIES_COLORS.length];

                        return (
                          <div
                            key={entry.dataKey}
                            className="flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-[11px] text-white/58">
                                {series.label}
                              </span>
                            </div>

                            <span className="text-sm font-semibold tracking-[-0.02em] text-white">
                              {formatMetric(
                                Number(entry.value ?? 0),
                                normalized ? "" : series.unit,
                                normalized
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />

            {activeSeries.map((series, index) => {
              const primary = index === 0;
              const color = SERIES_COLORS[index % SERIES_COLORS.length];

              return (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  stroke={color}
                  strokeWidth={primary ? 2.8 : 2.15}
                  strokeOpacity={primary ? 1 : 0.8}
                  dot={false}
                  activeDot={{
                    r: primary ? 4.5 : 4,
                    fill: color,
                    stroke: "#09121a",
                    strokeWidth: 2,
                  }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SeriesStatCard({
  label,
  current,
  peak,
  delta,
  color,
  primary,
}: {
  label: string;
  current: string;
  peak: string;
  delta: string;
  color: string;
  primary: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1rem] border px-3.5 py-3",
        primary
          ? "border-orange-400/14 bg-[linear-gradient(180deg,rgba(255,121,0,0.10),rgba(255,255,255,0.015))] shadow-[0_12px_26px_rgba(255,121,0,0.08)]"
          : "border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))]",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
          {label}
        </p>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      <div className="mt-2.5">
        <p className="text-[1.1rem] font-semibold tracking-[-0.04em] text-white">
          {current}
        </p>

        <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-white/42">
          <span>Peak {peak}</span>
          <span>{delta}</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  primary,
}: {
  color: string;
  label: string;
  primary: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5",
        primary
          ? "border-orange-400/14 bg-orange-500/10 text-white/82"
          : "border-white/[0.06] bg-white/[0.025] text-white/56",
      ].join(" ")}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function normalizeSeries(points: TrendPoint[]) {
  if (!points.length) return [];

  const values = points.map((item) => item.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return points.map((point) => ({
      date: point.date,
      value: 50,
    }));
  }

  return points.map((point) => ({
    date: point.date,
    value: ((point.value - min) / (max - min)) * 100,
  }));
}

function formatMetric(value: number, unit: string, normalized: boolean) {
  if (normalized) return value.toFixed(0);

  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)}${unit}`;
}

function formatSignedMetric(value: number, unit: string, normalized: boolean) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatMetric(value, unit, normalized)}`;
}

function formatYAxisValue(value: number) {
  const abs = Math.abs(value);
  if (abs >= 100) return `${value.toFixed(0)}`;
  if (abs >= 10) return `${value.toFixed(1)}`;
  return `${value.toFixed(0)}`;
}

function formatAxisLabel(input: string, period: PeriodKey) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  if (period === "24h") {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatTooltipLabel(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}