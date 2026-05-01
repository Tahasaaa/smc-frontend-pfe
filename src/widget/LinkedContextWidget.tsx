import { useMemo } from "react";

type LinkedContextWidgetProps = {
  filters: {
    technology?: string;
    region_code?: string;
    rnc?: string;
    dateRange?: string;
    kpiFocus?: string;
  };
  worstCells: unknown[];
  onOpenMap?: (payload?: unknown) => void;
  onOpenIncidents?: (payload?: unknown) => void;
};

type WorstCellRow = {
  nodeb_name: string;
  rnc: string;
  region_code: string;
  health_score: number | null;
  avg_cssr_ps: number | null;
  avg_ps_rab_sr: number | null;
  avg_throughput: number | null;
  avg_iub: number | null;
  avg_drop: number | null;
};

export default function LinkedContextWidget({
  filters,
  worstCells,
  onOpenMap,
  onOpenIncidents,
}: LinkedContextWidgetProps) {
  const rows = useMemo(() => normalizeWorstCells(worstCells), [worstCells]);

  const derivedContext = useMemo(() => {
    const topRnc = mostFrequent(rows.map((row) => row.rnc).filter(Boolean));
    const topRegion = mostFrequent(
      rows.map((row) => row.region_code).filter(Boolean)
    );
    const topReason = mostFrequent(rows.map((row) => deriveReason(row)));
    const worstHealth = rows.reduce<number | null>((acc, row) => {
      if (typeof row.health_score !== "number") return acc;
      if (acc === null) return row.health_score;
      return Math.min(acc, row.health_score);
    }, null);

    return {
      topRnc: topRnc || "—",
      topRegion: topRegion || "—",
      topReason: topReason || "General degradation",
      worstHealth,
      focusKpi: formatFocusLabel(filters.kpiFocus || "avg_cssr_ps"),
      scope: filters.rnc || filters.region_code || "National",
    };
  }, [filters.kpiFocus, filters.region_code, filters.rnc, rows]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <header className="border-b border-white/[0.06] bg-[#0f1722]/70 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Linked Context
            </h3>
            <p className="mt-1 text-xs text-white/45">
              Cross-page operational context for map, incidents, and current monitoring focus.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <TopMeta label="Technology" value={filters.technology || "3G"} />
            <TopMeta label="Scope" value={derivedContext.scope} />
            <TopMeta label="Focused KPI" value={derivedContext.focusKpi} />
          </div>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <ActionCard
            title="Open on Map"
            description="Jump to the live cartography workspace using the current monitoring context."
            onClick={() =>
              onOpenMap?.({
                technology: filters.technology,
                rnc: filters.rnc,
                region_code: filters.region_code,
                kpiFocus: filters.kpiFocus,
              })
            }
          />

          <ActionCard
            title="Open Incidents"
            description="Review related incident context for degraded sites and investigations."
            onClick={() =>
              onOpenIncidents?.({
                technology: filters.technology,
                rnc: filters.rnc,
                region_code: filters.region_code,
                kpiFocus: filters.kpiFocus,
              })
            }
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <InfoTile
            label="Worst Rows"
            value={String(rows.length)}
          />
          <InfoTile
            label="Dominant Reason"
            value={derivedContext.topReason}
          />
          <InfoTile
            label="Most Affected RNC"
            value={derivedContext.topRnc}
          />
          <InfoTile
            label="Most Affected Region"
            value={derivedContext.topRegion}
          />
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#09111a] px-4 py-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Current operational note
          </p>

          <p className="mt-3 text-sm text-white/80">
            The current monitoring focus is centered on{" "}
            <span className="font-semibold text-white">
              {derivedContext.focusKpi}
            </span>{" "}
            within{" "}
            <span className="font-semibold text-white">
              {derivedContext.scope}
            </span>
            . The highest observed degradation pattern is{" "}
            <span className="font-semibold text-white">
              {derivedContext.topReason}
            </span>
            , with the strongest concentration currently around{" "}
            <span className="font-semibold text-white">
              {derivedContext.topRnc}
            </span>
            .
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <StatusPill
              label="Worst Health"
              value={
                derivedContext.worstHealth === null
                  ? "—"
                  : derivedContext.worstHealth.toFixed(1)
              }
              tone={
                derivedContext.worstHealth !== null &&
                derivedContext.worstHealth < 80
                  ? "critical"
                  : derivedContext.worstHealth !== null &&
                    derivedContext.worstHealth < 90
                  ? "warning"
                  : "good"
              }
            />
            <StatusPill
              label="Scope Window"
              value={filters.dateRange || "24h"}
              tone="default"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-[#101925] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
            Suggested drill path
          </p>

          <div className="mt-3 space-y-2">
            <DrillStep
              index="01"
              text="Inspect the main trend workbench for threshold breach moments."
            />
            <DrillStep
              index="02"
              text="Open the map to verify spatial concentration and affected sites."
            />
            <DrillStep
              index="03"
              text="Open incidents to confirm active operational context or missing alarms."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function normalizeWorstCells(input: unknown[]): WorstCellRow[] {
  if (!Array.isArray(input)) return [];

  return input.map((item) => {
    const row = (item ?? {}) as Record<string, unknown>;

    return {
      nodeb_name: asString(row.nodeb_name),
      rnc: asString(row.rnc),
      region_code: asString(row.region_code),
      health_score: asNumber(row.health_score),
      avg_cssr_ps: asNumber(row.avg_cssr_ps),
      avg_ps_rab_sr: asNumber(row.avg_ps_rab_sr),
      avg_throughput: asNumber(row.avg_throughput),
      avg_iub: asNumber(row.avg_iub),
      avg_drop: asNumber(row.avg_drop),
    };
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatFocusLabel(value: string) {
  if (value === "avg_cssr_ps") return "CSSR-PS";
  if (value === "avg_ps_rab_sr") return "PS RAB SR";
  if (value === "avg_throughput") return "Throughput";
  if (value === "avg_iub_congestion") return "IUB Congestion";
  if (value === "avg_call_drop_dch") return "Drop Rate";
  return value;
}

function deriveReason(row: WorstCellRow) {
  if (typeof row.avg_drop === "number" && row.avg_drop > 2.5) {
    return "High drop rate";
  }
  if (typeof row.avg_iub === "number" && row.avg_iub > 7) {
    return "IUB congestion";
  }
  if (typeof row.avg_cssr_ps === "number" && row.avg_cssr_ps < 92) {
    return "Low CSSR";
  }
  if (typeof row.avg_ps_rab_sr === "number" && row.avg_ps_rab_sr < 92) {
    return "Low PS RAB SR";
  }
  if (typeof row.avg_throughput === "number" && row.avg_throughput < 650) {
    return "Low throughput";
  }
  return "Health degradation";
}

function mostFrequent(values: string[]) {
  if (!values.length) return null;

  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  let winner: string | null = null;
  let max = -1;

  counts.forEach((count, key) => {
    if (count > max) {
      winner = key;
      max = count;
    }
  });

  return winner;
}

function TopMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-white/82">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/[0.06] bg-[#101925] px-4 py-3 text-left transition hover:bg-white/[0.04]"
    >
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-white/48">{description}</p>
    </button>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white/82">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warning" | "critical" | "default";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : tone === "critical"
      ? "border-red-500/20 bg-red-500/10 text-red-300"
      : "border-white/[0.06] bg-white/[0.03] text-white/78";

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[10px] uppercase tracking-[0.1em] opacity-75">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function DrillStep({
  index,
  text,
}: {
  index: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
      <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/55">
        {index}
      </span>
      <p className="text-xs text-white/74">{text}</p>
    </div>
  );
}