import { useEffect, useMemo, useState } from "react";
import {
  getFilterOptions,
  getKpiSummary,
  getKpiTrend,
  getWorstCells,
  type DashboardFilters,
  type KpiSummaryRegion,
  type TrendPoint,
  type WorstCell,
} from "@/services/dashboard";
import type { MonitoringGlobalFilters } from "@/types/monitoring";

export type MonitoringFilterOptions = {
  region_codes?: string[];
  rncs?: string[];
  nodeb_names?: string[];
  technologies?: string[];
};

export type MonitoringTrendMap = Record<string, TrendPoint[]>;

export type MonitoringSharedData = {
  summary: KpiSummaryRegion[];
  validSummary: KpiSummaryRegion[];
  filterOptions: MonitoringFilterOptions | null;
  worstCells: WorstCell[];
  trends: MonitoringTrendMap;
};

export type UseMonitoringDataReturn = {
  sharedData: MonitoringSharedData;
  loading: boolean;
  loadingBoard: boolean;
  error: string;
  reload: () => Promise<void>;
};

const DEFAULT_SHARED_DATA: MonitoringSharedData = {
  summary: [],
  validSummary: [],
  filterOptions: null,
  worstCells: [],
  trends: {},
};

const DEFAULT_TREND_KEYS = [
  "avg_cssr_ps",
  "avg_ps_rab_sr",
  "avg_throughput",
  "avg_iub_congestion",
  "avg_call_drop_dch",
];

const TREND_KEY_CANDIDATES: Record<string, string[]> = {
  avg_cssr_ps: ["avg_cssr_ps", "cssr_ps"],
  avg_ps_rab_sr: ["avg_ps_rab_sr", "ps_rab_setup_sr"],
  avg_iub_congestion: ["avg_iub_congestion", "iub_congestion"],
  avg_call_drop_dch: ["avg_call_drop_dch", "call_drop_dch", "avg_drop"],
  avg_throughput: ["avg_throughput", "throughput_3g", "hsdpa_tput_per_user"],
};

const DEMO_DATASET_START = "2026-02-01";
const DEMO_DATASET_END = "2026-03-01";

function formatDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateRangeForPeriod(period: MonitoringGlobalFilters["dateRange"]) {
  const end = new Date(`${DEMO_DATASET_END}T00:00:00`);
  const start = new Date(end);

  if (period === "24h") {
    start.setDate(end.getDate() - 1);
  } else if (period === "7d") {
    start.setDate(end.getDate() - 7);
  } else if (period === "30d") {
    start.setDate(end.getDate() - 30);
  } else {
    return {
      date_from: undefined,
      date_to: undefined,
    };
  }

  const datasetStart = new Date(`${DEMO_DATASET_START}T00:00:00`);
  if (start < datasetStart) {
    start.setTime(datasetStart.getTime());
  }

  return {
    date_from: formatDateOnly(start),
    date_to: formatDateOnly(end),
  };
}

function buildTrendPayload(filters: MonitoringGlobalFilters): DashboardFilters {
  const derivedDateRange =
    filters.dateRange === "custom"
      ? {
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        }
      : getDateRangeForPeriod(filters.dateRange);

  return {
    technology: filters.technology || undefined,
    region_code: filters.region_code || undefined,
    rnc: filters.rnc || undefined,
    date_from: derivedDateRange.date_from,
    date_to: derivedDateRange.date_to,
  };
}

function buildAggregatePayload(filters: MonitoringGlobalFilters): DashboardFilters {
  return {
    technology: filters.technology || undefined,
    region_code: filters.region_code || undefined,
    rnc: filters.rnc || undefined,
  };
}

function dedupeAndSort(values?: string[]) {
  if (!values || !Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function getTrendCandidates(metricKey: string) {
  const candidates = TREND_KEY_CANDIDATES[metricKey] || [metricKey];
  return Array.from(new Set(candidates.filter(Boolean)));
}

async function fetchTrendWithFallback(
  metricKey: string,
  payload: DashboardFilters
): Promise<TrendPoint[]> {
  const candidates = getTrendCandidates(metricKey);

  for (const candidate of candidates) {
    try {
      const series = await getKpiTrend(candidate, payload);
      if (Array.isArray(series) && series.length > 0) {
        return series;
      }
    } catch {
      // try next candidate
    }
  }

  const noDatesPayload: DashboardFilters = {
    technology: payload.technology,
    region_code: payload.region_code,
    rnc: payload.rnc,
  };

  for (const candidate of candidates) {
    try {
      const series = await getKpiTrend(candidate, noDatesPayload);
      if (Array.isArray(series) && series.length > 0) {
        return series;
      }
    } catch {
      // try next candidate
    }
  }

  return [];
}

async function fetchFilterOptionsSafe(payload: DashboardFilters) {
  try {
    return await getFilterOptions(payload);
  } catch {
    try {
      return await getFilterOptions();
    } catch {
      return null;
    }
  }
}

async function fetchSummarySafe(payload: DashboardFilters) {
  try {
    return await getKpiSummary(payload);
  } catch {
    try {
      return await getKpiSummary();
    } catch {
      return [];
    }
  }
}

async function fetchWorstCellsSafe(payload: DashboardFilters) {
  try {
    return await getWorstCells(10, payload);
  } catch {
    try {
      return await getWorstCells(10);
    } catch {
      return [];
    }
  }
}

export function useMonitoringData(
  filters: MonitoringGlobalFilters,
  trendKeys: string[] = DEFAULT_TREND_KEYS
): UseMonitoringDataReturn {
  const [sharedData, setSharedData] =
    useState<MonitoringSharedData>(DEFAULT_SHARED_DATA);
  const [loading, setLoading] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState("");

  const normalizedTrendKeys = useMemo(
    () =>
      Array.from(
        new Set(
          trendKeys.filter(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0
          )
        )
      ),
    [trendKeys]
  );

  async function loadMonitoringData() {
    try {
      setLoadingBoard(true);
      setError("");

      const trendPayload = buildTrendPayload(filters);
      const aggregatePayload = buildAggregatePayload(filters);

      const [
        filterOptionsResult,
        summaryResult,
        worstCellsResult,
        ...trendResults
      ] = await Promise.allSettled([
        fetchFilterOptionsSafe(aggregatePayload),
        fetchSummarySafe(aggregatePayload),
        fetchWorstCellsSafe(aggregatePayload),
        ...normalizedTrendKeys.map((metricKey) =>
          fetchTrendWithFallback(metricKey, trendPayload)
        ),
      ]);

      const fulfilledFilterOptions: MonitoringFilterOptions | null =
        filterOptionsResult.status === "fulfilled"
          ? (filterOptionsResult.value as MonitoringFilterOptions | null)
          : null;

      const nextFilterOptions: MonitoringFilterOptions | null =
        fulfilledFilterOptions
          ? {
              region_codes: dedupeAndSort(fulfilledFilterOptions.region_codes),
              rncs: dedupeAndSort(fulfilledFilterOptions.rncs),
              nodeb_names: dedupeAndSort(fulfilledFilterOptions.nodeb_names),
              technologies: dedupeAndSort(fulfilledFilterOptions.technologies),
            }
          : sharedData.filterOptions;

      const nextSummary: KpiSummaryRegion[] =
        summaryResult.status === "fulfilled" ? summaryResult.value : [];

      const nextWorstCells: WorstCell[] =
        worstCellsResult.status === "fulfilled" ? worstCellsResult.value : [];

      const nextTrends: MonitoringTrendMap = {};
      const emptyTrendKeys: string[] = [];
      const failedTrendKeys: string[] = [];

      normalizedTrendKeys.forEach((metricKey, index) => {
        const result = trendResults[index];

        if (result?.status === "fulfilled") {
          nextTrends[metricKey] = Array.isArray(result.value)
            ? result.value
            : [];

          if (!nextTrends[metricKey].length) {
            emptyTrendKeys.push(metricKey);
          }
        } else {
          nextTrends[metricKey] = [];
          failedTrendKeys.push(metricKey);
        }
      });

      const validSummary = nextSummary.filter((item) => item.region_code !== null);

      const hasAnyTrend = Object.values(nextTrends).some(
        (series) => Array.isArray(series) && series.length > 0
      );

      if (!nextSummary.length && !hasAnyTrend && !nextWorstCells.length) {
        setError("Monitoring modules returned no usable data.");
      } else if (failedTrendKeys.length > 0) {
        setError(`Some trend requests failed: ${failedTrendKeys.join(", ")}`);
      } else {
        setError("");
      }

      setSharedData({
        summary: nextSummary,
        validSummary,
        filterOptions: nextFilterOptions,
        worstCells: nextWorstCells,
        trends: nextTrends,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load monitoring data.";

      setError(message);
      setSharedData((prev) => ({
        ...prev,
        summary: [],
        validSummary: [],
        worstCells: [],
        trends: {},
      }));
    } finally {
      setLoading(false);
      setLoadingBoard(false);
    }
  }

  useEffect(() => {
    void loadMonitoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.technology,
    filters.region_code,
    filters.rnc,
    filters.dateRange,
    filters.date_from,
    filters.date_to,
    normalizedTrendKeys.join("|"),
  ]);

  return {
    sharedData,
    loading,
    loadingBoard,
    error,
    reload: loadMonitoringData,
  };
}