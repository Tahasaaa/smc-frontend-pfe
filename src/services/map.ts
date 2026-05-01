export type RegionStatus = "good" | "warning" | "critical";

const REGION_THRESHOLDS = {
  good: 89.5,
  warning: 88.5,
} as const;

export function getRegionStatus(healthScore: number): RegionStatus {
  const score = normalizeScore(healthScore);

  if (score >= REGION_THRESHOLDS.good) return "good";
  if (score >= REGION_THRESHOLDS.warning) return "warning";
  return "critical";
}

export function getRegionStatusLabel(status: RegionStatus): string {
  switch (status) {
    case "good":
      return "Stable";
    case "warning":
      return "Watch";
    case "critical":
      return "Alert";
    default:
      return "Unknown";
  }
}

export function getRegionColor(status: RegionStatus): string {
  switch (status) {
    case "good":
      return "#179c52";
    case "warning":
      return "#d08a12";
    case "critical":
      return "#d64545";
    default:
      return "#475569";
  }
}

export function getRegionStrokeColor(status: RegionStatus): string {
  switch (status) {
    case "good":
      return "#244e3a";
    case "warning":
      return "#5b4520";
    case "critical":
      return "#5d2d33";
    default:
      return "#34475a";
  }
}

export function getRegionFillOpacity(status: RegionStatus): number {
  switch (status) {
    case "good":
      return 0.86;
    case "warning":
      return 0.9;
    case "critical":
      return 0.94;
    default:
      return 0.72;
  }
}

function normalizeScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}