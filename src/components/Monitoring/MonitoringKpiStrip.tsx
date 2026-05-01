import type { KpiSummaryRegion } from "@/services/dashboard";
import { Settings2, Sparkles } from "lucide-react";

type MonitoringKpiStripProps = {
  selectedKpis: string[];
  summary: KpiSummaryRegion[];
  isEditMode?: boolean;
  onConfigureKpi?: (metricKey: string) => void;
};

type MetricMeta = {
  label: string;
  unit?: string;
  reverseBad?: boolean;
  watch: number;
  alert: number;
  tone: string;
};

const METRIC_META: Record<string, MetricMeta> = {
  avg_cssr_ps: {
    label: "CSSR-PS",
    unit: "%",
    watch: 95,
    alert: 92,
    tone: "#FF7900",
  },
  avg_ps_rab_sr: {
    label: "PS RAB SR",
    unit: "%",
    watch: 95,
    alert: 92,
    tone: "#4BB4E6",
  },
  avg_iub_congestion: {
    label: "IUB Congestion",
    unit: "%",
    reverseBad: true,
    watch: 4,
    alert: 7,
    tone: "#FFB612",
  },
  radio_congestion: {
    label: "Radio Congestion",
    unit: "%",
    reverseBad: true,
    watch: 4,
    alert: 7,
    tone: "#FF8A3D",
  },
  avg_call_drop_dch: {
    label: "Drop Rate",
    unit: "%",
    reverseBad: true,
    watch: 1.5,
    alert: 2.5,
    tone: "#FF5A5F",
  },
  avg_throughput: {
    label: "Throughput",
    unit: "kbps",
    watch: 900,
    alert: 650,
    tone: "#A885D8",
  },
};

function getSummaryMetricValue(
  item: KpiSummaryRegion,
  metricKey: string
): number | null {
  switch (metricKey) {
    case "avg_cssr_ps":
      return item.avg_cssr_ps ?? null;
    case "avg_ps_rab_sr":
      return item.avg_ps_rab_sr ?? null;
    case "avg_iub_congestion":
    case "radio_congestion":
      return item.avg_iub_congestion ?? null;
    case "avg_call_drop_dch":
      return item.avg_call_drop_dch ?? null;
    case "avg_throughput":
      return item.avg_throughput ?? null;
    default:
      return null;
  }
}

function getMetricAverage(
  summary: KpiSummaryRegion[],
  metricKey: string
): number | null {
  if (!summary.length) return null;

  const values = summary
    .map((item) => getSummaryMetricValue(item, metricKey))
    .filter((value): value is number => value !== null && !Number.isNaN(value));

  if (!values.length) return null;

  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function formatMetricValue(metricKey: string, value: number | null) {
  const meta = METRIC_META[metricKey];

  if (value === null || Number.isNaN(value)) return "—";
  if (!meta) return value.toFixed(1);

  if (meta.unit === "%") {
    const digits = metricKey === "avg_call_drop_dch" ? 2 : 1;
    return `${value.toFixed(digits)}%`;
  }

  if (meta.unit === "kbps") {
    return `${value.toFixed(0)} kbps`;
  }

  return value.toFixed(1);
}

function getMetricTone(metricKey: string, value: number | null) {
  const meta = METRIC_META[metricKey];

  if (!meta || value === null || Number.isNaN(value)) {
    return {
      badge: "border-slate-500/20 bg-slate-500/10 text-slate-300",
      value: "text-white/82",
      card: "border-white/[0.06] bg-[#101925]",
      state: "Unknown",
      glow: "rgba(148,163,184,0.20)",
    };
  }

  let state: "Stable" | "Watch" | "Alert";

  if (!meta.reverseBad) {
    if (value <= meta.alert) state = "Alert";
    else if (value <= meta.watch) state = "Watch";
    else state = "Stable";
  } else {
    if (value >= meta.alert) state = "Alert";
    else if (value >= meta.watch) state = "Watch";
    else state = "Stable";
  }

  if (state === "Stable") {
    return {
      badge: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      value: "text-emerald-300",
      card: "border-emerald-500/12 bg-[linear-gradient(180deg,rgba(80,190,135,0.07),rgba(16,24,33,0.98))]",
      state,
      glow: "rgba(80,190,135,0.22)",
    };
  }

  if (state === "Watch") {
    return {
      badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
      value: "text-amber-300",
      card: "border-amber-500/12 bg-[linear-gradient(180deg,rgba(255,182,18,0.07),rgba(16,24,33,0.98))]",
      state,
      glow: "rgba(255,182,18,0.22)",
    };
  }

  return {
    badge: "border-red-500/20 bg-red-500/10 text-red-300",
    value: "text-red-300",
    card: "border-red-500/12 bg-[linear-gradient(180deg,rgba(255,90,95,0.07),rgba(16,24,33,0.98))]",
    state,
    glow: "rgba(255,90,95,0.22)",
  };
}

function buildHelper(metricKey: string) {
  switch (metricKey) {
    case "avg_cssr_ps":
      return "Call setup success";
    case "avg_ps_rab_sr":
      return "Packet session setup";
    case "avg_iub_congestion":
    case "radio_congestion":
      return "Transport pressure";
    case "avg_call_drop_dch":
      return "Drop behavior";
    case "avg_throughput":
      return "User throughput";
    default:
      return "Monitoring KPI";
  }
}

function getMetricProgress(metricKey: string, value: number | null) {
  const meta = METRIC_META[metricKey];
  if (!meta || value === null || Number.isNaN(value)) return 0;

  if (meta.unit === "kbps") {
    return Math.max(0, Math.min((value / 1500) * 100, 100));
  }

  if (!meta.reverseBad) {
    return Math.max(0, Math.min(value, 100));
  }

  const worst = metricKey === "avg_call_drop_dch" ? 5 : 10;
  return Math.max(0, Math.min(100 - (value / worst) * 100, 100));
}

function formatThreshold(value: number, unit?: string) {
  if (unit === "%") return `${value}%`;
  if (unit === "kbps") return `${value} kbps`;
  return String(value);
}

function KpiStripCard({
  metricKey,
  value,
  isEditMode,
  onConfigure,
}: {
  metricKey: string;
  value: number | null;
  isEditMode?: boolean;
  onConfigure?: () => void;
}) {
  const meta = METRIC_META[metricKey] || {
    label: metricKey,
    watch: 0,
    alert: 0,
    tone: "#FF7900",
  };

  const tone = getMetricTone(metricKey, value);
  const progress = getMetricProgress(metricKey, value);

  const content = (
    <>
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${meta.tone}, transparent)`,
        }}
      />

      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
              {meta.label}
            </p>
            <p className="mt-1 text-xs text-white/45">
              {buildHelper(metricKey)}
            </p>
          </div>

          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone.badge}`}
          >
            {tone.state}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className={`text-[1.35rem] font-semibold tracking-[-0.04em] ${tone.value}`}>
            {formatMetricValue(metricKey, value)}
          </p>
          <span className="text-[11px] text-white/32">
            {meta.unit || "metric"}
          </span>
        </div>

        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: meta.tone,
                boxShadow: `0 0 14px ${tone.glow}`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/42">
            <span>Watch {formatThreshold(meta.watch, meta.unit)}</span>
            <span>Alert {formatThreshold(meta.alert, meta.unit)}</span>
          </div>
        </div>

        {isEditMode && onConfigure ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-[0.85rem] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] text-white/60">
            <Settings2 className="h-3.5 w-3.5" />
            Configure KPI
          </div>
        ) : null}
      </div>
    </>
  );

  const baseClass = [
    "relative w-full overflow-hidden rounded-[1.1rem] border text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)] transition",
    tone.card,
    onConfigure ? "cursor-pointer hover:-translate-y-[1px]" : "cursor-default",
  ].join(" ");

  if (onConfigure) {
    return (
      <button type="button" onClick={onConfigure} className={baseClass}>
        {content}
      </button>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

export default function MonitoringKpiStrip({
  selectedKpis,
  summary,
  isEditMode = false,
  onConfigureKpi,
}: MonitoringKpiStripProps) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
            KPI priority strip
          </p>
          <h2 className="mt-1 text-sm font-semibold text-white/90">
            Selected network health indicators
          </h2>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/16 bg-orange-500/10 px-3 py-1.5 text-[11px] text-orange-200">
          <Sparkles className="h-3.5 w-3.5" />
          Live KPI posture
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[1120px] grid-flow-col auto-cols-[220px] gap-3 xl:min-w-0 xl:grid-flow-row xl:grid-cols-5 xl:auto-cols-auto">
          {selectedKpis.map((metricKey) => (
            <KpiStripCard
              key={metricKey}
              metricKey={metricKey}
              value={getMetricAverage(summary, metricKey)}
              isEditMode={isEditMode}
              onConfigure={
                onConfigureKpi ? () => onConfigureKpi(metricKey) : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}