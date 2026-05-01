import { useMemo } from "react";
import type {
  DistributionBin,
  MonitoringGlobalFilters,
  MonitoringWidgetConfig,
  RadarMetricPoint,
  RankingRow,
  ScopeSummaryData,
} from "@/types/monitoring";
import type {
  MonitoringSharedData,
} from "@/hooks/useMonitoringData";
import type {
  KpiSummaryRegion,
  TrendPoint,
  WorstCell,
} from "@/services/dashboard";

export type WidgetResolvedFilters = {
  technology: string;
  region_code: string;
  rnc: string;
  dateRange: MonitoringGlobalFilters["dateRange"];
  date_from?: string;
  date_to?: string;
  kpiFocus?: string;
};

export type WidgetDataResult =
  | {
      kind: "kpi-summary";
      data: {
        value: number | null;
        metricKey: string;
      };
    }
  | {
      kind: "trend";
      data: TrendPoint[];
    }
  | {
      kind: "ranking-bar";
      data: RankingRow[];
    }
  | {
      kind: "worst-cells-table";
      data: WorstCell[];
    }
  | {
      kind: "distribution";
      data: DistributionBin[];
    }
  | {
      kind: "radar";
      data: RadarMetricPoint[];
    }
  | {
      kind: "gauge";
      data: {
        value: number | null;
        metricKey: string;
      };
    }
  | {
      kind: "tube";
      data: {
        value: number | null;
        metricKey: string;
      };
    }
  | {
      kind: "scope-summary";
      data: ScopeSummaryData;
    };

export type UseWidgetDataReturn = {
  widgetData: WidgetDataResult | null;
  resolvedFilters: WidgetResolvedFilters;
  loading: boolean;
  error: string;
};

function resolveWidgetFilters(
  widget: MonitoringWidgetConfig,
  globalFilters: MonitoringGlobalFilters
): WidgetResolvedFilters {
  return {
    technology:
      widget.scopeMode === "custom" && widget.technologyOverride
        ? widget.technologyOverride
        : globalFilters.technology,
    region_code:
      widget.scopeMode === "custom" && widget.regionOverride
        ? widget.regionOverride
        : globalFilters.region_code,
    rnc:
      widget.scopeMode === "custom" && widget.rncOverride
        ? widget.rncOverride
        : globalFilters.rnc,
    dateRange:
      widget.scopeMode === "custom" && widget.dateRangeOverride
        ? widget.dateRangeOverride
        : globalFilters.dateRange,
    date_from: globalFilters.date_from,
    date_to: globalFilters.date_to,
    kpiFocus: globalFilters.kpiFocus,
  };
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

  const total = values.reduce((acc, value) => acc + value, 0);
  return total / values.length;
}

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

function buildRankingRows(
  summary: KpiSummaryRegion[],
  metricKey: string,
  limit = 5
): RankingRow[] {
  return [...summary]
    .map((item) => ({
      label: item.region_code || "Unknown",
      value: getSummaryMetricValue(item, metricKey) ?? -Infinity,
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function buildDistributionBins(
  summary: KpiSummaryRegion[],
  metricKey: string
): DistributionBin[] {
  const values = summary
    .map((item) => getSummaryMetricValue(item, metricKey))
    .filter((value): value is number => value !== null && !Number.isNaN(value));

  if (!values.length) {
    return [
      { label: "0-20", count: 0 },
      { label: "20-40", count: 0 },
      { label: "40-60", count: 0 },
      { label: "60-80", count: 0 },
      { label: "80-100", count: 0 },
    ];
  }

  const isPercentLike =
    metricKey.includes("cssr") ||
    metricKey.includes("rab") ||
    metricKey.includes("drop") ||
    metricKey.includes("congestion");

  const bins = isPercentLike
    ? [
        { label: "0-20", count: 0 },
        { label: "20-40", count: 0 },
        { label: "40-60", count: 0 },
        { label: "60-80", count: 0 },
        { label: "80-100", count: 0 },
      ]
    : [
        { label: "0-1", count: 0 },
        { label: "1-2", count: 0 },
        { label: "2-3", count: 0 },
        { label: "3-5", count: 0 },
        { label: "5+", count: 0 },
      ];

  values.forEach((value) => {
    if (isPercentLike) {
      if (value < 20) bins[0].count += 1;
      else if (value < 40) bins[1].count += 1;
      else if (value < 60) bins[2].count += 1;
      else if (value < 80) bins[3].count += 1;
      else bins[4].count += 1;
    } else {
      if (value < 1) bins[0].count += 1;
      else if (value < 2) bins[1].count += 1;
      else if (value < 3) bins[2].count += 1;
      else if (value < 5) bins[3].count += 1;
      else bins[4].count += 1;
    }
  });

  return bins;
}

function buildRadarMetrics(summary: KpiSummaryRegion[]): RadarMetricPoint[] {
  return [
    {
      metric: "CSSR",
      value: getMetricAverage(summary, "avg_cssr_ps") ?? 0,
    },
    {
      metric: "RAB SR",
      value: getMetricAverage(summary, "avg_ps_rab_sr") ?? 0,
    },
    {
      metric: "IUB",
      value: getMetricAverage(summary, "avg_iub_congestion") ?? 0,
    },
    {
      metric: "Drop",
      value: getMetricAverage(summary, "avg_call_drop_dch") ?? 0,
    },
    {
      metric: "TPUT",
      value: getMetricAverage(summary, "avg_throughput") ?? 0,
    },
  ];
}

export function useWidgetData(
  widget: MonitoringWidgetConfig,
  globalFilters: MonitoringGlobalFilters,
  sharedData: MonitoringSharedData,
  loading = false,
  error = ""
): UseWidgetDataReturn {
  const resolvedFilters = useMemo(
    () => resolveWidgetFilters(widget, globalFilters),
    [widget, globalFilters]
  );

  const widgetData = useMemo<WidgetDataResult | null>(() => {
    const metricKey =
      widget.metricKey === "multi_kpi"
        ? globalFilters.kpiFocus || "avg_cssr_ps"
        : widget.metricKey;

    switch (widget.kind) {
      case "kpi-summary":
        return {
          kind: "kpi-summary",
          data: {
            value: getMetricAverage(sharedData.validSummary, metricKey),
            metricKey,
          },
        };

      case "trend-line":
      case "trend-area":
        return {
          kind: "trend",
          data: sharedData.trends[metricKey] ?? [],
        };

      case "ranking-bar":
        return {
          kind: "ranking-bar",
          data: buildRankingRows(sharedData.validSummary, metricKey),
        };

      case "worst-cells-table":
        return {
          kind: "worst-cells-table",
          data: sharedData.worstCells,
        };

      case "distribution":
        return {
          kind: "distribution",
          data: buildDistributionBins(sharedData.validSummary, metricKey),
        };

      case "radar":
        return {
          kind: "radar",
          data: buildRadarMetrics(sharedData.validSummary),
        };

      case "gauge":
        return {
          kind: "gauge",
          data: {
            value: getMetricAverage(sharedData.validSummary, metricKey),
            metricKey,
          },
        };

      case "tube":
        return {
          kind: "tube",
          data: {
            value: getMetricAverage(sharedData.validSummary, metricKey),
            metricKey,
          },
        };

      case "scope-summary":
        return {
          kind: "scope-summary",
          data: {
            technology: resolvedFilters.technology,
            region_code: resolvedFilters.region_code,
            rnc: resolvedFilters.rnc,
            dateRange: resolvedFilters.dateRange,
            kpiFocus: resolvedFilters.kpiFocus,
          },
        };

      default:
        return null;
    }
  }, [
    widget.kind,
    widget.metricKey,
    globalFilters.kpiFocus,
    sharedData.validSummary,
    sharedData.trends,
    sharedData.worstCells,
    resolvedFilters,
  ]);

  return {
    widgetData,
    resolvedFilters,
    loading,
    error,
  };
}