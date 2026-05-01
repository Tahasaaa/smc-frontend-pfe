import {
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";

type MonitoringHeaderProps = {
  profileName: string;
  onCustomize: () => void;
  onAddWidget: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
};

export default function MonitoringHeader({
  profileName,
  onCustomize,
  onAddWidget,
  onSaveLayout,
  onResetLayout,
}: MonitoringHeaderProps) {
  return (
    <section className="premium-panel rounded-[1.45rem]">
      <div className="premium-panel-body px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="section-eyebrow">Monitoring operations console</p>
            <h2 className="mt-2 text-[1.15rem] font-semibold tracking-[-0.04em] text-white md:text-[1.3rem]">
              Monitoring Workbench
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
              Personalized KPI supervision surface for trend analysis, scoped
              investigation, and premium observability workflows.
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="premium-toolbar-pill">
                <LayoutTemplate className="h-3.5 w-3.5 text-[#ff7900]" />
                Active profile
              </span>

              <span className="rounded-[1rem] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/72">
                <span className="text-white/42">Profile</span>
                <span className="ml-2 text-white">{profileName}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onCustomize}
                className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Customize
              </button>

              <button
                type="button"
                onClick={onAddWidget}
                className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Add widget
              </button>

              <button
                type="button"
                onClick={onSaveLayout}
                className="premium-button orange-ring-focus"
              >
                <Save className="h-4 w-4" />
                Save layout
              </button>

              <button
                type="button"
                onClick={onResetLayout}
                className="premium-button-ghost orange-ring-focus text-white/70 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}