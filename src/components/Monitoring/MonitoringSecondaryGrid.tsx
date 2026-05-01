import WorstSitesTableWidget from "@/widget/WorstSitesTableWidget";
import DegradationQueueWidget from "@/widget/DegradationQueueWidget";
import ScopeSummaryWidget from "@/widget/ScopeSummaryWidget";

type MonitoringSecondaryGridProps = {
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
  worstCells: unknown[];
  onOpenMap?: (payload?: unknown) => void;
  onOpenIncidents?: (payload?: unknown) => void;
};

export default function MonitoringSecondaryGrid({
  filters,
  worstCells,
  summary,
  validSummary,
  onOpenMap,
  onOpenIncidents,
}: MonitoringSecondaryGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <WorstSitesTableWidget
          filters={filters}
          worstCells={worstCells}
          onOpenMap={onOpenMap}
          onOpenIncidents={onOpenIncidents}
        />
      </div>

      <div className="space-y-3 xl:col-span-5">
        <DegradationQueueWidget
          filters={filters}
          worstCells={worstCells}
          onOpenMap={onOpenMap}
          onOpenIncidents={onOpenIncidents}
        />

        <ScopeSummaryWidget
          filters={filters}
          summary={summary}
          validSummary={validSummary}
        />
      </div>
    </section>
  );
}