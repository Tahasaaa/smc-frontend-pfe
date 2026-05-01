import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  AreaChart,
  BarChart3,
  Compass,
  Radar,
} from "lucide-react";

import MainTrendWorkbenchWidget from "@/widget/MainTrendWorkbenchWidget";
import ScopeGaugeWidget from "@/widget/ScopeGaugeWidget";
import RadarHealthWidget from "@/widget/RadarHealthWidget";
import KpiDistributionWidget from "@/widget/KpiDistributionWidget";
import WorstSitesTableWidget from "@/widget/WorstSitesTableWidget";
import DegradationQueueWidget from "@/widget/DegradationQueueWidget";
import ScopeSummaryWidget from "@/widget/ScopeSummaryWidget";
import ThresholdBreachTimelineWidget from "@/widget/ThresholdBreachTimelineWidget";
import LinkedContextWidget from "@/widget/LinkedContextWidget";

type MonitoringWorkbenchLayoutProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    date_from?: string;
    date_to?: string;
    kpiFocus?: string;
  };
  selectedKpis: string[];
  summary: unknown[];
  validSummary: unknown[];
  worstCells: unknown[];
  trends: Record<string, unknown>;
  filterOptions?: unknown;
  onOpenMap?: (payload?: unknown) => void;
  onOpenIncidents?: (payload?: unknown) => void;
  showTertiaryGrid?: boolean;
};

export default function MonitoringWorkbenchLayout({
  filters,
  selectedKpis,
  summary,
  validSummary,
  worstCells,
  trends,
  onOpenMap,
  onOpenIncidents,
}: MonitoringWorkbenchLayoutProps) {
  return (
    <section className="space-y-5">
      <LayoutSection
        icon={<Activity className="h-4 w-4" />}
        title="Primary Analysis Surface"
        subtitle="Core trend interpretation and scope quality posture for the active monitoring context"
        rightLabel={`${filters.technology || "—"} · ${selectedKpis.length} KPI`}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_420px]">
          <div className="min-w-0">
            <MainTrendWorkbenchWidget
              filters={filters}
              selectedKpis={selectedKpis}
              trends={trends}
              summary={summary}
              validSummary={validSummary}
            />
          </div>

          <div className="min-w-0">
            <ScopeGaugeWidget
              filters={filters}
              summary={summary}
              validSummary={validSummary}
            />
          </div>
        </div>
      </LayoutSection>

      <LayoutSection
        icon={<Radar className="h-4 w-4" />}
        title="Weakest Scope & Health Radar"
        subtitle="Operational degradation concentration and spatial health interpretation"
        rightLabel="Regional pressure"
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_420px]">
          <div className="min-w-0">
            <WorstSitesTableWidget
              filters={filters}
              worstCells={worstCells}
              onOpenMap={onOpenMap}
              onOpenIncidents={onOpenIncidents}
            />
          </div>

          <div className="min-w-0">
            <RadarHealthWidget
              filters={filters}
              summary={summary}
              validSummary={validSummary}
            />
          </div>
        </div>
      </LayoutSection>

      <LayoutSection
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Degradation Queue"
        subtitle="Execution-facing queue of the weakest monitored entities"
        rightLabel="Operator action surface"
      >
        <div className="min-w-0">
          <DegradationQueueWidget
            filters={filters}
            worstCells={worstCells}
            onOpenMap={onOpenMap}
            onOpenIncidents={onOpenIncidents}
          />
        </div>
      </LayoutSection>

      <LayoutSection
        icon={<AreaChart className="h-4 w-4" />}
        title="Breach Timeline & Linked Context"
        subtitle="Temporal threshold pressure plus connected operational context"
        rightLabel="Trend diagnostics"
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_420px]">
          <div className="min-w-0">
            <ThresholdBreachTimelineWidget
              filters={filters}
              trends={trends}
            />
          </div>

          <div className="min-w-0">
            <LinkedContextWidget
              filters={filters}
              worstCells={worstCells}
              onOpenMap={onOpenMap}
              onOpenIncidents={onOpenIncidents}
            />
          </div>
        </div>
      </LayoutSection>

      <LayoutSection
        icon={<BarChart3 className="h-4 w-4" />}
        title="Distribution & Scope Summary"
        subtitle="Comparative KPI spread and scope recap for the current monitoring window"
        rightLabel="Board summary"
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="min-w-0">
            <KpiDistributionWidget
              filters={filters}
              summary={summary}
              validSummary={validSummary}
            />
          </div>

          <div className="min-w-0">
            <ScopeSummaryWidget
              filters={filters}
              summary={summary}
              validSummary={validSummary}
            />
          </div>
        </div>
      </LayoutSection>
    </section>
  );
}

function LayoutSection({
  icon,
  title,
  subtitle,
  rightLabel,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  rightLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
            <span className="text-[#ff7900]">{icon}</span>
            <span>Workbench section</span>
          </div>
          <h3 className="mt-1 text-[1rem] font-semibold tracking-[-0.03em] text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm text-white/46">{subtitle}</p>
        </div>

        {rightLabel ? (
          <span className="premium-toolbar-pill">
            <Compass className="h-3.5 w-3.5 text-[#ff7900]" />
            {rightLabel}
          </span>
        ) : null}
      </div>

      {children}
    </section>
  );
}