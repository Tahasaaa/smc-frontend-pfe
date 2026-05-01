import MainTrendWorkbenchWidget from "@/widget/MainTrendWorkbenchWidget";
import RadarHealthWidget from "@/widget/RadarHealthWidget";
import ScopeGaugeWidget from "@/widget/ScopeGaugeWidget";
import KpiDistributionWidget from "@/widget/KpiDistributionWidget";

type MonitoringPrimaryGridProps = {
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
};

export default function MonitoringPrimaryGrid({
  filters,
  selectedKpis,
  summary,
  validSummary,
  trends,
}: MonitoringPrimaryGridProps) {
  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
      <div className="xl:col-span-8">
        <MainTrendWorkbenchWidget
          filters={filters}
          selectedKpis={selectedKpis}
          trends={trends}
          summary={summary}
          validSummary={validSummary}
        />
      </div>

      <div className="space-y-3 xl:col-span-4">
        <RadarHealthWidget
          filters={filters}
          summary={summary}
          validSummary={validSummary}
        />

        <ScopeGaugeWidget
          filters={filters}
          summary={summary}
          validSummary={validSummary}
        />

        <KpiDistributionWidget
          filters={filters}
          summary={summary}
          validSummary={validSummary}
        />
      </div>
    </section>
  );
}