import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageMotion from "@/components/motion/PageMotion";
import PanelReveal from "@/components/motion/PanelReveal";

import CartographyHeader from "@/components/map/CartographyHeader";
import CartographySummaryStrip from "@/components/map/CartographySummaryStrip";
import CartographyFilterBar from "@/components/map/CartographyFilterBar";
import MapLegend from "@/components/map/MapLegend";
import MapTooltip from "@/components/map/MapTooltip";
import SiteDetailPanel from "@/components/map/SiteDetailPanel";
import MapLoadingState from "@/components/map/MapLoadingState";
import MapEmptyState from "@/components/map/MapEmptyState";
import TunisiaSiteMap from "@/components/map/TunisiaSiteMap";

import { useCartographyPage } from "@/hooks/useCartographyPage";
import type { CartographyMetricMode } from "@/types/cartography";
import {
  Activity,
  ArrowUpRight,
  MapPinned,
  Radar,
  ScanSearch,
} from "lucide-react";

const METRIC_MODE_OPTIONS: Array<{
  value: CartographyMetricMode;
  label: string;
}> = [
  { value: "health", label: "Health" },
  { value: "cssr", label: "CSSR" },
  { value: "throughput", label: "Throughput" },
  { value: "iub", label: "IUB" },
  { value: "drop_rate", label: "Drop Rate" },
];

export default function MapPage() {
  const navigate = useNavigate();

  const {
    filters,
    metricMode,
    filterOptions,
    sites,
    summary,
    selectedSite,
    tooltip,
    loadingInitial,
    loadingMap,
    loadingSummary,
    error,
    updateFilter,
    resetFilters,
    setMetricMode,
    selectSite,
    clearSelectedSite,
    setHoveredTooltip,
    clearTooltip,
  } = useCartographyPage();

  function openMonitoring() {
    navigate("/monitoring");
  }

  function openIncidents() {
    navigate("/incidents");
  }

  function openDashboard() {
    navigate("/dashboard");
  }

  if (loadingInitial) {
    return (
      <AppShell>
        <PageMotion className="min-h-full px-3 pb-3 pt-1 text-white md:px-4 md:pb-4">
          <MapLoadingState />
        </PageMotion>
      </AppShell>
    );
  }

  if (error && !sites.length && !loadingMap) {
    return (
      <AppShell>
        <PageMotion className="min-h-full px-3 pb-3 pt-1 text-white md:px-4 md:pb-4">
          <section className="premium-panel rounded-[1.45rem]">
            <div className="premium-panel-body flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
              <div className="boot-logo-ring mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
                <div className="h-4 w-4 rounded-sm bg-red-400" />
              </div>

              <p className="text-base font-semibold text-white">
                Cartography page failed to load
              </p>
              <p className="mt-2 max-w-xl text-sm text-white/45">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="premium-button orange-ring-focus mt-5"
              >
                Reload page
              </button>
            </div>
          </section>
        </PageMotion>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageMotion className="min-h-full space-y-3 px-3 pb-3 pt-1 text-white md:px-4 md:pb-4">
        <PanelReveal delayMs={0}>
          <CartographyHeader
            loading={loadingMap || loadingSummary}
            onResetFilters={resetFilters}
          />
        </PanelReveal>

        <PanelReveal delayMs={45}>
          <CartographySummaryStrip
            summary={summary}
            loading={loadingSummary}
          />
        </PanelReveal>

        <PanelReveal delayMs={90}>
          <CartographyFilterBar
            filters={filters}
            filterOptions={filterOptions}
            onChange={updateFilter}
            onReset={resetFilters}
          />
        </PanelReveal>

        <PanelReveal delayMs={120}>
          <MetricModeBar value={metricMode} onChange={setMetricMode} />
        </PanelReveal>

        {error ? (
          <PanelReveal delayMs={135}>
            <section className="rounded-[1rem] border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-200">
              {error}
            </section>
          </PanelReveal>
        ) : null}

        <PanelReveal delayMs={170}>
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_390px]">
            <section className="premium-panel overflow-hidden rounded-[1.45rem]">
              <header className="premium-panel-header">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
                    <MapPinned className="h-3.5 w-3.5 text-[#ff7900]" />
                    Geo command surface
                  </div>
                  <h3 className="mt-1 text-[1rem] font-semibold tracking-[-0.03em] text-white">
                    Operational Site Map
                  </h3>
                  <p className="mt-1 text-sm text-white/46">
                    Real basemap with 3G site markers, metric coloring, and
                    click-to-inspect investigation workflow.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="premium-toolbar-pill">
                    <Activity className="h-3.5 w-3.5 text-[#ff7900]" />
                    {filters.date || "No date"}
                  </span>
                  <span className="premium-toolbar-pill">
                    <Radar className="h-3.5 w-3.5 text-[#ff7900]" />
                    {sites.length} visible 3G sites
                  </span>
                </div>
              </header>

              <div className="relative h-[760px] w-full overflow-hidden bg-[#08111a]">
                {sites.length === 0 && !loadingMap ? (
                  <MapEmptyState />
                ) : (
                  <>
                    <TunisiaSiteMap
                      sites={sites}
                      loading={loadingMap}
                      metricMode={metricMode}
                      selectedNodebName={selectedSite?.marker.nodeb_name ?? null}
                      onHoverSite={setHoveredTooltip}
                      onLeaveSite={clearTooltip}
                      onSelectSite={selectSite}
                    />

                    <div className="absolute right-3 top-3 z-[1000]">
                      <MapLegend metricMode={metricMode} />
                    </div>

                    <MapTooltip tooltip={tooltip} />
                  </>
                )}
              </div>
            </section>

            <div className="space-y-3 xl:sticky xl:top-4 xl:self-start">
              <ScopeSnapshotCard
                filters={filters}
                metricMode={metricMode}
                selectedNodebName={selectedSite?.marker.nodeb_name || null}
                technology="3G live scope"
              />

              <SiteDetailPanel
                selectedSite={selectedSite}
                onClose={clearSelectedSite}
              />

              <QuickActionsCard
                onOpenMonitoring={openMonitoring}
                onOpenIncidents={openIncidents}
                onOpenDashboard={openDashboard}
              />
            </div>
          </section>
        </PanelReveal>
      </PageMotion>
    </AppShell>
  );
}

function MetricModeBar({
  value,
  onChange,
}: {
  value: CartographyMetricMode;
  onChange: (value: CartographyMetricMode) => void;
}) {
  return (
    <section className="premium-panel rounded-[1.3rem]">
      <div className="premium-panel-body px-4 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-eyebrow">Metric coloring</p>
            <p className="mt-1 text-sm text-white/46">
              Switch the map overlay between site health and key operational KPI
              layers.
            </p>
          </div>

          <div className="premium-segmented flex-wrap">
            {METRIC_MODE_OPTIONS.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  className={[
                    "premium-segmented-item orange-ring-focus min-w-[108px]",
                    active ? "is-active" : "",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScopeSnapshotCard({
  filters,
  metricMode,
  selectedNodebName,
  technology,
}: {
  filters: {
    date?: string;
    rnc_name?: string;
    status?: string;
  };
  metricMode: CartographyMetricMode;
  selectedNodebName: string | null;
  technology: string;
}) {
  return (
    <section className="premium-panel overflow-hidden rounded-[1.35rem]">
      <header className="premium-panel-header">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
            <ScanSearch className="h-3.5 w-3.5 text-[#ff7900]" />
            Current scope
          </div>
          <h3 className="mt-1 text-[1rem] font-semibold tracking-[-0.03em] text-white">
            Geo Context
          </h3>
          <p className="mt-1 text-sm text-white/46">
            Active cartography query context and inspection mode.
          </p>
        </div>
      </header>

      <div className="premium-panel-body space-y-2">
        <ScopeRow label="Technology" value={technology} />
        <ScopeRow label="Date" value={filters.date || "—"} />
        <ScopeRow label="RNC" value={filters.rnc_name || "All"} />
        <ScopeRow
          label="Status"
          value={
            filters.status ? formatStatusLabel(filters.status) : "All statuses"
          }
        />
        <ScopeRow label="Metric mode" value={formatMetricMode(metricMode)} />
        <ScopeRow
          label="Selection"
          value={selectedNodebName || "No site selected"}
        />
      </div>
    </section>
  );
}

function QuickActionsCard({
  onOpenMonitoring,
  onOpenIncidents,
  onOpenDashboard,
}: {
  onOpenMonitoring: () => void;
  onOpenIncidents: () => void;
  onOpenDashboard: () => void;
}) {
  return (
    <section className="premium-panel overflow-hidden rounded-[1.35rem]">
      <header className="premium-panel-header">
        <div className="min-w-0">
          <h3 className="panel-title">Action Dock</h3>
          <p className="panel-subtitle">
            Navigate to related operational surfaces.
          </p>
        </div>
      </header>

      <div className="premium-panel-body">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <button
            onClick={onOpenMonitoring}
            className="premium-button-ghost orange-ring-focus justify-between text-white/78 hover:text-white"
          >
            Monitoring
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenIncidents}
            className="premium-button-ghost orange-ring-focus justify-between text-white/78 hover:text-white"
          >
            Incidents
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenDashboard}
            className="premium-button-ghost orange-ring-focus justify-between text-white/78 hover:text-white"
          >
            Dashboard
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ScopeRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-[0.9rem] border border-white/[0.05] bg-[#101925] px-3 py-2.5">
      <span className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </span>
      <span className="max-w-[62%] text-right text-sm font-medium text-white/84">
        {value}
      </span>
    </div>
  );
}

function formatStatusLabel(value: string) {
  if (value === "good") return "Stable";
  if (value === "warning") return "Watch";
  if (value === "critical") return "Alert";
  if (value === "unknown") return "Unknown";
  return value;
}

function formatMetricMode(value: CartographyMetricMode) {
  if (value === "health") return "Health";
  if (value === "cssr") return "CSSR";
  if (value === "throughput") return "Throughput";
  if (value === "iub") return "IUB";
  return "Drop Rate";
}