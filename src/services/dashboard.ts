// src/services/dashboard.ts
import { apiRequest, KPI_API_BASE_URL } from "./api";

export type DashboardFilters = {
  technology?: string;
  date_from?: string;
  date_to?: string;
  region_code?: string;
  rnc?: string;
  nodeb_name?: string;
};

export type TrendPoint = {
  date: string;
  value: number;
};

export type MapRegion = {
  region_code: string;
  name_fr: string;
  name_ar: string;
  latitude: number;
  longitude: number;
  avg_cssr_ps: number;
  avg_ps_rab_sr: number;
  avg_throughput: number;
  avg_iub_congestion: number;
  avg_call_drop: number;
  site_count: number;
  health_score: number;
};

export type KpiSummaryRegion = {
  region_code: string | null;
  avg_cssr_ps: number;
  avg_ps_rab_sr: number;
  avg_throughput: number;
  avg_hsdpa_tput: number;
  avg_iub_congestion: number;
  avg_ce_congestion: number;
  avg_call_drop_dch: number;
  avg_sho_ecno: number;
  avg_mean_rtwp: number;
  avg_ho_voice: number;
  record_count: number;
};

export type WorstCell = {
  nodeb_name: string;
  rnc: string;
  region_code: string;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_iub: number | null;
  avg_drop: number | null;
  health_score: number;
};

export function getKpiSummary(filters: DashboardFilters = {}) {
  return apiRequest<KpiSummaryRegion[]>("/kpi/region_summary/", {
    baseUrl: KPI_API_BASE_URL,
    query: filters,
  });
}

export function getKpiTrend(
  kpi: string,
  filters: DashboardFilters = {}
) {
  return apiRequest<TrendPoint[]>("/kpi/trend/", {
    baseUrl: KPI_API_BASE_URL,
    query: {
      kpi,
      ...filters,
    },
  });
}

export function getWorstCells(
  limit = 10,
  filters: DashboardFilters = {}
) {
  return apiRequest<WorstCell[]>("/kpi/worst-cells/", {
    baseUrl: KPI_API_BASE_URL,
    query: {
      limit,
      ...filters,
    },
  });
}

export function getMapData(filters: DashboardFilters = {}) {
  return apiRequest<MapRegion[]>("/map/", {
    baseUrl: KPI_API_BASE_URL,
    query: filters,
  });
}

export function getFilterOptions(filters: DashboardFilters = {}) {
  return apiRequest("/filters/options/", {
    baseUrl: KPI_API_BASE_URL,
    query: filters,
  });
}