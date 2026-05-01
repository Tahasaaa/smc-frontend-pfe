type MapLoadingStateProps = {
  title?: string;
  description?: string;
};

export default function MapLoadingState({
  title = "Loading cartography workspace",
  description = "Fetching site markers, counters, and operational context.",
}: MapLoadingStateProps) {
  return (
    <section className="premium-panel rounded-[1.45rem]">
      <div className="premium-panel-body flex min-h-[560px] flex-col items-center justify-center px-6 text-center">
        <div className="boot-logo-ring mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_0_30px_rgba(255,121,0,0.08)]">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-md border border-[#ff7900]/40" />
            <div className="h-3.5 w-3.5 rounded-sm bg-[#ff7900]" />
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm text-white/45">{description}</p>
        </div>

        <div className="mt-5 h-2 w-56 overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.04]">
          <div className="boot-progress h-full w-2/3 rounded-full bg-[#ff7900]" />
        </div>
      </div>
    </section>
  );
}