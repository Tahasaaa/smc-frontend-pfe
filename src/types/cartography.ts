export type CartographyStatus = "good" | "warning" | "critical" | "unknown";

export type CartographyMetricMode =
  | "health"
  | "cssr"
  | "throughput"
  | "iub"
  | "drop_rate";

export type CartographyFilters = {
  date: string;
  rnc_name: string;
  status: string;
};

export type CartographyFilterOptions = {
  technology: string;
  dates: string[];
  rnc_names: string[];
  statuses: CartographyStatus[];
};

export type CartographySiteMarker = {
  date: string;
  nodeb_name: string;
  nodeb_name_norm: string;
  rnc_name: string;
  latitude: number;
  longitude: number;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput_3g: number | null;
  avg_iub_congestion: number | null;
  avg_drop_rate: number | null;
  avg_availability_3g: number | null;
  health_score: number | null;
  status: CartographyStatus;
  active_incident_count: number;
  critical_incident_count: number;
  last_incident_title: string | null;
  main_kpi_issue: string | null;
};

export type CartographySitesResponse = {
  technology: string;
  selected_date: string;
  count: number;
  results: CartographySiteMarker[];
};

export type CartographySummary = {
  technology: string;
  selected_date: string;
  total_sites: number;
  good_sites: number;
  warning_sites: number;
  critical_sites: number;
  unknown_sites: number;
};

export type CartographySiteDetail = CartographySiteMarker & {
  site_name?: string | null;
  region_code?: string | null;
  governorate?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type CartographyTooltipState = {
  x: number;
  y: number;
  site: CartographySiteMarker;
} | null;

export type CartographySelectedSiteState = {
  marker: CartographySiteMarker;
  detail: CartographySiteDetail | null;
  loading: boolean;
  error: string;
} | null;

