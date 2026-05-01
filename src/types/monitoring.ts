export type MonitoringDateRange = "24h" | "7d" | "30d" | "custom";

export type MonitoringWidgetSize = "sm" | "md" | "lg" | "xl";

export type MonitoringWidgetKind =
  | "kpi-summary"
  | "trend-line"
  | "trend-area"
  | "ranking-bar"
  | "worst-cells-table"
  | "distribution"
  | "radar"
  | "gauge"
  | "tube"
  | "scope-summary";

export type MonitoringGlobalFilters = {
  technology: string;
  region_code: string;
  rnc: string;
  dateRange: MonitoringDateRange;
  date_from?: string;
  date_to?: string;
  kpiFocus?: string;
};

export type MonitoringWidgetConfig = {
  id: string;
  kind: MonitoringWidgetKind;
  title: string;
  subtitle?: string;
  metricKey: string;
  size: MonitoringWidgetSize;
  visible: boolean;
  order: number;
  scopeMode?: "global" | "custom";
  technologyOverride?: string;
  regionOverride?: string;
  rncOverride?: string;
  dateRangeOverride?: MonitoringDateRange;
  options?: Record<string, unknown>;
};

export type MonitoringWorkspaceConfig = {
  profileName: string;
  defaultTechnology: string;
  defaultDateRange: MonitoringDateRange;
  kpiStrip: string[];
  widgets: MonitoringWidgetConfig[];
};

export type MonitoringWidgetLibraryItem = {
  kind: MonitoringWidgetKind;
  label: string;
  description: string;
  defaultTitle: string;
  defaultMetricKey: string;
  defaultSize: MonitoringWidgetSize;
  defaultSubtitle?: string;
};

export type MonitoringHealthTone = "good" | "warning" | "critical" | "neutral";

export type RankingRow = {
  label: string;
  value: number;
};

export type DistributionBin = {
  label: string;
  count: number;
};

export type RadarMetricPoint = {
  metric: string;
  value: number;
};

export type ScopeSummaryData = {
  technology: string;
  region_code: string;
  rnc: string;
  dateRange: MonitoringDateRange;
  kpiFocus?: string;
};