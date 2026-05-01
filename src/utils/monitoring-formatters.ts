import type { MonitoringHealthTone } from "@/types/monitoring";

export function formatKpiLabel(value: string) {
  switch (value) {
    case "radio_congestion":
      return "Radio Congestion";
    case "avg_cssr_ps":
      return "CSSR-PS";
    case "avg_ps_rab_sr":
      return "PS RAB SR";
    case "avg_iub_congestion":
      return "IUB Congestion";
    case "avg_call_drop_dch":
      return "Call Drop DCH";
    case "avg_throughput":
      return "Throughput";
    case "multi_kpi":
      return "Multi KPI";
    case "scope":
      return "Scope";
    default:
      return value.replace(/_/g, " ");
  }
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatDecimal(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function formatMetricValue(
  metricKey: string,
  value: number | null | undefined
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";

  if (
    metricKey.includes("cssr") ||
    metricKey.includes("rab") ||
    metricKey.includes("drop") ||
    metricKey.includes("congestion")
  ) {
    return formatPercent(value, metricKey.includes("drop") ? 2 : 1);
  }

  if (metricKey.includes("throughput")) {
    return `${value.toFixed(2)} Mbps`;
  }

  return value.toFixed(2);
}

export function buildThresholdLabel(metricKey: string) {
  switch (metricKey) {
    case "avg_cssr_ps":
      return "Thr: 95%";
    case "avg_ps_rab_sr":
      return "Thr: 95%";
    case "avg_iub_congestion":
    case "radio_congestion":
      return "Thr: < 5%";
    case "avg_call_drop_dch":
      return "Thr: < 2%";
    case "avg_throughput":
      return "Ref: baseline";
    default:
      return "Threshold";
  }
}

export function getHigherBetterTone(
  value: number | null | undefined,
  goodThreshold: number,
  warningThreshold: number
): MonitoringHealthTone {
  if (value === null || value === undefined || Number.isNaN(value)) return "neutral";
  if (value >= goodThreshold) return "good";
  if (value >= warningThreshold) return "warning";
  return "critical";
}

export function getLowerBetterTone(
  value: number | null | undefined,
  goodThreshold: number,
  warningThreshold: number
): MonitoringHealthTone {
  if (value === null || value === undefined || Number.isNaN(value)) return "neutral";
  if (value <= goodThreshold) return "good";
  if (value <= warningThreshold) return "warning";
  return "critical";
}

export function getMetricTone(
  metricKey: string,
  value: number | null | undefined
): MonitoringHealthTone {
  switch (metricKey) {
    case "avg_cssr_ps":
      return getHigherBetterTone(value, 95, 93);
    case "avg_ps_rab_sr":
      return getHigherBetterTone(value, 95, 93);
    case "avg_iub_congestion":
    case "radio_congestion":
      return getLowerBetterTone(value, 5, 8);
    case "avg_call_drop_dch":
      return getLowerBetterTone(value, 2, 3);
    case "avg_throughput":
      return getHigherBetterTone(value, 1, 0.5);
    default:
      return "neutral";
  }
}

export function getToneClasses(tone: MonitoringHealthTone) {
  switch (tone) {
    case "good":
      return {
        text: "text-emerald-300",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    case "warning":
      return {
        text: "text-amber-300",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    case "critical":
      return {
        text: "text-red-300",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
      };
    default:
      return {
        text: "text-white/75",
        bg: "bg-white/[0.04]",
        border: "border-white/[0.08]",
      };
  }
}