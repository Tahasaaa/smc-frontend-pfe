import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  LayoutTemplate,
  Plus,
  Radar,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";

import MonitoringGlobalControls from "@/components/Monitoring/MonitoringGlobalControls";
import MonitoringKpiStrip from "@/components/Monitoring/MonitoringKpiStrip";
import MonitoringCustomizeDrawer from "@/components/Monitoring/MonitoringCustomizeDrawer";
import MonitoringEmptyState from "@/components/Monitoring/MonitoringEmptyState";
import MonitoringWorkbenchLayout from "@/components/Monitoring/MonitoringWorkbenchLayout";

import { useMonitoringWorkspace } from "@/hooks/useMonitoringWorkspace";
import { useMonitoringData } from "@/hooks/useMonitoringData";

import type { MonitoringGlobalFilters } from "@/types/monitoring";
import {
  isLiveTechnologyScope,
  useTechnologyScope,
} from "@/stores/technologyScopeStore";

type StatusTone = "good" | "watch" | "alert";

const DEFAULT_GLOBAL_FILTERS: MonitoringGlobalFilters = {
  technology: "3G",
  region_code: "",
  rnc: "",
  dateRange: "24h",
  date_from: "",
  date_to: "",
  kpiFocus: "avg_cssr_ps",
};

const DEFAULT_TREND_KEYS = [
  "avg_cssr_ps",
  "avg_ps_rab_sr",
  "avg_throughput",
  "avg_iub_congestion",
  "avg_call_drop_dch",
];

export default function MonitoringWorkbenchPage() {
  const navigate = useNavigate();
  const technologyScope = useTechnologyScope();
  const scopeIsLive = isLiveTechnologyScope(technologyScope);

  const {
    workspace,
    isEditMode,
    selectedWidgetId,
    hasStoredWorkspace,
    openCustomize,
    closeCustomize,
    setSelectedWidgetId,
    saveWorkspace,
    resetWorkspace,
    loadPreset,
    initializeDefaultWorkspace,
    addWidget,
    removeWidget,
    moveWidgetUpById,
    moveWidgetDownById,
    toggleWidgetById,
    resizeWidgetById,
    updateWidgetById,
    renameProfile,
  } = useMonitoringWorkspace();

  const [filters, setFilters] =
    useState<MonitoringGlobalFilters>(DEFAULT_GLOBAL_FILTERS);

  useEffect(() => {
    if (!workspace) return;

    setFilters((prev) => ({
      ...prev,
      technology: "3G",
      dateRange: workspace.defaultDateRange || prev.dateRange,
      kpiFocus:
        prev.kpiFocus ||
        workspace.kpiStrip?.[0] ||
        DEFAULT_GLOBAL_FILTERS.kpiFocus,
    }));
  }, [workspace]);

  useEffect(() => {
    setFilters((prev) =>
      prev.technology === "3G" ? prev : { ...prev, technology: "3G" }
    );
  }, []);

  const effectiveFilters = useMemo<MonitoringGlobalFilters>(() => {
    return {
      ...filters,
      technology: "3G",
    };
  }, [filters]);

  const trendKeys = useMemo(() => {
    if (!workspace) return DEFAULT_TREND_KEYS;

    const fromWidgets = workspace.widgets
      .filter(
        (widget) =>
          widget.visible &&
          (widget.kind === "trend-line" || widget.kind === "trend-area")
      )
      .map((widget) => widget.metricKey)
      .filter(
        (metricKey): metricKey is string =>
          typeof metricKey === "string" && metricKey.trim().length > 0
      );

    const fromFocus =
      effectiveFilters.kpiFocus && effectiveFilters.kpiFocus.trim().length > 0
        ? [effectiveFilters.kpiFocus]
        : [];

    return Array.from(
      new Set([...fromWidgets, ...fromFocus, ...DEFAULT_TREND_KEYS])
    );
  }, [workspace, effectiveFilters.kpiFocus]);

  const activeTrendKeys = scopeIsLive ? trendKeys : [];

  const { sharedData, loading, loadingBoard, error } = useMonitoringData(
    effectiveFilters,
    activeTrendKeys
  );

  function handleFilterChange<K extends keyof MonitoringGlobalFilters>(
    key: K,
    value: MonitoringGlobalFilters[K]
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "technology" ? "3G" : value,
    }));
  }

  function handleAddWidget() {
    if (!workspace) {
      initializeDefaultWorkspace();
      openCustomize();
      return;
    }

    openCustomize();
  }

  function handleUseRecommendedLayout() {
    initializeDefaultWorkspace();
  }

  function handleCustomizeNow() {
    if (!workspace) {
      initializeDefaultWorkspace();
    }

    openCustomize();
  }

  function handleOpenMap() {
    navigate("/map");
  }

  function handleOpenIncidents() {
    navigate("/incidents");
  }

  const boardTone: StatusTone = !scopeIsLive
    ? "watch"
    : error
    ? "alert"
    : loadingBoard
    ? "watch"
    : "good";

  const boardLabel = !scopeIsLive
    ? "Coming soon"
    : error
    ? "Attention"
    : loadingBoard
    ? "Refreshing"
    : "Live";

  if (!workspace && !hasStoredWorkspace) {
    return (
      <AppShell>
        <div className="min-h-full space-y-3 overflow-x-hidden px-1 pb-3 pt-1 text-white">
          <MonitoringHero
            boardTone={boardTone}
            boardLabel={boardLabel}
            workspaceName="Not Configured"
            onCustomize={handleCustomizeNow}
            onAddWidget={handleAddWidget}
            onSaveLayout={saveWorkspace}
            onResetLayout={resetWorkspace}
            empty
          />

          <MonitoringEmptyState
            onUseRecommendedLayout={handleUseRecommendedLayout}
            onCustomizeNow={handleCustomizeNow}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-full space-y-3 overflow-x-hidden px-1 pb-3 pt-1 text-white">
        <MonitoringHero
          boardTone={boardTone}
          boardLabel={boardLabel}
          workspaceName={workspace?.profileName || "Default Profile"}
          onCustomize={openCustomize}
          onAddWidget={handleAddWidget}
          onSaveLayout={saveWorkspace}
          onResetLayout={resetWorkspace}
        />

        <PanelFrame
          title="Global Control Strip"
          subtitle="Monitoring-wide filters for the live 3G scope, territory, time window, and KPI focus"
          compact
          toolbar={
            <span className="premium-toolbar-pill">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#ff7900]" />
              3G controls
            </span>
          }
        >
          <MonitoringGlobalControls
            filters={effectiveFilters}
            filterOptions={sharedData.filterOptions}
            onChange={handleFilterChange}
          />
        </PanelFrame>

        {workspace ? (
          <PanelFrame
            title="KPI Command Band"
            subtitle="Primary KPI strip aligned with the active 3G monitoring profile"
            compact
            toolbar={
              <span className="premium-toolbar-pill">
                <Activity className="h-3.5 w-3.5 text-[#ff7900]" />
                Active strip
              </span>
            }
          >
            <MonitoringKpiStrip
              selectedKpis={workspace.kpiStrip}
              summary={sharedData.summary}
              isEditMode={isEditMode}
            />
          </PanelFrame>
        ) : null}

        {loading && !workspace ? (
          <section className="premium-panel rounded-[1.45rem]">
            <div className="premium-panel-body flex min-h-[340px] flex-col items-center justify-center gap-4 text-center">
              <div className="boot-logo-ring flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03]">
                <div className="h-3.5 w-3.5 rounded-sm bg-[#ff7900]" />
              </div>

              <div>
                <p className="text-base font-semibold tracking-[-0.03em] text-white">
                  Loading monitoring workspace
                </p>
                <p className="mt-1.5 text-sm text-white/46">
                  Initializing 3G monitoring modules, data surfaces, and profile
                  context.
                </p>
              </div>
            </div>
          </section>
        ) : workspace ? (
          <PanelFrame
            title="Signal Workbench"
            subtitle="Main operational surface for trend interpretation, grid composition, and KPI drill-down"
            toolbar={
              <div className="flex flex-wrap items-center gap-2">
                <span className="premium-toolbar-pill">
                  <Radar className="h-3.5 w-3.5 text-[#ff7900]" />
                  3G live scope
                </span>

                <button
                  onClick={handleOpenMap}
                  className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
                >
                  Map
                  <ArrowUpRight className="h-4 w-4" />
                </button>

                <button
                  onClick={handleOpenIncidents}
                  className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
                >
                  Incidents
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            }
          >
            <MonitoringWorkbenchLayout
              filters={effectiveFilters}
              selectedKpis={workspace.kpiStrip}
              summary={sharedData.summary}
              validSummary={sharedData.summary}
              worstCells={sharedData.worstCells}
              trends={sharedData.trends}
              filterOptions={sharedData.filterOptions}
              onOpenMap={handleOpenMap}
              onOpenIncidents={handleOpenIncidents}
              showTertiaryGrid
            />
          </PanelFrame>
        ) : null}

        {loadingBoard ? (
          <section className="premium-panel rounded-[1.18rem]">
            <div className="premium-panel-body flex items-center gap-3 px-4 py-3 text-sm text-white/62">
              <Sparkles className="h-4 w-4 text-[#ff7900]" />
              Refreshing 3G monitoring data...
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[1.2rem] border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            {error}
          </section>
        ) : null}

        <MonitoringCustomizeDrawer
          isOpen={isEditMode}
          workspace={workspace}
          selectedWidgetId={selectedWidgetId}
          onClose={closeCustomize}
          onSelectWidget={setSelectedWidgetId}
          onLoadPreset={loadPreset}
          onAddWidget={addWidget}
          onRemoveWidget={removeWidget}
          onMoveWidgetUp={moveWidgetUpById}
          onMoveWidgetDown={moveWidgetDownById}
          onToggleWidget={toggleWidgetById}
          onResizeWidget={resizeWidgetById}
          onUpdateWidget={updateWidgetById}
          onRenameProfile={renameProfile}
        />
      </div>
    </AppShell>
  );
}

function MonitoringHero({
  boardTone,
  boardLabel,
  workspaceName,
  onCustomize,
  onAddWidget,
  onSaveLayout,
  onResetLayout,
  empty = false,
}: {
  boardTone: StatusTone;
  boardLabel: string;
  workspaceName: string;
  onCustomize: () => void;
  onAddWidget: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  empty?: boolean;
}) {
  return (
    <section className="premium-panel rounded-[1.3rem]">
      <div className="premium-panel-body px-4 py-4 md:px-5 md:py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <p className="section-eyebrow">Monitoring Command</p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-[1.24rem] font-semibold tracking-[-0.05em] text-white md:text-[1.4rem]">
                Network Intelligence Surface
              </h1>
              <StatusPill tone={boardTone} label={boardLabel} />
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Premium monitoring workspace for KPI supervision, trend
              interpretation, and operational drill-down across the active 3G
              network scope.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[760px]">
            <div className="rounded-[1rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.015))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <span className="premium-toolbar-pill">
                    <LayoutTemplate className="h-3.5 w-3.5 text-[#ff7900]" />
                    {workspaceName}
                  </span>

                  <span className="text-xs font-medium text-white/38">
                    {empty ? "No saved workspace yet" : "Workspace controls"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <HeroActionButton compact onClick={onCustomize}>
                    <SlidersHorizontal className="h-4 w-4" />
                    Customize
                  </HeroActionButton>

                  <HeroActionButton compact onClick={onAddWidget}>
                    <Plus className="h-4 w-4" />
                    Add widget
                  </HeroActionButton>

                  <HeroActionButton compact primary onClick={onSaveLayout}>
                    <Save className="h-4 w-4" />
                    Save layout
                  </HeroActionButton>

                  <HeroActionButton compact onClick={onResetLayout}>
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </HeroActionButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroActionButton({
  children,
  onClick,
  primary = false,
  compact = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[0.9rem] px-3.5 text-sm font-medium transition",
        compact ? "min-h-[42px] py-2" : "min-h-[50px] py-2.5",
        primary
          ? "border border-[#ff7900]/25 bg-[linear-gradient(180deg,rgba(255,121,0,0.22),rgba(255,121,0,0.10))] text-white shadow-[0_10px_22px_rgba(255,121,0,0.14)]"
          : "border border-white/[0.08] bg-white/[0.04] text-white/78 hover:bg-white/[0.08] hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function PanelFrame({
  title,
  subtitle,
  toolbar,
  children,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="premium-panel rounded-[1.42rem]">
      <header
        className={
          compact ? "premium-panel-header px-4 py-3" : "premium-panel-header"
        }
      >
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
        {toolbar}
      </header>

      <div
        className={
          compact ? "premium-panel-body px-4 py-3" : "premium-panel-body"
        }
      >
        {children}
      </div>
    </section>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: StatusTone;
  label: string;
}) {
  const variant =
    tone === "good" ? "good" : tone === "watch" ? "watch" : "alert";

  return <span className={`status-pill ${variant}`}>{label}</span>;
}