import type { MonitoringWidgetKind } from "@/types/monitoring";
import { WIDGET_LIBRARY } from "@/utils/monitoring-widgets";

type WidgetLibraryListProps = {
  onAddWidget: (kind: MonitoringWidgetKind) => void;
};

export default function WidgetLibraryList({
  onAddWidget,
}: WidgetLibraryListProps) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {WIDGET_LIBRARY.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => onAddWidget(item.kind)}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-left transition hover:bg-white/[0.06]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">{item.label}</div>
              <div className="mt-1 text-xs text-white/45">
                {item.description}
              </div>
            </div>

            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white/55">
              {item.defaultSize}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}