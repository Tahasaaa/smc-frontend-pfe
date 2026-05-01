type MapEmptyStateProps = {
  title?: string;
  description?: string;
};

export default function MapEmptyState({
  title = "No site markers available",
  description = "No 3G sites match the current date, RNC, or status filters.",
}: MapEmptyStateProps) {
  return (
    <section className="absolute inset-0 flex items-center justify-center bg-[#08111a]">
      <div className="w-full max-w-xl rounded-[1.3rem] border border-white/[0.06] bg-[#0d141c] px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_30px_rgba(0,0,0,0.22)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <div className="h-3.5 w-3.5 rounded-full bg-white/25" />
        </div>

        <div>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-2 mx-auto max-w-md text-sm text-white/45">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}