type MonitoringEmptyStateProps = {
  onUseRecommendedLayout: () => void;
  onCustomizeNow: () => void;
};

export default function MonitoringEmptyState({
  onUseRecommendedLayout,
  onCustomizeNow,
}: MonitoringEmptyStateProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d141c] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
      <div className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
            Monitoring workspace setup
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white md:text-3xl">
            Build your personal monitoring workbench
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/50 md:text-base">
            Choose KPI tiles, chart types, and observability widgets based on the
            network behavior you want to monitor most.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onUseRecommendedLayout}
              className="rounded-lg border border-[#ff7900]/20 bg-[#ff7900]/12 px-4 py-2.5 text-sm font-medium text-[#ffb26b] transition hover:bg-[#ff7900]/18 hover:text-white"
            >
              Use Recommended Layout
            </button>

            <button
              type="button"
              onClick={onCustomizeNow}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            >
              Customize Now
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 text-left md:grid-cols-3">
            <EmptyStateCard
              title="KPI strip"
              description="Pin the indicators you need first for fast live health scanning."
            />
            <EmptyStateCard
              title="Widget grid"
              description="Add trends, rankings, distributions, radar, gauge, and table modules."
            />
            <EmptyStateCard
              title="Saved profile"
              description="Keep a personal workspace layout that reloads every time you sign in."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#09121a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="text-sm font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
    </div>
  );
}