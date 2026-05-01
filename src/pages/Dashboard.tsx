import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import TrendChartPanel from "@/components/dashboard/TrendChartPanel";
import PageMotion from "@/components/motion/PageMotion";
import PanelReveal from "@/components/motion/PanelReveal";
import {
  getKpiSummary,
  getKpiTrend,
  type KpiSummaryRegion,
  type TrendPoint,
} from "@/services/dashboard";
import {
  getIncidentOverview,
  type Incident,
} from "@/services/incidents";
import {
  isLiveTechnologyScope,
  setTechnologyScope,
  useTechnologyScope,
  type TechnologyScope,
} from "@/stores/technologyScopeStore";

type TechnologyKey = TechnologyScope;
type PeriodKey = "24h" | "7d" | "30d";
type ToneKey = "good" | "warning" | "critical";

type KpiDefinition = {
  key: string;
  trendKey: string;
  label: string;
  shortLabel: string;
  unit: string;
  higherIsBetter: boolean;
  goodThreshold: number;
  warningThreshold: number;
  summarySelector?: (item: KpiSummaryRegion) => number | null | undefined;
};

type MultiTrendMap = Record<string, TrendPoint[]>;

type TrendSeries = {
  key: string;
  label: string;
  unit: string;
  values: TrendPoint[];
};

const technologyOptions: Array<{ value: TechnologyKey; label: string }> = [
  { value: "3G", label: "3G" },
  { value: "4G", label: "4G" },
  { value: "5G", label: "5G" },
];

const periodOptions: Array<{ value: PeriodKey; label: string }> = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];

const KPI_DEFS: KpiDefinition[] = [
  {
    key: "cssr_ps",
    trendKey: "cssr_ps",
    label: "CSSR-PS",
    shortLabel: "CSSR",
    unit: "%",
    higherIsBetter: true,
    goodThreshold: 95,
    warningThreshold: 93,
    summarySelector: (item) => item.avg_cssr_ps,
  },
  {
    key: "ps_rab_setup_sr",
    trendKey: "ps_rab_setup_sr",
    label: "PS RAB Setup SR",
    shortLabel: "RAB SR",
    unit: "%",
    higherIsBetter: true,
    goodThreshold: 95,
    warningThreshold: 93,
    summarySelector: (item) => item.avg_ps_rab_sr,
  },
  {
    key: "iub_congestion",
    trendKey: "iub_congestion",
    label: "IUB Congestion",
    shortLabel: "IUB",
    unit: "%",
    higherIsBetter: false,
    goodThreshold: 5,
    warningThreshold: 8,
    summarySelector: (item) => item.avg_iub_congestion,
  },
  {
    key: "radio_congestion",
    trendKey: "radio_congestion",
    label: "Radio Congestion",
    shortLabel: "Radio Cong.",
    unit: "%",
    higherIsBetter: false,
    goodThreshold: 5,
    warningThreshold: 8,
  },
  {
    key: "throughput_3g",
    trendKey: "throughput_3g",
    label: "Throughput 3G",
    shortLabel: "TPUT",
    unit: "",
    higherIsBetter: true,
    goodThreshold: 1,
    warningThreshold: 0.5,
    summarySelector: (item) => item.avg_throughput,
  },
  {
    key: "hsdpa_tput_per_user",
    trendKey: "hsdpa_tput_per_user",
    label: "HSDPA TPUT/User",
    shortLabel: "HSDPA",
    unit: "",
    higherIsBetter: true,
    goodThreshold: 1,
    warningThreshold: 0.5,
    summarySelector: (item) => item.avg_hsdpa_tput,
  },
];

const KPI_CARD_KEYS = [
  "cssr_ps",
  "ps_rab_setup_sr",
  "iub_congestion",
  "throughput_3g",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const technology = useTechnologyScope();

  const [summary, setSummary] = useState<KpiSummaryRegion[]>([]);
  const [trends, setTrends] = useState<MultiTrendMap>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [period, setPeriod] = useState<PeriodKey>("24h");
  const [selectedKpis, setSelectedKpis] = useState<string[]>([
    "cssr_ps",
    "ps_rab_setup_sr",
    "iub_congestion",
    "radio_congestion",
  ]);
  const [normalized, setNormalized] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [activeQuickAction, setActiveQuickAction] = useState<
    "monitoring" | "map" | "incidents" | null
  >(null);

  useEffect(() => {
    if (!isLiveTechnologyScope(technology)) {
      setLoading(false);
      setError("");
      setSummary([]);
      setTrends({});
      setIncidents([]);
      return;
    }

    async function fetchTrendWithFallback(
      trendKey: string,
      nextTechnology: TechnologyKey,
      nextPeriod: PeriodKey
    ): Promise<TrendPoint[]> {
      const dateRange = getDateRangeForPeriod(nextPeriod);

      try {
        const firstTry = await getKpiTrend(trendKey, {
          technology: nextTechnology,
          ...dateRange,
        });

        if (Array.isArray(firstTry) && firstTry.length > 0) {
          return firstTry;
        }
      } catch (err) {
        console.warn(`Trend request with dates failed for ${trendKey}`, err);
      }

      try {
        const fallback = await getKpiTrend(trendKey, {
          technology: nextTechnology,
        });

        if (Array.isArray(fallback)) return fallback;
      } catch (err) {
        console.warn(`Trend fallback without dates failed for ${trendKey}`, err);
      }

      return [];
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const summaryPromise = getKpiSummary({ technology });
        const incidentsPromise = getIncidentOverview();

        const trendPromises = KPI_DEFS.map((kpi) =>
          fetchTrendWithFallback(kpi.trendKey, technology, period)
        );

        const [summaryResult, incidentsResult, ...trendResults] =
          await Promise.allSettled([
            summaryPromise,
            incidentsPromise,
            ...trendPromises,
          ]);

        let nextSummary: KpiSummaryRegion[] = [];
        let nextIncidents: Incident[] = [];
        const nextTrends: MultiTrendMap = {};
        const emptyTrendKeys: string[] = [];
        const failedTrendKeys: string[] = [];

        if (summaryResult.status === "fulfilled") {
          nextSummary = summaryResult.value;
        } else {
          console.error("region_summary failed:", summaryResult.reason);
        }

        if (incidentsResult.status === "fulfilled") {
          nextIncidents = incidentsResult.value.slice(0, 8);
        } else {
          console.error("incident overview failed:", incidentsResult.reason);
        }

        KPI_DEFS.forEach((kpi, index) => {
          const result = trendResults[index];

          if (result?.status === "fulfilled") {
            nextTrends[kpi.key] = result.value ?? [];

            if (!result.value || result.value.length === 0) {
              emptyTrendKeys.push(kpi.shortLabel);
            }
          } else {
            nextTrends[kpi.key] = [];
            failedTrendKeys.push(kpi.shortLabel);
            console.error(`trend failed for ${kpi.trendKey}:`, result?.reason);
          }
        });

        setSummary(nextSummary);
        setIncidents(nextIncidents);
        setTrends(nextTrends);
        setLastUpdated(new Date());

        const hasAnyTrend = Object.values(nextTrends).some(
          (series) => Array.isArray(series) && series.length > 0
        );

        if (!nextSummary.length && !hasAnyTrend) {
          setError("Dashboard modules failed to load.");
        } else if (failedTrendKeys.length > 0) {
          setError(`Some KPI series failed: ${failedTrendKeys.join(", ")}`);
        } else if (!hasAnyTrend && selectedKpis.length > 0) {
          setError("Trend endpoints returned no data for the current selection.");
        } else if (emptyTrendKeys.length === KPI_DEFS.length) {
          setError("Trend endpoints returned empty data for all KPI series.");
        } else {
          setError("");
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [technology, period, selectedKpis.length]);

  const validSummary = useMemo(
    () => summary.filter((item) => item.region_code !== null),
    [summary]
  );

  const kpiCards = useMemo(() => {
    return KPI_CARD_KEYS.map((key) => {
      const def = KPI_DEFS.find((item) => item.key === key)!;
      const series = trends[key] ?? [];
      const stat = getSeriesStat(series);
      const summaryFallback = getSummaryAverage(validSummary, def.summarySelector);

      const currentValue =
        stat.current !== null && stat.current !== undefined
          ? stat.current
          : summaryFallback;

      const tone = def.higherIsBetter
        ? getHigherIsBetterTone(
            currentValue,
            def.goodThreshold,
            def.warningThreshold
          )
        : getLowerIsBetterTone(
            currentValue,
            def.goodThreshold,
            def.warningThreshold
          );

      return {
        key: def.key,
        title: def.label,
        shortLabel: def.shortLabel,
        value: `${formatKpiValue(currentValue, def.unit)}`,
        helper: buildTargetLabel(def),
        context:
          stat.delta !== null
            ? `Δ ${formatSignedValue(stat.delta, def.unit)} vs previous point`
            : "Using available latest value",
        tone,
      };
    });
  }, [trends, validSummary]);

  const selectedSeries = useMemo<TrendSeries[]>(() => {
    return selectedKpis
      .map((key) => {
        const def = KPI_DEFS.find((item) => item.key === key);
        if (!def) return null;

        return {
          key: def.key,
          label: def.shortLabel,
          unit: def.unit,
          values: trends[key] ?? [],
        };
      })
      .filter(Boolean) as TrendSeries[];
  }, [selectedKpis, trends]);

  const hasAnySelectedTrend = useMemo(
    () => selectedSeries.some((series) => series.values.length > 0),
    [selectedSeries]
  );

  const postureTone = useMemo<ToneKey>(() => {
    const tones = kpiCards.map((item) => item.tone);
    if (tones.includes("critical")) return "critical";
    if (tones.includes("warning")) return "warning";
    return "good";
  }, [kpiCards]);

  const incidentMetrics = useMemo(() => {
    const critical = incidents.filter(
      (incident) => incident.severity.toLowerCase() === "critical"
    ).length;

    const major = incidents.filter(
      (incident) => incident.severity.toLowerCase() === "major"
    ).length;

    const openOrInProgress = incidents.filter((incident) => {
      const status = incident.status.toLowerCase();
      return status === "open" || status === "in_progress";
    }).length;

    const maxImpact = incidents.reduce(
      (acc, incident) => Math.max(acc, safeNumber(incident.health_impact_score)),
      0
    );

    return {
      total: incidents.length,
      critical,
      major,
      openOrInProgress,
      maxImpact,
    };
  }, [incidents]);

  function handleQuickAction(
    action: "monitoring" | "map" | "incidents",
    path: string
  ) {
    setActiveQuickAction(action);

    window.setTimeout(() => {
      navigate(path);
    }, 120);
  }

  function openIncidentFromDashboard(incidentId: number) {
    navigate(`/incidents?incident=${incidentId}`);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-3 px-1 pb-3 pt-1 text-white">
          <section className="premium-panel rounded-[1.6rem]">
            <div className="premium-panel-body flex min-h-[58vh] flex-col items-center justify-center gap-5 text-center">
              <div className="boot-logo-ring flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-white/[0.08] bg-white/[0.03]">
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <div className="absolute inset-0 rounded-md border border-[#ff7900]/40" />
                  <div className="h-3.5 w-3.5 rounded-sm bg-[#ff7900]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                  Initializing Network Command
                </p>
                <p className="text-sm text-white/48">
                  Loading service posture, performance intelligence, and incident
                  command surfaces.
                </p>
              </div>

              <div className="h-2 w-60 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
                <div className="boot-progress h-full w-2/3 rounded-full bg-[#ff7900]" />
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  if (!summary.length && !hasAnySelectedTrend && error) {
    return (
      <AppShell>
        <div className="space-y-3 px-1 pb-3 pt-1 text-white">
          <section className="premium-panel rounded-[1.6rem]">
            <div className="premium-panel-body flex min-h-[52vh] flex-col items-center justify-center gap-3 text-center">
              <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                Dashboard failed to load
              </p>
              <p className="max-w-xl text-sm text-white/50">{error}</p>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageMotion className="space-y-3 px-1 pb-3 pt-1 text-white">
        <PanelReveal delayMs={0}>
          <section className="premium-panel rounded-[1.6rem]">
            <div className="premium-panel-body px-4 py-4 md:px-5 md:py-5">
              <div className="min-w-0">
                <div className="section-eyebrow">Network Command</div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-[1.45rem] font-semibold tracking-[-0.05em] text-white md:text-[1.7rem]">
                    National Service Posture
                  </h1>
                  <StatusPill tone={postureTone} />
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/54">
                  Real-time service quality across the active {technology} operational
                  scope, combining KPI stability, trend behavior, and incident pressure.
                </p>
              </div>

              {error ? (
                <div className="mt-4 rounded-[1rem] border border-amber-500/18 bg-amber-500/8 px-3.5 py-2.5 text-xs text-amber-200">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                {kpiCards.map((item, index) => (
                  <CommandMetricCard
                    key={item.key}
                    title={item.title}
                    shortLabel={item.shortLabel}
                    value={item.value}
                    helper={item.helper}
                    context={item.context}
                    tone={item.tone}
                    featured={index === 0}
                  />
                ))}
              </div>
            </div>
          </section>
        </PanelReveal>

        <PanelReveal delayMs={60}>
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.55fr_0.92fr]">
            <PanelFrame
              title="Performance Intelligence"
              subtitle="Comparative behavior of selected service KPIs across the active window"
              toolbar={
                <PanelContext
                  label={`${technology} scope · ${formatPeriodLabel(period)}`}
                />
              }
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SegmentedControl
                    options={technologyOptions}
                    value={technology}
                    onChange={(next) => setTechnologyScope(next as TechnologyKey)}
                  />

                  <div className="hidden h-5 w-px bg-white/[0.08] sm:block" />

                  <SegmentedControl
                    options={periodOptions}
                    value={period}
                    onChange={(next) => setPeriod(next as PeriodKey)}
                  />

                  <div className="ml-auto">
                    <BinaryToggle
                      leftLabel="Raw"
                      rightLabel="Normalized"
                      activeRight={normalized}
                      onToggle={() => setNormalized((prev) => !prev)}
                    />
                  </div>
                </div>

                <KpiToggleGroup
                  definitions={KPI_DEFS}
                  selectedKeys={selectedKpis}
                  onToggle={(key) =>
                    setSelectedKpis((prev) => {
                      if (prev.includes(key)) {
                        if (prev.length === 1) return prev;
                        return prev.filter((item) => item !== key);
                      }

                      return [...prev, key];
                    })
                  }
                />

                <div className="rounded-[1.2rem] border border-white/[0.06] bg-[#0a1016] p-2.5">
                  <TrendChartPanel
                    data={selectedSeries}
                    period={period}
                    normalized={normalized}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <MetaChip
                    label="Focus"
                    value={
                      selectedSeries.map((item) => item.label).join(" · ") || "—"
                    }
                  />
                  <MetaChip
                    label="Window"
                    value={`${formatPeriodLabel(period)} · ${technology}`}
                  />
                  <MetaChip
                    label="Regions"
                    value={`${validSummary.length} active`}
                  />
                  <MetaChip
                    label="Mode"
                    value={normalized ? "Normalized relation" : "Raw values"}
                  />
                </div>
              </div>
            </PanelFrame>

            <PanelFrame
              title="Operations Digest"
              subtitle="Compact command summary for the current dashboard context"
              toolbar={
                <span className="premium-toolbar-pill">
                  <Sparkles className="h-3.5 w-3.5 text-[#ff7900]" />
                  Executive view
                </span>
              }
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <DigestStat
                  label="Critical tickets"
                  value={`${incidentMetrics.critical}`}
                  tone={incidentMetrics.critical > 0 ? "critical" : "good"}
                />
                <DigestStat
                  label="Major tickets"
                  value={`${incidentMetrics.major}`}
                  tone={incidentMetrics.major > 0 ? "warning" : "good"}
                />
                <DigestStat
                  label="Open / active"
                  value={`${incidentMetrics.openOrInProgress}`}
                  tone={incidentMetrics.openOrInProgress > 0 ? "warning" : "good"}
                />
                <DigestStat
                  label="Peak impact"
                  value={`${incidentMetrics.maxImpact}`}
                  tone={incidentMetrics.maxImpact >= 85 ? "critical" : "warning"}
                />
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MetaChip label="Dashboard scope" value={technology} />
                <MetaChip label="Analysis window" value={formatPeriodLabel(period)} />
                <MetaChip label="Selected KPIs" value={`${selectedSeries.length}`} />
                <MetaChip label="Posture" value={toneMeta(postureTone).label} />
              </div>

              <div className="mt-3 rounded-[1.2rem] border border-white/[0.06] bg-white/[0.025] p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
                  Operator note
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  Use the dashboard for signal confirmation, the map for territorial
                  inspection, and the incidents workspace for execution-level handling.
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <QuickActionButton
                  label="Monitoring"
                  selected={activeQuickAction === "monitoring"}
                  onClick={() => handleQuickAction("monitoring", "/monitoring")}
                />
                <QuickActionButton
                  label="Map"
                  selected={activeQuickAction === "map"}
                  onClick={() => handleQuickAction("map", "/map")}
                />
                <QuickActionButton
                  label="Incidents"
                  selected={activeQuickAction === "incidents"}
                  onClick={() => handleQuickAction("incidents", "/incidents")}
                />
              </div>
            </PanelFrame>
          </section>
        </PanelReveal>

        <PanelReveal delayMs={120}>
          <section>
            <PanelFrame
              title="Active Incident Queue"
              subtitle="High-impact tickets requiring operator attention"
              toolbar={
                <button
                  onClick={() => navigate("/incidents")}
                  className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
                >
                  View all incidents
                  <ArrowRight className="h-4 w-4" />
                </button>
              }
            >
              <div className="space-y-2.5">
                {incidents.length === 0 ? (
                  <div className="rounded-[1.15rem] border border-white/[0.06] bg-white/[0.02] px-4 py-10 text-center text-sm text-white/45">
                    No incident feed available.
                  </div>
                ) : (
                  incidents.map((incident) => (
                    <IncidentQueueItem
                      key={incident.id}
                      incident={incident}
                      onClick={() => openIncidentFromDashboard(incident.id)}
                    />
                  ))
                )}
              </div>
            </PanelFrame>
          </section>
        </PanelReveal>
      </PageMotion>
    </AppShell>
  );
}

function PanelFrame({
  title,
  subtitle,
  toolbar,
  children,
}: {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="premium-panel rounded-[1.45rem]">
      <header className="premium-panel-header">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
        {toolbar}
      </header>

      <div className="premium-panel-body">{children}</div>
    </section>
  );
}

function CommandMetricCard({
  title,
  shortLabel,
  value,
  helper,
  context,
  tone,
  featured = false,
}: {
  title: string;
  shortLabel: string;
  value: string;
  helper: string;
  context: string;
  tone: ToneKey;
  featured?: boolean;
}) {
  const meta = toneMeta(tone);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-[1.25rem] border px-4 py-4",
        featured
          ? "border-orange-400/14 bg-[linear-gradient(180deg,rgba(255,121,0,0.10),rgba(255,255,255,0.02))] shadow-[0_14px_30px_rgba(255,121,0,0.08)]"
          : "border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            {shortLabel}
          </p>
          <p className="mt-1 text-sm font-medium text-white/88">{title}</p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.soft}`}
        >
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-[2rem] font-semibold leading-none tracking-[-0.06em] text-white">
          {value}
        </p>
        <span className="text-xs text-white/34">{helper}</span>
      </div>

      <div className="mt-3 text-[12px] leading-5 text-white/42">{context}</div>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="premium-segmented">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={[
              "premium-segmented-item orange-ring-focus min-w-[56px]",
              active ? "is-active" : "",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function BinaryToggle({
  leftLabel,
  rightLabel,
  activeRight,
  onToggle,
}: {
  leftLabel: string;
  rightLabel: string;
  activeRight: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="premium-segmented">
      <button
        onClick={onToggle}
        className={[
          "premium-segmented-item orange-ring-focus",
          !activeRight ? "is-active" : "",
        ].join(" ")}
      >
        {leftLabel}
      </button>
      <button
        onClick={onToggle}
        className={[
          "premium-segmented-item orange-ring-focus",
          activeRight ? "is-active" : "",
        ].join(" ")}
      >
        {rightLabel}
      </button>
    </div>
  );
}

function KpiToggleGroup({
  definitions,
  selectedKeys,
  onToggle,
}: {
  definitions: KpiDefinition[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {definitions.map((item) => {
        const active = selectedKeys.includes(item.key);

        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            className={[
              "orange-ring-focus rounded-[0.95rem] border px-3 py-2 text-xs font-medium transition",
              active
                ? "border-orange-400/18 bg-orange-500/12 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "border-white/[0.06] bg-white/[0.03] text-white/54 hover:border-white/[0.10] hover:bg-white/[0.05] hover:text-white",
            ].join(" ")}
          >
            {item.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

function PanelContext({ label }: { label: string }) {
  return (
    <span className="premium-toolbar-pill">
      <Activity className="h-3.5 w-3.5 text-[#ff7900]" />
      {label}
    </span>
  );
}

function MetaChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="data-chip">
      <p className="data-chip-label">{label}</p>
      <p className="data-chip-value">{value}</p>
    </div>
  );
}

function StatusPill({ tone }: { tone: ToneKey }) {
  const variant =
    tone === "good" ? "good" : tone === "warning" ? "watch" : "alert";

  return <span className={`status-pill ${variant}`}>{toneMeta(tone).label}</span>;
}

function IncidentQueueItem({
  incident,
  onClick,
}: {
  incident: Incident;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group orange-ring-focus w-full rounded-[1.2rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] px-4 py-3 text-left transition hover:border-white/[0.10] hover:bg-white/[0.04]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${severityDotClass(
                incident.severity
              )}`}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
              {incident.ticket_number}
            </span>
            <IncidentSeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>

          <p className="mt-2 line-clamp-1 text-sm font-medium text-white">
            {sanitizeTitle(incident.title)}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/42">
            <span>
              {incident.site_name || incident.region_code || "Unknown scope"}
            </span>
            <span>{incident.technology}</span>
            <span>{formatDateTime(incident.started_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-center">
          <ImpactBadge score={incident.health_impact_score} />
          <span className="hidden text-xs font-medium text-white/30 transition group-hover:text-white/56 md:inline">
            Inspect
          </span>
        </div>
      </div>
    </button>
  );
}

function DigestStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: ToneKey;
}) {
  const meta = toneMeta(tone);

  return (
    <div className="rounded-[1.15rem] border border-white/[0.06] bg-white/[0.025] px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
          {label}
        </p>
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
      </div>
      <p className="mt-2 text-[1.4rem] font-semibold leading-none tracking-[-0.05em] text-white">
        {value}
      </p>
    </div>
  );
}

function QuickActionButton({
  label,
  onClick,
  selected = false,
}: {
  label: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus justify-center transition",
        selected
          ? "premium-button border-orange-400/28 bg-[linear-gradient(180deg,rgba(255,121,0,0.24),rgba(255,121,0,0.14))] text-white"
          : "premium-button-ghost text-white/80 hover:border-orange-400/18 hover:bg-orange-500/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function IncidentSeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();

  const tone =
    normalized === "critical"
      ? "border-red-500/18 bg-red-500/12 text-red-300"
      : normalized === "major"
      ? "border-orange-500/18 bg-orange-500/12 text-orange-300"
      : normalized === "minor"
      ? "border-blue-500/18 bg-blue-500/12 text-blue-300"
      : "border-white/10 bg-white/8 text-white/70";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone}`}
    >
      {severity.replace(/_/g, " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const tone =
    normalized === "resolved"
      ? "border-emerald-500/18 bg-emerald-500/12 text-emerald-300"
      : normalized === "open"
      ? "border-red-500/18 bg-red-500/12 text-red-300"
      : normalized === "in_progress"
      ? "border-amber-500/18 bg-amber-500/12 text-amber-300"
      : "border-white/10 bg-white/8 text-white/70";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function ImpactBadge({ score }: { score: number }) {
  const tone =
    score >= 85
      ? "border-red-500/18 bg-red-500/12 text-red-300"
      : score >= 70
      ? "border-orange-500/18 bg-orange-500/12 text-orange-300"
      : score >= 30
      ? "border-blue-500/18 bg-blue-500/12 text-blue-300"
      : "border-white/10 bg-white/8 text-white/70";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tone}`}
    >
      Impact {score}
    </span>
  );
}

function sanitizeTitle(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function safeNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return value;
}

function getSeriesStat(series: TrendPoint[]) {
  if (!series.length) {
    return {
      current: null as number | null,
      delta: null as number | null,
    };
  }

  const current = safeNumber(series[series.length - 1]?.value);
  const previous =
    series.length > 1 ? safeNumber(series[series.length - 2]?.value) : null;

  return {
    current,
    delta: previous === null ? null : current - previous,
  };
}

function getSummaryAverage(
  items: KpiSummaryRegion[],
  selector?: (item: KpiSummaryRegion) => number | null | undefined
) {
  if (!selector || !items.length) return 0;

  const values = items
    .map(selector)
    .map((value) => safeNumber(value))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return 0;

  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function getHigherIsBetterTone(
  value: number,
  goodThreshold: number,
  warningThreshold: number
): ToneKey {
  if (value >= goodThreshold) return "good";
  if (value >= warningThreshold) return "warning";
  return "critical";
}

function getLowerIsBetterTone(
  value: number,
  goodThreshold: number,
  warningThreshold: number
): ToneKey {
  if (value <= goodThreshold) return "good";
  if (value <= warningThreshold) return "warning";
  return "critical";
}

function buildTargetLabel(def: KpiDefinition) {
  return def.higherIsBetter
    ? `Target ≥ ${def.goodThreshold}${def.unit}`
    : `Target ≤ ${def.goodThreshold}${def.unit}`;
}

function formatKpiValue(value: number, unit: string) {
  const abs = Math.abs(value);
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)}${unit}`;
}

function formatSignedValue(value: number, unit: string) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatKpiValue(value, unit)}`;
}

function toneMeta(tone: ToneKey) {
  if (tone === "good") {
    return {
      label: "STABLE",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
      soft: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (tone === "warning") {
    return {
      label: "WATCH",
      dot: "bg-amber-400",
      text: "text-amber-300",
      soft: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    };
  }

  return {
    label: "ALERT",
    dot: "bg-red-400",
    text: "text-red-300",
    soft: "border-red-500/20 bg-red-500/10 text-red-300",
  };
}

function severityDotClass(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") return "bg-red-400";
  if (normalized === "major") return "bg-orange-400";
  if (normalized === "minor") return "bg-blue-400";
  return "bg-white/35";
}

function formatDateTime(input: string) {
  const date = new Date(input);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPeriodLabel(period: PeriodKey) {
  if (period === "24h") return "Last 24 hours";
  if (period === "7d") return "Last 7 days";
  return "Last 30 days";
}

function getDateRangeForPeriod(period: PeriodKey) {
  const end = new Date();
  const start = new Date(end);

  if (period === "24h") {
    start.setDate(end.getDate() - 1);
  } else if (period === "7d") {
    start.setDate(end.getDate() - 7);
  } else {
    start.setDate(end.getDate() - 30);
  }

  const formatDateOnly = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    date_from: formatDateOnly(start),
    date_to: formatDateOnly(end),
  };
}