type PresetId =
  | "default"
  | "radio-health"
  | "congestion-focus"
  | "executive-view"
  | "investigation-view";

type PresetsTabProps = {
  currentProfileName: string;
  onLoadPreset: (presetId: PresetId) => void;
};

const PRESETS: Array<{
  id: PresetId;
  title: string;
  description: string;
}> = [
  {
    id: "default",
    title: "Default Profile",
    description:
      "Balanced starter layout with primary trends, ranking, worst cells, distribution, radar, and gauge widgets.",
  },
  {
    id: "radio-health",
    title: "Radio Health",
    description:
      "Focuses on CSSR, PS RAB, drop, throughput, and radio service quality monitoring.",
  },
  {
    id: "congestion-focus",
    title: "Congestion Focus",
    description:
      "Prioritizes radio and IUB congestion behavior, congestion distribution, and related degradation patterns.",
  },
  {
    id: "executive-view",
    title: "Executive View",
    description:
      "Cleaner high-level observability layout with fewer dense diagnostic widgets.",
  },
  {
    id: "investigation-view",
    title: "Investigation View",
    description:
      "More operational layout with stronger emphasis on offender tables and diagnostic analysis.",
  },
];

export default function PresetsTab({
  currentProfileName,
  onLoadPreset,
}: PresetsTabProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/[0.06] bg-[#09121a] p-4">
        <h3 className="text-sm font-semibold text-white">Workspace Presets</h3>
        <p className="mt-1 text-xs text-white/45">
          Load a recommended monitoring layout based on operational focus.
        </p>

        <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-3">
          <div className="text-[11px] uppercase tracking-[0.1em] text-white/35">
            Current Profile
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            {currentProfileName}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white">
                    {preset.title}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/45">
                    {preset.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onLoadPreset(preset.id)}
                  className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                >
                  Load
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}