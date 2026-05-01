import ThresholdBreachTimelineWidget from "@/widget/ThresholdBreachTimelineWidget";
import LinkedContextWidget from "@/widget/LinkedContextWidget";

type MonitoringTertiaryGridProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    kpiFocus?: string;
  };
  selectedKpis: string[];
  summary: unknown[];
  validSummary: unknown[];
  trends: Record<string, unknown>;
  worstCells: unknown[];
  filterOptions: unknown;
  onOpenMap?: (payload?: unknown) => void;
  onOpenIncidents?: (payload?: unknown) => void;
};

export default function MonitoringTertiaryGrid({
  filters,
  trends,
  worstCells,
  onOpenMap,
  onOpenIncidents,
}: MonitoringTertiaryGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      <div className="xl:col-span-8">
        <ThresholdBreachTimelineWidget
          filters={filters}
          trends={trends}
        />
      </div>

      <div className="space-y-3 xl:col-span-4">
        <LinkedContextWidget
          filters={filters}
          worstCells={worstCells}
          onOpenMap={onOpenMap}
          onOpenIncidents={onOpenIncidents}
        />
      </div>
    </section>
  );
}