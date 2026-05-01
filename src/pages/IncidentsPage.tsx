import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Clock3,
  RefreshCw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  getIncidentById,
  getIncidentFilterOptions,
  getIncidents,
  getIncidentStats,
  type Incident,
  type IncidentDetails,
  type IncidentFilterOptions,
  type IncidentListResponse,
  type IncidentStats,
} from "@/services/incidents";
import {
  isLiveTechnologyScope,
  useTechnologyScope,
} from "@/stores/technologyScopeStore";

type SortMode = "severity" | "impact" | "started_at";

type FiltersState = {
  search: string;
  status: string;
  severity: string;
  priority: string;
  technology: string;
  region: string;
  onlyActive: boolean;
  sortBy: SortMode;
};

const DEFAULT_FILTERS: FiltersState = {
  search: "",
  status: "",
  severity: "",
  priority: "",
  technology: "3G",
  region: "",
  onlyActive: true,
  sortBy: "severity",
};

const PAGE_SIZE = 20;
const LIVE_TECHNOLOGY_OPTIONS = ["3G"];

export default function IncidentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const technologyScope = useTechnologyScope();

  const requestedIncidentId = useMemo(() => {
    const raw = searchParams.get("incident");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterOptions, setFilterOptions] =
    useState<IncidentFilterOptions | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<number | null>(
    null
  );
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentDetails | null>(null);

  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  const scopeIsLive = isLiveTechnologyScope(technologyScope);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const offset = (page - 1) * limit;

  useEffect(() => {
    if (!scopeIsLive) {
      setLoadingPage(false);
      setLoadingTable(false);
      setLoadingDetails(false);
      setError("");
      setStats(null);
      setIncidents([]);
      setSelectedIncidentId(null);
      setSelectedIncident(null);
      setTotalCount(0);
      return;
    }

    async function loadStaticData() {
      try {
        setLoadingPage(true);
        setError("");

        const [statsRes, filterOptionsRes] = await Promise.all([
          getIncidentStats(),
          getIncidentFilterOptions(),
        ]);

        setStats(statsRes);
        setFilterOptions(filterOptionsRes);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to initialize incident workspace.";
        setError(message);
      } finally {
        setLoadingPage(false);
      }
    }

    void loadStaticData();
  }, [scopeIsLive]);

  useEffect(() => {
    if (!scopeIsLive) return;

    if (requestedIncidentId && requestedIncidentId !== selectedIncidentId) {
      setSelectedIncidentId(requestedIncidentId);
    }
  }, [requestedIncidentId, selectedIncidentId, scopeIsLive]);

  useEffect(() => {
    if (!scopeIsLive) return;

    async function loadIncidents() {
      try {
        setLoadingTable(true);
        setError("");

        const response: IncidentListResponse = await getIncidents({
          limit,
          offset,
          status: filters.status || undefined,
          severity: filters.severity || undefined,
          priority: filters.priority || undefined,
          technology: "3G",
        });

        let dataset = [...response.results];

        if (filters.search.trim()) {
          const query = filters.search.trim().toLowerCase();

          dataset = dataset.filter((incident) => {
            const haystack = [
              incident.ticket_number,
              sanitizeTitle(incident.title),
              incident.problem_family,
              incident.site_name,
              incident.region_code,
              incident.technology,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(query);
          });
        }

        dataset = dataset.filter((incident) => incident.technology === "3G");

        if (filters.onlyActive) {
          dataset = dataset.filter((incident) => incident.is_active !== false);
        }

        if (filters.region) {
          dataset = dataset.filter(
            (incident) =>
              (incident.region_code || "").toUpperCase() === filters.region
          );
        }

        dataset.sort((a, b) => operatorSort(a, b, filters.sortBy));

        setIncidents(dataset);
        setTotalCount(response.count);
        setLimit(response.limit || PAGE_SIZE);

        if (dataset.length === 0) {
          if (!requestedIncidentId) {
            setSelectedIncidentId(null);
            setSelectedIncident(null);
          }
          return;
        }

        if (requestedIncidentId) {
          setSelectedIncidentId(requestedIncidentId);
          return;
        }

        const currentStillVisible =
          selectedIncidentId !== null &&
          dataset.some((incident) => incident.id === selectedIncidentId);

        if (!currentStillVisible) {
          setSelectedIncidentId(dataset[0].id);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load incident queue.";
        setError(message);
      } finally {
        setLoadingTable(false);
      }
    }

    void loadIncidents();
  }, [
    filters.search,
    filters.status,
    filters.severity,
    filters.priority,
    filters.region,
    filters.onlyActive,
    filters.sortBy,
    limit,
    offset,
    requestedIncidentId,
    selectedIncidentId,
    scopeIsLive,
  ]);

  useEffect(() => {
    if (!scopeIsLive) return;

    async function loadSelectedIncident() {
      if (!selectedIncidentId) {
        setSelectedIncident(null);
        return;
      }

      try {
        setLoadingDetails(true);
        const details = await getIncidentById(selectedIncidentId);
        setSelectedIncident(details);
      } catch {
        const fallback = incidents.find((item) => item.id === selectedIncidentId);
        setSelectedIncident(
          fallback ? ({ ...fallback } as IncidentDetails) : null
        );
      } finally {
        setLoadingDetails(false);
      }
    }

    void loadSelectedIncident();
  }, [selectedIncidentId, incidents, scopeIsLive]);

  function handleFilterChange<K extends keyof FiltersState>(
    key: K,
    value: FiltersState[K]
  ) {
    setPage(1);

    if (key === "technology") {
      setFilters((prev) => ({ ...prev, technology: "3G" }));
      return;
    }

    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function applySeverityTab(value: string) {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      severity: value,
      onlyActive: true,
      sortBy: "severity",
      technology: "3G",
    }));
  }

  function resetFilters() {
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  }

  function syncIncidentParam(id: number | null) {
    const next = new URLSearchParams(searchParams);

    if (id === null) {
      next.delete("incident");
    } else {
      next.set("incident", String(id));
    }

    setSearchParams(next, { replace: true });
  }

  function handleSelectIncident(id: number) {
    setSelectedIncidentId(id);
    syncIncidentParam(id);
  }

  const regionOptions = useMemo(() => {
    const values = new Set<string>();

    incidents.forEach((item) => {
      if (item.region_code) values.add(item.region_code.toUpperCase());
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [incidents]);

  const pageStart = totalCount === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + incidents.length, totalCount);

  const commandStats = [
    {
      label: "Active",
      value: stats?.active_incidents ?? 0,
      tone: "neutral" as const,
    },
    {
      label: "Critical",
      value: stats?.critical_incidents ?? 0,
      tone: "critical" as const,
    },
    {
      label: "Major",
      value: stats?.major_incidents ?? 0,
      tone: "major" as const,
    },
    {
      label: "Minor",
      value: stats?.minor_incidents ?? 0,
      tone: "minor" as const,
    },
    {
      label: "Resolved",
      value: stats?.resolved_incidents ?? 0,
      tone: "resolved" as const,
    },
    {
      label: "Closed",
      value: stats?.closed_incidents ?? 0,
      tone: "neutral" as const,
    },
  ];

  const severityTabs = [
    { label: "All Active", value: "" },
    { label: "Critical", value: "critical" },
    { label: "Major", value: "major" },
    { label: "Minor", value: "minor" },
    { label: "Warning", value: "warning" },
  ];

  if (loadingPage) {
    return (
      <AppShell>
        <div className="space-y-3 px-1 pb-3 pt-1 text-white">
          <section className="premium-panel rounded-[1.6rem]">
            <div className="premium-panel-body space-y-3 py-6">
              <SkeletonBlock className="h-16" />
              <SkeletonBlock className="h-12" />
              <SkeletonBlock className="h-80" />
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  if (error && !loadingTable && incidents.length === 0) {
    return (
      <AppShell>
        <div className="space-y-3 px-1 pb-3 pt-1 text-white">
          <section className="premium-panel rounded-[1.6rem]">
            <div className="premium-panel-body flex min-h-[52vh] flex-col items-center justify-center gap-3 text-center">
              <p className="text-lg font-semibold tracking-[-0.03em] text-white">
                Incident workspace failed to load
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
      <div className="space-y-3 px-1 pb-3 pt-1 text-white">
        <section className="premium-panel rounded-[1.55rem]">
          <div className="premium-panel-body px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-eyebrow">Incident Command</p>
                <h1 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.05em] text-white md:text-[1.62rem]">
                  Escalation Operations Surface
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
                  Severity-first operator workspace for high-impact 3G service
                  events, enriched with inspection context, queue controls, and
                  execution-ready triage signals.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {error ? (
                  <div className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                    Partial load
                  </div>
                ) : null}

                <button
                  onClick={() => window.location.reload()}
                  className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh workspace
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              {commandStats.map((item) => (
                <IncidentKpiCell
                  key={item.label}
                  title={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>
          </div>
        </section>

        <PanelFrame
          title="Severity Quick Queue"
          subtitle="Fast escalation tabs before fine-grain filtering"
          compact
        >
          <div className="flex flex-wrap gap-2">
            {severityTabs.map((tab) => {
              const active =
                tab.value === ""
                  ? filters.severity === "" && filters.onlyActive
                  : filters.severity === tab.value;

              return (
                <button
                  key={tab.label}
                  onClick={() => applySeverityTab(tab.value)}
                  className={severityTabClass(tab.value, active)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </PanelFrame>

        <PanelFrame
          title="Command Filter Strip"
          subtitle="Operator controls for queue narrowing and incident scan priority"
          compact
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.7fr_repeat(5,minmax(0,1fr))]">
              <FilterField label="Search">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    placeholder="Ticket / title / region / site / family"
                    className={`${controlClassName} pl-11`}
                  />
                </div>
              </FilterField>

              <FilterSelect
                label="Status"
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                options={filterOptions?.statuses ?? []}
              />

              <FilterSelect
                label="Severity"
                value={filters.severity}
                onChange={(value) => handleFilterChange("severity", value)}
                options={filterOptions?.severities ?? []}
              />

              <FilterSelect
                label="Priority"
                value={filters.priority}
                onChange={(value) => handleFilterChange("priority", value)}
                options={filterOptions?.priorities ?? []}
              />

              <FilterSelect
                label="Technology"
                value={filters.technology}
                onChange={(value) => handleFilterChange("technology", value)}
                options={LIVE_TECHNOLOGY_OPTIONS}
              />

              <FilterSelect
                label="Region"
                value={filters.region}
                onChange={(value) => handleFilterChange("region", value)}
                options={regionOptions}
              />
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={resetFilters}
                  className="premium-button-ghost orange-ring-focus text-white/76 hover:text-white"
                >
                  Reset filters
                </button>

                <button
                  onClick={() =>
                    handleFilterChange("onlyActive", !filters.onlyActive)
                  }
                  className={[
                    "rounded-[0.9rem] border px-3 py-2 text-xs font-medium transition",
                    filters.onlyActive
                      ? "border-emerald-500/18 bg-emerald-500/12 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.08)_inset]"
                      : "border-white/[0.08] bg-white/[0.04] text-white/65 hover:bg-white/[0.08]",
                  ].join(" ")}
                >
                  Active Only {filters.onlyActive ? "ON" : "OFF"}
                </button>

                <button
                  onClick={() => handleFilterChange("sortBy", "severity")}
                  className={sortPillClass(filters.sortBy === "severity")}
                >
                  Severity
                </button>

                <button
                  onClick={() => handleFilterChange("sortBy", "impact")}
                  className={sortPillClass(filters.sortBy === "impact")}
                >
                  Impact
                </button>

                <button
                  onClick={() => handleFilterChange("sortBy", "started_at")}
                  className={sortPillClass(filters.sortBy === "started_at")}
                >
                  Newest
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <InlineHeaderPill
                  label={`Window ${pageStart}-${pageEnd} / ${totalCount}`}
                />
                <InlineHeaderPill label={`Page ${page} / ${totalPages}`} />
                <InlineHeaderPill label="3G live scope" />
              </div>
            </div>
          </div>
        </PanelFrame>

        <section className="grid grid-cols-1 gap-3 2xl:grid-cols-[1.56fr_0.94fr]">
          <PanelFrame
            title="Live Incident Feed"
            subtitle="Severity-first operator queue with sticky header"
          >
            <div className="overflow-hidden rounded-[1.1rem] border border-white/[0.06] bg-[linear-gradient(180deg,#0b1319_0%,#091016_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <div className="max-h-[760px] overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0 z-20 bg-[linear-gradient(180deg,#171e25_0%,#121920_100%)] text-left text-[10px] uppercase tracking-[0.12em] text-white/40 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Ticket</th>
                      <th className="px-4 py-2.5 font-medium">Scope / Title</th>
                      <th className="px-4 py-2.5 font-medium">Severity</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Priority</th>
                      <th className="px-4 py-2.5 font-medium">Impact</th>
                      <th className="px-4 py-2.5 font-medium">Location</th>
                      <th className="px-4 py-2.5 font-medium">Started</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingTable ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <tr
                          key={`skeleton-${index}`}
                          className="border-t border-white/[0.05]"
                        >
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid grid-cols-8 gap-3">
                              <SkeletonLine className="col-span-1 h-9" />
                              <SkeletonLine className="col-span-2 h-9" />
                              <SkeletonLine className="col-span-1 h-9" />
                              <SkeletonLine className="col-span-1 h-9" />
                              <SkeletonLine className="col-span-1 h-9" />
                              <SkeletonLine className="col-span-1 h-9" />
                              <SkeletonLine className="col-span-1 h-9" />
                              <SkeletonLine className="col-span-1 h-9" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : incidents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-4 py-12 text-center text-sm text-white/45"
                        >
                          No 3G incidents found for the current command filter.
                        </td>
                      </tr>
                    ) : (
                      incidents.map((incident) => {
                        const isSelected = selectedIncidentId === incident.id;

                        return (
                          <tr
                            key={incident.id}
                            onClick={() => handleSelectIncident(incident.id)}
                            className={[
                              "group cursor-pointer border-t border-white/[0.05] text-white/80 transition-all duration-220 ease-out",
                              "hover:bg-[linear-gradient(90deg,rgba(255,140,0,0.055)_0%,rgba(255,255,255,0.018)_60%,rgba(255,255,255,0.01)_100%)]",
                              isSelected
                                ? "bg-[linear-gradient(90deg,rgba(255,121,0,0.09)_0%,rgba(255,255,255,0.018)_70%,rgba(255,255,255,0.008)_100%)] shadow-[inset_3px_0_0_rgba(255,121,0,0.95),inset_0_1px_0_rgba(255,255,255,0.02)]"
                                : incidentRowTone(incident.severity),
                            ].join(" ")}
                          >
                            <td className="whitespace-nowrap px-4 py-2.5 align-middle font-medium text-white">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={[
                                    "h-2.5 w-2.5 rounded-full",
                                    severityDotClass(incident.severity),
                                    incident.severity.toLowerCase() ===
                                    "critical"
                                      ? "animate-pulse"
                                      : "",
                                  ].join(" ")}
                                />
                                <div className="flex min-w-0 flex-col">
                                  <span className="text-[13px] font-semibold text-white">
                                    {incident.ticket_number}
                                  </span>
                                  <span className="text-[11px] text-white/30">
                                    Event record
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-[540px] px-4 py-2.5 align-middle">
                              <div className="min-w-0">
                                <div className="line-clamp-1 text-[13px] font-medium text-white">
                                  {sanitizeTitle(incident.title)}
                                </div>
                                <div className="mt-0.5 text-[11px] text-white/30">
                                  {incident.problem_family || "No family tag"}
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-2.5 align-middle">
                              <SeverityBadge severity={incident.severity} />
                            </td>

                            <td className="px-4 py-2.5 align-middle">
                              <StatusBadge status={incident.status} />
                            </td>

                            <td className="px-4 py-2.5 align-middle text-[12px] text-white/56">
                              {incident.priority ?? "—"}
                            </td>

                            <td className="px-4 py-2.5 align-middle">
                              <ImpactBadge score={incident.health_impact_score} />
                            </td>

                            <td className="px-4 py-2.5 align-middle text-[12px] text-white/54">
                              <div>{getLocationLabel(incident)}</div>
                              <div className="mt-0.5 text-[11px] text-white/28">
                                {incident.technology || "3G"}
                              </div>
                            </td>

                            <td className="whitespace-nowrap px-4 py-2.5 align-middle text-[12px] text-white/50">
                              {formatCompactDateTime(incident.started_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/38">
                Queue priority = critical first, then impact, then start time.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loadingTable}
                  className="premium-button-ghost orange-ring-focus disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="rounded-[0.95rem] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/65">
                  {page} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page >= totalPages || loadingTable}
                  className="premium-button-ghost orange-ring-focus disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </PanelFrame>

          <PanelFrame
            title="Inspection Panel"
            subtitle="Selected incident metadata, operator meaning, and execution context"
            toolbar={
              selectedIncident ? (
                <span className="premium-toolbar-pill">
                  <Sparkles className="h-3.5 w-3.5 text-[#ff7900]" />
                  Deep inspection
                </span>
              ) : null
            }
          >
            {loadingDetails ? (
              <div className="space-y-3 py-2">
                <SkeletonBlock className="h-36" />
                <div className="grid grid-cols-2 gap-3">
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                  <SkeletonBlock className="h-20" />
                </div>
                <SkeletonBlock className="h-24" />
              </div>
            ) : !selectedIncident ? (
              <div className="flex min-h-[560px] items-center justify-center text-sm text-white/45">
                Select an incident to inspect full context.
              </div>
            ) : (
              <div
                key={selectedIncident.id}
                className="space-y-3 animate-[panelReveal_220ms_ease-out]"
              >
                <div className="overflow-hidden rounded-[1.22rem] border border-orange-400/12 bg-[linear-gradient(180deg,rgba(255,121,0,0.08),rgba(255,255,255,0.015))] shadow-[0_16px_34px_rgba(255,121,0,0.08)]">
                  <div className="border-b border-white/[0.06] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/34">
                          Ticket Number
                        </p>
                        <h4 className="mt-2 text-[22px] font-semibold tracking-[-0.04em] text-white">
                          {selectedIncident.ticket_number}
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <SeverityBadge severity={selectedIncident.severity} />
                        <StatusBadge status={selectedIncident.status} />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/34">
                        Title
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/84">
                        {sanitizeTitle(selectedIncident.title)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-white/[0.06]">
                    <HeroMiniStat
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Elapsed"
                      value={getElapsedLabel(selectedIncident.started_at)}
                    />
                    <HeroMiniStat
                      icon={<Target className="h-4 w-4" />}
                      label="Impact Band"
                      value={getImpactLevel(
                        selectedIncident.health_impact_score
                      )}
                    />
                    <HeroMiniStat
                      icon={<AlertTriangle className="h-4 w-4" />}
                      label="Severity Rank"
                      value={severityRank(selectedIncident.severity)}
                    />
                  </div>
                </div>

                <div className="rounded-[1.05rem] border border-orange-500/10 bg-[linear-gradient(180deg,#0f1419_0%,#0c1116_100%)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/34">
                    Operational Context
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <InfoChip
                      label="Priority"
                      value={selectedIncident.priority ?? "Not available"}
                      hint="Priority is the assigned operational urgency level from the ticketing source."
                    />
                    <InfoChip
                      label="Technology"
                      value={selectedIncident.technology ?? "3G"}
                      hint="Technology identifies the affected network domain. Current live incident workspace is locked to 3G."
                    />
                    <InfoChip
                      label="Started"
                      value={formatDateTime(selectedIncident.started_at)}
                      hint="Started is the incident start timestamp received from the incident source."
                    />
                    <InfoChip
                      label="Active"
                      value={selectedIncident.is_active ? "Yes" : "No"}
                      hint="Active indicates whether the incident is still operationally open and affecting live monitoring scope."
                    />
                  </div>
                </div>

                <div className="rounded-[1.05rem] border border-orange-500/10 bg-[linear-gradient(180deg,#0f1419_0%,#0c1116_100%)] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/34">
                    Scope & Classification
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <InfoChip
                      label="Region"
                      value={selectedIncident.region_code ?? "Not available"}
                      hint="Region is the geographic operational scope attached to the incident record. Missing value means geo enrichment is incomplete."
                    />
                    <InfoChip
                      label="Site"
                      value={selectedIncident.site_name ?? "Not available"}
                      hint="Site is the affected physical or logical site reference. Missing value means site-level enrichment is not available."
                    />
                    <InfoChip
                      label="Problem Family"
                      value={selectedIncident.problem_family ?? "Unclassified"}
                      hint="Problem family is the incident category or issue family used for clustering and recurring fault analysis."
                    />
                    <InfoChip
                      label="Impact Score"
                      value={String(selectedIncident.health_impact_score ?? 0)}
                      hint="Raw health impact score attached to the incident."
                    />
                  </div>
                </div>

                <div className="rounded-[1.05rem] border border-orange-500/10 bg-[linear-gradient(180deg,#0f1419_0%,#0c1116_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
                      Scope Status
                    </p>
                    <HintDot text="Scope status summarizes whether region/site information is available enough for geographic investigation." />
                  </div>

                  <div className="mt-3">
                    {selectedIncident.region_code || selectedIncident.site_name ? (
                      <div className="rounded-[0.95rem] border border-emerald-500/20 bg-emerald-500/8 px-3 py-3 text-sm text-emerald-200">
                        Geo scope partially available. Investigation can
                        continue using current site/region context.
                      </div>
                    ) : (
                      <div className="rounded-[0.95rem] border border-amber-500/20 bg-amber-500/8 px-3 py-3 text-sm text-amber-200">
                        Geo scope unresolved. This record is operationally visible
                        but not enriched with usable region/site mapping.
                      </div>
                    )}
                  </div>
                </div>

                <DetailBlock
                  label="Root Cause Hint"
                  value={
                    selectedIncident.root_cause_hint ??
                    "Root cause not available."
                  }
                />
              </div>
            )}
          </PanelFrame>
        </section>

        <style>{`
          @keyframes panelReveal {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes skeletonShift {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </AppShell>
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
        className={compact ? "premium-panel-header px-4 py-3" : "premium-panel-header"}
      >
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="panel-subtitle">{subtitle}</p> : null}
        </div>
        {toolbar}
      </header>

      <div
        className={compact ? "premium-panel-body px-4 py-3" : "premium-panel-body"}
      >
        {children}
      </div>
    </section>
  );
}

function IncidentKpiCell({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "neutral" | "critical" | "major" | "minor" | "resolved";
}) {
  const meta =
    tone === "critical"
      ? {
          text: "text-red-300",
          border: "border-red-500/12",
          bg: "bg-red-500/[0.05]",
          dot: "bg-red-400",
        }
      : tone === "major"
      ? {
          text: "text-orange-300",
          border: "border-orange-500/12",
          bg: "bg-orange-500/[0.05]",
          dot: "bg-orange-400",
        }
      : tone === "minor"
      ? {
          text: "text-amber-200",
          border: "border-amber-500/10",
          bg: "bg-amber-500/[0.04]",
          dot: "bg-amber-300",
        }
      : tone === "resolved"
      ? {
          text: "text-emerald-300",
          border: "border-emerald-500/12",
          bg: "bg-emerald-500/[0.05]",
          dot: "bg-emerald-400",
        }
      : {
          text: "text-white/88",
          border: "border-white/[0.06]",
          bg: "bg-white/[0.025]",
          dot: "bg-white/30",
        };

  return (
    <div
      className={`rounded-[1.08rem] border px-4 py-3 ${meta.border} ${meta.bg}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">
          {title}
        </p>
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
      </div>
      <p
        className={`mt-2 text-[1.82rem] font-semibold tracking-[-0.05em] ${meta.text}`}
      >
        {value}
      </p>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <FilterField label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClassName}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={`${label}-${option}`} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </FilterField>
  );
}

function HeroMiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        <span className="text-[#ff7900]">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function InlineHeaderPill({ label }: { label: string }) {
  return <span className="premium-toolbar-pill">{label}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();

  const tone =
    normalized === "critical"
      ? "border-red-500/18 bg-red-500/12 text-red-300"
      : normalized === "major"
      ? "border-orange-500/18 bg-orange-500/12 text-orange-300"
      : normalized === "minor"
      ? "border-amber-500/16 bg-amber-500/10 text-amber-200"
      : normalized === "warning"
      ? "border-amber-500/18 bg-amber-500/12 text-amber-300"
      : "border-white/10 bg-white/8 text-white/70";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone}`}
    >
      {formatLabel(severity)}
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
      {formatLabel(status)}
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
      ? "border-amber-500/16 bg-amber-500/10 text-amber-200"
      : "border-white/10 bg-white/8 text-white/70";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${tone}`}
    >
      {score}
    </span>
  );
}

function InfoChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-[1rem] border border-orange-500/10 bg-[linear-gradient(180deg,#11171c_0%,#0c1116_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.016)] transition hover:bg-[linear-gradient(180deg,#13191f_0%,#0d1218_100%)]">
      <div className="flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
          {label}
        </p>
        <HintDot text={hint} />
      </div>
      <div className="mt-2 text-sm font-medium text-white/85">{value}</div>
    </div>
  );
}

function HintDot({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-bold text-white/50">
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 w-[220px] -translate-x-1/2 rounded-[0.9rem] border border-white/[0.08] bg-[#0f1722] px-3 py-2 text-[11px] leading-5 text-white/78 opacity-0 shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-orange-500/10 bg-[linear-gradient(180deg,#0f1419_0%,#0c1116_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white/82">{value}</p>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-[1rem] border border-white/[0.05] bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] animate-[skeletonShift_1.4s_linear_infinite] ${className}`}
    />
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-[linear-gradient(90deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_100%)] bg-[length:200%_100%] animate-[skeletonShift_1.4s_linear_infinite] ${className}`}
    />
  );
}

const controlClassName =
  "h-10.5 w-full rounded-[0.95rem] border border-white/10 bg-[#101925] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/45 focus:bg-[#121d2a] focus:shadow-[0_0_0_1px_rgba(255,121,0,0.08)]";

function sortPillClass(active: boolean) {
  return active
    ? "rounded-[0.9rem] border border-orange-500/18 bg-orange-500/12 px-3 py-2 text-xs font-medium text-orange-300 transition shadow-[0_0_0_1px_rgba(255,121,0,0.08)_inset]"
    : "rounded-[0.9rem] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/65 transition hover:-translate-y-[1px] hover:bg-white/[0.08]";
}

function severityTabClass(value: string, active: boolean) {
  if (active) {
    if (value === "critical")
      return "rounded-[0.9rem] border border-red-500/18 bg-red-500/12 px-3 py-2 text-xs font-medium text-red-300";
    if (value === "major")
      return "rounded-[0.9rem] border border-orange-500/18 bg-orange-500/12 px-3 py-2 text-xs font-medium text-orange-300";
    if (value === "minor")
      return "rounded-[0.9rem] border border-amber-500/16 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-200";
    if (value === "warning")
      return "rounded-[0.9rem] border border-amber-500/18 bg-amber-500/12 px-3 py-2 text-xs font-medium text-amber-300";

    return "rounded-[0.9rem] border border-emerald-500/18 bg-emerald-500/12 px-3 py-2 text-xs font-medium text-emerald-300";
  }

  return "rounded-[0.9rem] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/65 transition hover:-translate-y-[1px] hover:bg-white/[0.08]";
}

function sanitizeTitle(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function formatDateTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCompactDateTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getImpactLevel(score: number) {
  if (score >= 85) return "Critical";
  if (score >= 70) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

function severityRank(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") return "S1";
  if (normalized === "major") return "S2";
  if (normalized === "minor") return "S3";
  return "S4";
}

function getLocationLabel(incident: Pick<Incident, "site_name" | "region_code">) {
  return incident.site_name || incident.region_code || "Not available";
}

function getElapsedLabel(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 60) return `${diffMinutes}m`;

  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  const days = Math.floor(diffMinutes / 1440);
  const hours = Math.floor((diffMinutes % 1440) / 60);
  return `${days}d ${hours}h`;
}

function severityScore(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") return 5;
  if (normalized === "major") return 4;
  if (normalized === "minor") return 3;
  if (normalized === "warning") return 2;
  return 1;
}

function operatorSort(a: Incident, b: Incident, sortBy: SortMode) {
  const severityDelta = severityScore(b.severity) - severityScore(a.severity);

  if (severityDelta !== 0) return severityDelta;

  if (sortBy === "impact") {
    return (
      (b.health_impact_score ?? 0) - (a.health_impact_score ?? 0) ||
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  if (sortBy === "started_at") {
    return (
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime() ||
      (b.health_impact_score ?? 0) - (a.health_impact_score ?? 0)
    );
  }

  return (
    (b.health_impact_score ?? 0) - (a.health_impact_score ?? 0) ||
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
}

function incidentRowTone(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") {
    return "hover:shadow-[inset_3px_0_0_rgba(248,113,113,0.9)]";
  }
  if (normalized === "major") {
    return "hover:shadow-[inset_3px_0_0_rgba(251,146,60,0.9)]";
  }
  if (normalized === "minor") {
    return "hover:shadow-[inset_3px_0_0_rgba(251,191,36,0.85)]";
  }
  if (normalized === "warning") {
    return "hover:shadow-[inset_3px_0_0_rgba(251,191,36,0.85)]";
  }

  return "";
}

function severityDotClass(severity: string) {
  const normalized = severity.toLowerCase();

  if (normalized === "critical") return "bg-red-400";
  if (normalized === "major") return "bg-orange-400";
  if (normalized === "minor") return "bg-amber-300";
  if (normalized === "warning") return "bg-amber-400";
  return "bg-white/35";
}