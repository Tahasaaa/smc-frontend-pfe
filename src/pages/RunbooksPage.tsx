import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  Filter,
  LibraryBig,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import {
  getRunbook,
  getRunbookFeedbackSummary,
  searchRunbooks,
  type RunbookEntry,
  type RunbookFeedbackSummary,
  type RunbookSearchResponse,
} from "@/services/rca";

type FamilyFilter = "all" | string;

export default function RunbooksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || searchParams.get("ticket") || "";

  const [query, setQuery] = useState(initialQuery);
  const [familyFilter, setFamilyFilter] = useState<FamilyFilter>("all");
  const [runbooks, setRunbooks] = useState<RunbookEntry[]>([]);
  const [selectedRunbook, setSelectedRunbook] = useState<RunbookEntry | null>(
    null
  );
  const [summary, setSummary] = useState<RunbookFeedbackSummary | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const filteredRunbooks = useMemo(() => {
    if (familyFilter === "all") return runbooks;

    return runbooks.filter(
      (item) => normalizeText(item.approved_family) === normalizeText(familyFilter)
    );
  }, [familyFilter, runbooks]);

  const availableFamilies = useMemo(() => {
    const families = new Set<string>();

    for (const item of runbooks) {
      if (item.approved_family) families.add(item.approved_family);
    }

    if (summary?.by_family) {
      for (const family of Object.keys(summary.by_family)) {
        families.add(family);
      }
    }

    return Array.from(families).sort();
  }, [runbooks, summary]);

  const lastCreated = useMemo(() => {
    const dates = runbooks
      .map((item) => item.created_at)
      .filter(Boolean)
      .sort()
      .reverse();

    return dates[0] || "";
  }, [runbooks]);

  useEffect(() => {
    void loadSummary();
    void loadRunbooks(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    try {
      setLoadingSummary(true);
      const response = await getRunbookFeedbackSummary();
      setSummary(response);
    } catch {
      // Summary is useful but not mandatory.
    } finally {
      setLoadingSummary(false);
    }
  }

  async function loadRunbooks(nextQuery = query) {
    try {
      setLoading(true);
      setError("");

      const response = await searchRunbooks(nextQuery.trim());
      const normalized = normalizeRunbookSearchResponse(response);

      setRunbooks(normalized.items);

      if (normalized.items.length) {
        const currentTicket = selectedRunbook?.ticket_id;
        const stillExists = normalized.items.find(
          (item) => item.ticket_id === currentTicket
        );

        const nextSelection = stillExists || normalized.items[0];

        if (nextSelection.ticket_id) {
          await openRunbook(nextSelection.ticket_id, nextSelection);
        } else {
          setSelectedRunbook(nextSelection);
        }
      } else {
        setSelectedRunbook(null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load RCA runbooks."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openRunbook(ticketId: string, fallback?: RunbookEntry) {
    try {
      setLoadingDetails(true);
      setError("");

      const details = await getRunbook(ticketId);
      setSelectedRunbook(details);
    } catch {
      if (fallback) {
        setSelectedRunbook(fallback);
      }
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const cleanQuery = query.trim();

    if (cleanQuery) {
      setSearchParams({ q: cleanQuery });
    } else {
      setSearchParams({});
    }

    void loadRunbooks(cleanQuery);
  }

  const totalRunbooks = summary?.total_runbooks ?? runbooks.length;
  const reusableRunbooks =
    summary?.reusable_runbooks ??
    runbooks.filter((item) => getReusableStatus(item) === "yes").length;

  return (
    <AppShell>
      <div className="space-y-3 px-1 pb-6 pt-1 text-white">
        <section className="premium-panel rounded-[1.55rem]">
          <div className="premium-panel-body px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-eyebrow">RCA Knowledge Base</p>
                <h1 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.05em] text-white md:text-[1.75rem]">
                  Runbook Library
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
                  Capitalized RCA démarches published after engineer validation:
                  checks, actions, final conclusion, tags and reusable
                  operational knowledge.
                </p>
              </div>

              <div className="premium-toolbar-pill">
                <Sparkles className="h-3.5 w-3.5 text-[#ff7900]" />
                Reusable intelligence
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <SummaryCard
                icon={<LibraryBig className="h-4 w-4" />}
                label="Total runbooks"
                value={loadingSummary ? "..." : String(totalRunbooks)}
                tone="orange"
              />
              <SummaryCard
                icon={<BookOpenCheck className="h-4 w-4" />}
                label="Reusable"
                value={loadingSummary ? "..." : String(reusableRunbooks)}
                tone="green"
              />
              <SummaryCard
                icon={<Filter className="h-4 w-4" />}
                label="Selected family"
                value={familyFilter === "all" ? "All" : familyFilter}
                tone="blue"
              />
              <SummaryCard
                icon={<ClipboardList className="h-4 w-4" />}
                label="Last created"
                value={lastCreated ? formatDate(lastCreated) : "—"}
                tone="gray"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <section className="premium-panel rounded-[1.42rem]">
              <header className="premium-panel-header">
                <div className="min-w-0">
                  <h2 className="panel-title">Search runbooks</h2>
                  <p className="panel-subtitle">
                    Search by ticket, site, family, tag or engineer note.
                  </p>
                </div>
              </header>

              <div className="premium-panel-body space-y-4">
                <form onSubmit={handleSearch} className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Example: SYN2504000007"
                      className="h-11 w-full rounded-[1rem] border border-white/10 bg-[#0b1219] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/45 focus:bg-[#101925]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[1rem] border border-orange-400/18 bg-orange-500/12 px-4 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/18 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileSearch className="h-4 w-4" />
                      )}
                      Search
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setSearchParams({});
                        void loadRunbooks("");
                      }}
                      disabled={loading}
                      className="orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[1rem] border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-sm font-semibold text-white/62 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                  </div>
                </form>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/36">
                    Family filter
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <FamilyChip
                      active={familyFilter === "all"}
                      label="All"
                      onClick={() => setFamilyFilter("all")}
                    />

                    {availableFamilies.map((family) => (
                      <FamilyChip
                        key={family}
                        active={familyFilter === family}
                        label={family}
                        onClick={() => setFamilyFilter(family)}
                      />
                    ))}
                  </div>
                </div>

                {error ? (
                  <div className="rounded-[1rem] border border-red-400/16 bg-red-500/10 p-3 text-sm leading-6 text-red-100">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="premium-panel rounded-[1.42rem]">
              <header className="premium-panel-header">
                <div>
                  <h2 className="panel-title">Saved runbooks</h2>
                  <p className="panel-subtitle">
                    {filteredRunbooks.length} result
                    {filteredRunbooks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </header>

              <div className="premium-panel-body">
                {loading ? (
                  <RunbookLoadingList />
                ) : filteredRunbooks.length ? (
                  <div className="space-y-2">
                    {filteredRunbooks.map((item) => (
                      <RunbookListItem
                        key={item.ticket_id || item.id}
                        item={item}
                        active={selectedRunbook?.ticket_id === item.ticket_id}
                        onClick={() => {
                          if (item.ticket_id) {
                            void openRunbook(item.ticket_id, item);
                          } else {
                            setSelectedRunbook(item);
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyRunbookList query={query} />
                )}
              </div>
            </section>
          </aside>

          <main className="min-w-0">
            {selectedRunbook ? (
              <RunbookDetails
                runbook={selectedRunbook}
                loading={loadingDetails}
                onOpenRca={() => {
                  if (selectedRunbook.ticket_id) {
                    navigate(`/rca?ticket=${encodeURIComponent(selectedRunbook.ticket_id)}`);
                  }
                }}
              />
            ) : (
              <NoRunbookSelected />
            )}
          </main>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "orange" | "green" | "blue" | "gray";
}) {
  const toneClass =
    tone === "orange"
      ? "border-orange-400/14 bg-orange-500/10 text-orange-200"
      : tone === "green"
        ? "border-emerald-400/14 bg-emerald-500/10 text-emerald-200"
        : tone === "blue"
          ? "border-sky-400/14 bg-sky-500/10 text-sky-200"
          : "border-white/[0.08] bg-white/[0.035] text-white/70";

  return (
    <div className="rounded-[1.1rem] border border-white/[0.06] bg-white/[0.025] p-4">
      <div className={`inline-flex rounded-[0.8rem] border p-2 ${toneClass}`}>
        {icon}
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/36">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>
    </div>
  );
}

function FamilyChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-orange-400/22 bg-orange-500/14 text-orange-200"
          : "border-white/[0.08] bg-white/[0.035] text-white/52 hover:bg-white/[0.06] hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function RunbookListItem({
  item,
  active,
  onClick,
}: {
  item: RunbookEntry;
  active: boolean;
  onClick: () => void;
}) {
  const tags = getTags(item).slice(0, 3);

  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus w-full rounded-[1.05rem] border p-4 text-left transition hover:-translate-y-[1px]",
        active
          ? "border-orange-400/22 bg-orange-500/10 shadow-[0_14px_34px_rgba(255,121,0,0.08)]"
          : "border-white/[0.06] bg-white/[0.025] hover:border-orange-400/14 hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {item.ticket_id || "Unknown ticket"}
          </p>
          <p className="mt-1 truncate text-xs text-white/42">
            {item.site_name || item.site_id || "Site not available"}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-emerald-400/14 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-200">
          {item.approved_family || "RCA"}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/48">
        {item.incident_summary || item.final_conclusion || "No summary available."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.length ? (
          tags.map((tag) => (
            <span
              key={`${item.ticket_id}-${tag}`}
              className="rounded-full border border-white/[0.06] bg-white/[0.035] px-2 py-1 text-[10px] text-white/45"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-white/30">No tags</span>
        )}
      </div>
    </button>
  );
}

function RunbookDetails({
  runbook,
  loading,
  onOpenRca,
}: {
  runbook: RunbookEntry;
  loading: boolean;
  onOpenRca: () => void;
}) {
  const checks = getChecks(runbook);
  const actions = getActions(runbook);
  const tags = getTags(runbook);

  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(24,29,36,0.96),rgba(9,14,20,0.98))] shadow-[0_28px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.035)]">
      <header className="relative overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(circle_at_top_left,rgba(255,121,0,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300">
              <BookOpenCheck className="h-3.5 w-3.5" />
              Validated RCA runbook
            </div>

            <h1 className="mt-4 text-[1.75rem] font-semibold tracking-[-0.06em] text-white">
              {runbook.ticket_id || "Runbook"}
            </h1>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-white/52">
              {runbook.incident_summary ||
                "Saved RCA démarche and engineer validation details."}
            </p>
          </div>

          <button
            onClick={onOpenRca}
            className="orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[1rem] border border-orange-400/18 bg-orange-500/12 px-4 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/18"
          >
            Open RCA page
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-orange-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading full runbook details...
          </div>
        ) : null}
      </header>

      <div className="grid gap-px bg-white/[0.06] md:grid-cols-4">
        <InfoCell label="Approved family" value={runbook.approved_family || "—"} />
        <InfoCell label="Site" value={runbook.site_name || runbook.site_id || "—"} />
        <InfoCell label="Region" value={runbook.region || "—"} />
        <InfoCell label="Reusable" value={getReusableStatus(runbook)} />
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <RunbookSection
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Engineer validation notes"
          subtitle="Human decision and operational interpretation"
        >
          <p className="text-sm leading-7 text-white/68">
            {runbook.engineer_notes || "No engineer notes saved for this runbook."}
          </p>
        </RunbookSection>

        <RunbookSection
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Final conclusion"
          subtitle="Approved RCA conclusion after validation"
        >
          <p className="text-sm leading-7 text-white/68">
            {runbook.final_conclusion ||
              "No final conclusion saved for this runbook."}
          </p>
        </RunbookSection>

        <div className="grid gap-4 xl:grid-cols-2">
          <RunbookSection
            icon={<ClipboardList className="h-4 w-4" />}
            title="Recommended checks"
            subtitle="Diagnostic démarche to repeat for similar incidents"
          >
            <NumberedList items={checks} empty="No checks saved." />
          </RunbookSection>

          <RunbookSection
            icon={<BrainCircuit className="h-4 w-4" />}
            title="Recommended actions"
            subtitle="Operational steps validated by the engineer"
          >
            <NumberedList items={actions} empty="No actions saved." />
          </RunbookSection>
        </div>

        <RunbookSection
          icon={<Tag className="h-4 w-4" />}
          title="Tags and metadata"
          subtitle="Classification and reuse context"
        >
          <div className="flex flex-wrap gap-2">
            {tags.length ? (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-200"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-white/40">No tags saved.</span>
            )}
          </div>

          <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
            <MetaPill label="Report ID" value={runbook.report_id || "—"} />
            <MetaPill label="Created by" value={runbook.created_by || "—"} />
            <MetaPill
              label="Created at"
              value={runbook.created_at ? formatDate(runbook.created_at) : "—"}
            />
          </div>
        </RunbookSection>
      </div>
    </section>
  );
}

function InfoCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-h-[82px] bg-[rgba(255,255,255,0.018)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function RunbookSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.15rem] border border-white/[0.06] bg-[#080d13] p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-orange-400/16 bg-orange-500/10 text-orange-300">
          {icon}
        </span>

        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-white/40">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function NumberedList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) {
    return <p className="text-sm leading-6 text-white/42">{empty}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-3 rounded-[0.9rem] border border-white/[0.05] bg-white/[0.025] px-3 py-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-400/18 bg-orange-500/10 text-xs font-bold text-orange-300">
            {index + 1}
          </span>

          <p className="pt-0.5 text-sm leading-6 text-white/72">{item}</p>
        </div>
      ))}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.9rem] border border-white/[0.06] bg-white/[0.025] px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/32">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function RunbookLoadingList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-32 animate-pulse rounded-[1.05rem] border border-white/[0.06] bg-white/[0.025]"
        />
      ))}
    </div>
  );
}

function EmptyRunbookList({ query }: { query: string }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.1rem] border border-white/[0.06] bg-white/[0.025] px-5 text-center">
      <FileSearch className="h-10 w-10 text-white/24" />
      <h3 className="mt-4 text-base font-semibold text-white">
        No runbooks found
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/42">
        {query
          ? `No saved RCA runbook matched "${query}".`
          : "Publish a runbook from the RCA page, then it will appear here."}
      </p>
    </div>
  );
}

function NoRunbookSelected() {
  return (
    <section className="flex min-h-[620px] flex-col items-center justify-center rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(24,29,36,0.96),rgba(9,14,20,0.98))] px-6 text-center">
      <LibraryBig className="h-12 w-12 text-white/25" />
      <h2 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-white">
        No runbook selected
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-white/45">
        Select a saved RCA runbook from the left list to inspect the validated
        diagnostic démarche.
      </p>
    </section>
  );
}

function normalizeRunbookSearchResponse(
  response: RunbookSearchResponse | RunbookEntry[]
): { total: number; items: RunbookEntry[] } {
  if (Array.isArray(response)) {
    return {
      total: response.length,
      items: response,
    };
  }

  const items = Array.isArray(response.items) ? response.items : [];

  return {
    total: response.total ?? items.length,
    items,
  };
}

function getChecks(runbook: RunbookEntry) {
  return (
    readStringArray(asRecord(runbook), ["checks", "approved_checks"]) || []
  );
}

function getActions(runbook: RunbookEntry) {
  return (
    readStringArray(asRecord(runbook), ["actions", "approved_actions"]) || []
  );
}

function getTags(runbook: RunbookEntry) {
  return readStringArray(asRecord(runbook), ["tags"]) || [];
}

function getReusableStatus(runbook: RunbookEntry) {
  return (
    readString(asRecord(runbook), ["is_reusable", "reusable_status"]) || "—"
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function isPrimitive(value: unknown) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      if (isPrimitive(value)) {
        return String(value);
      }
    }
  }

  return "";
}

function readStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value
        .filter((item) => item !== undefined && item !== null && item !== "")
        .map((item) => (isPrimitive(item) ? String(item) : ""))
        .filter(Boolean);
    }

    if (isPrimitive(value) && String(value).trim()) {
      return [String(value)];
    }
  }

  return null;
}

function normalizeText(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}