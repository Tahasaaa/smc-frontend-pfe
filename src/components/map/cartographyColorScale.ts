import type {
  CartographyMetricMode,
  CartographySiteMarker,
  CartographyStatus,
} from "@/types/cartography";

export type LegendToneItem = {
  label: string;
  description: string;
  color: string;
};

export const CARTOGRAPHY_COLORS = {
  good: "#34d399",
  warning: "#f59e0b",
  critical: "#ef4444",
  unknown: "#94a3b8",
} as const;

export function getStatusColor(status: CartographyStatus) {
  if (status === "good") return CARTOGRAPHY_COLORS.good;
  if (status === "warning") return CARTOGRAPHY_COLORS.warning;
  if (status === "critical") return CARTOGRAPHY_COLORS.critical;
  return CARTOGRAPHY_COLORS.unknown;
}

export function buildMetricColor(
  site: CartographySiteMarker,
  metricMode: CartographyMetricMode
) {
  if (metricMode === "health") {
    return getStatusColor(site.status);
  }

  if (metricMode === "cssr") {
    const value = site.avg_cssr_ps;
    if (value === null || Number.isNaN(value)) return CARTOGRAPHY_COLORS.unknown;
    if (value >= 98) return CARTOGRAPHY_COLORS.good;
    if (value >= 95) return CARTOGRAPHY_COLORS.warning;
    return CARTOGRAPHY_COLORS.critical;
  }

  if (metricMode === "throughput") {
    const value = site.avg_throughput_3g;
    if (value === null || Number.isNaN(value)) return CARTOGRAPHY_COLORS.unknown;
    if (value >= 1200) return CARTOGRAPHY_COLORS.good;
    if (value >= 700) return CARTOGRAPHY_COLORS.warning;
    return CARTOGRAPHY_COLORS.critical;
  }

  if (metricMode === "iub") {
    const value = site.avg_iub_congestion;
    if (value === null || Number.isNaN(value)) return CARTOGRAPHY_COLORS.unknown;
    if (value <= 2) return CARTOGRAPHY_COLORS.good;
    if (value <= 6) return CARTOGRAPHY_COLORS.warning;
    return CARTOGRAPHY_COLORS.critical;
  }

  const value = site.avg_drop_rate;
  if (value === null || Number.isNaN(value)) return CARTOGRAPHY_COLORS.unknown;
  if (value <= 1) return CARTOGRAPHY_COLORS.good;
  if (value <= 2.5) return CARTOGRAPHY_COLORS.warning;
  return CARTOGRAPHY_COLORS.critical;
}

export function getMetricModeTitle(metricMode: CartographyMetricMode): string {
  if (metricMode === "health") return "Health status scale";
  if (metricMode === "cssr") return "CSSR threshold scale";
  if (metricMode === "throughput") return "Throughput threshold scale";
  if (metricMode === "iub") return "Iub congestion scale";
  return "Drop-rate threshold scale";
}

export function getLegendItems(
  metricMode: CartographyMetricMode
): LegendToneItem[] {
  if (metricMode === "health") {
    return [
      {
        label: "Stable",
        description: "Healthy / normal operational posture",
        color: CARTOGRAPHY_COLORS.good,
      },
      {
        label: "Watch",
        description: "Moderate degradation detected",
        color: CARTOGRAPHY_COLORS.warning,
      },
      {
        label: "Alert",
        description: "Critical site condition",
        color: CARTOGRAPHY_COLORS.critical,
      },
      {
        label: "Unknown",
        description: "No reliable health status available",
        color: CARTOGRAPHY_COLORS.unknown,
      },
    ];
  }

  if (metricMode === "cssr") {
    return [
      {
        label: "Excellent CSSR",
        description: ">= 98%",
        color: CARTOGRAPHY_COLORS.good,
      },
      {
        label: "Watch CSSR",
        description: "95% to 97.9%",
        color: CARTOGRAPHY_COLORS.warning,
      },
      {
        label: "Critical CSSR",
        description: "< 95%",
        color: CARTOGRAPHY_COLORS.critical,
      },
      {
        label: "Unknown CSSR",
        description: "Missing or invalid CSSR value",
        color: CARTOGRAPHY_COLORS.unknown,
      },
    ];
  }

  if (metricMode === "throughput") {
    return [
      {
        label: "High throughput",
        description: ">= 1200 kbps",
        color: CARTOGRAPHY_COLORS.good,
      },
      {
        label: "Watch throughput",
        description: "700 to 1199 kbps",
        color: CARTOGRAPHY_COLORS.warning,
      },
      {
        label: "Low throughput",
        description: "< 700 kbps",
        color: CARTOGRAPHY_COLORS.critical,
      },
      {
        label: "Unknown throughput",
        description: "Missing or invalid throughput value",
        color: CARTOGRAPHY_COLORS.unknown,
      },
    ];
  }

  if (metricMode === "iub") {
    return [
      {
        label: "Low congestion",
        description: "<= 2%",
        color: CARTOGRAPHY_COLORS.good,
      },
      {
        label: "Watch congestion",
        description: "2.1% to 6%",
        color: CARTOGRAPHY_COLORS.warning,
      },
      {
        label: "High congestion",
        description: "> 6%",
        color: CARTOGRAPHY_COLORS.critical,
      },
      {
        label: "Unknown congestion",
        description: "Missing or invalid Iub value",
        color: CARTOGRAPHY_COLORS.unknown,
      },
    ];
  }

  return [
    {
      label: "Low drop rate",
      description: "<= 1%",
      color: CARTOGRAPHY_COLORS.good,
    },
    {
      label: "Watch drop rate",
      description: "1.01% to 2.5%",
      color: CARTOGRAPHY_COLORS.warning,
    },
    {
      label: "High drop rate",
      description: "> 2.5%",
      color: CARTOGRAPHY_COLORS.critical,
    },
    {
      label: "Unknown drop rate",
      description: "Missing or invalid drop-rate value",
      color: CARTOGRAPHY_COLORS.unknown,
    },
  ];
}