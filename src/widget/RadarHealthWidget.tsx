import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type RadarHealthWidgetProps = {
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

type RadarDatum = {
  subject: string;
  value: number;
  fullMark: number;
  rawValue: number | null;
};

export default function RadarHealthWidget({
  filters,
  summary,
  validSummary,
}: RadarHealthWidgetProps) {
  const rows = useMemo(() => normalizeSummary(summary), [summary]);
  const validRows = useMemo(() => normalizeSummary(validSummary), [validSummary]);

  const averages = useMemo(() => {
    const source = validRows.length ? validRows : rows;

    return {
      cssr: average(source.map((row) => row.avg_cssr_ps)),
      psRab: average(source.map((row) => row.avg_ps_rab_sr)),
      throughput: average(
        source.map((row) =>
          typeof row.avg_throughput === "number"
            ? row.avg_throughput
            : row.avg_hsdpa_tput
        )
      ),
      iub: average(source.map((row) => row.avg_iub_congestion)),
      ce: average(source.map((row) => row.avg_ce_congestion)),
      drop: average(source.map((row) => row.avg_call_drop_dch)),
    };
  }, [rows, validRows]);

  const radarData = useMemo<RadarDatum[]>(() => {
    return [
      {
        subject: "CSSR",
        value: normalizeHigherIsBetter(averages.cssr, 100),
        fullMark: 100,
        rawValue: averages.cssr,
      },
      {
        subject: "PS RAB",
        value: normalizeHigherIsBetter(averages.psRab, 100),
        fullMark: 100,
        rawValue: averages.psRab,
      },
      {
        subject: "TPUT",
        value: normalizeHigherIsBetter(averages.throughput, 1500),
        fullMark: 100,
        rawValue: averages.throughput,
      },
      {
        subject: "IUB",
        value: normalizeLowerIsBetter(averages.iub, 10),
        fullMark: 100,
        rawValue: averages.iub,
      },
      {
        subject: "CE",
        value: normalizeLowerIsBetter(averages.ce, 10),
        fullMark: 100,
        rawValue: averages.ce,
      },
      {
        subject: "DROP",
        value: normalizeLowerIsBetter(averages.drop, 5),
        fullMark: 100,
        rawValue: averages.drop,
      },
    ];
  }, [averages]);

  const overallBalance = useMemo(() => {
    if (!radarData.length) return null;
    return average(radarData.map((item) => item.value));
  }, [radarData]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <header className="border-b border-white/[0.06] bg-[#0f1722]/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Radar Health</h3>
            <p className="mt-1 text-xs text-white/45">
              KPI balance across the active monitoring scope.
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
            label="Balance Score"
            value={overallBalance !== null ? `${overallBalance.toFixed(0)}%` : "—"}
            helper="normalized KPI posture"
          />
          <StatTile
            label="Summary Rows"
            value={String(rows.length)}
            helper="loaded rows"
          />
          <StatTile
            label="Valid Rows"
            value={String(validRows.length)}
            helper="non-null region rows"
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#09111a] p-3">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "rgba(255,255,255,0.60)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                />
                <Tooltip content={<RadarTooltip />} />
                <Radar
                  name="KPI Balance"
                  dataKey="value"
                  stroke="#ff7900"
                  fill="#ff7900"
                  fillOpacity={0.28}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <MiniMetric label="CSSR" value={formatPercent(averages.cssr, 1)} />
          <MiniMetric label="PS RAB" value={formatPercent(averages.psRab, 1)} />
          <MiniMetric
            label="Throughput"
            value={formatKbps(averages.throughput)}
          />
          <MiniMetric label="IUB" value={formatPercent(averages.iub, 1)} />
          <MiniMetric label="CE" value={formatPercent(averages.ce, 1)} />
          <MiniMetric label="Drop" value={formatPercent(averages.drop, 2)} />
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

function normalizeHigherIsBetter(value: number | null, max: number) {
  if (value === null || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min((value / max) * 100, 100));
}

function normalizeLowerIsBetter(value: number | null, worst: number) {
  if (value === null || Number.isNaN(value)) return 0;
  const normalized = 100 - (value / worst) * 100;
  return Math.max(0, Math.min(normalized, 100));
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
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white/82">{value}</p>
    </div>
  );
}

function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as RadarDatum | undefined;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0f1722]/96 px-3 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/38">
        {point.subject}
      </p>
      <p className="mt-2 text-sm font-medium text-white">
        Normalized: {point.value.toFixed(0)}%
      </p>
      <p className="mt-1 text-xs text-white/55">
        Raw: {point.rawValue === null ? "—" : point.rawValue.toFixed(1)}
      </p>
    </div>
  );
}